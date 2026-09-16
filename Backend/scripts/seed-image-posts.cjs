/**
 * Seeds the IMAGE-side RAG pool from a folder of past graphic design posts.
 *
 * For every image in the folder this script:
 *   1. embeds the image with CLIP (Python image-service, `/embed-image`)
 *      and stores the vector in `post_image_embeddings` (source 'sample');
 *   2. (default) asks Gemini vision for a one-sentence style description of
 *      the design, stores it as the post's caption AND text-embeds it with
 *      `gemini-embedding-001` into `post_embeddings` — so the folder posts
 *      are retrievable on BOTH axes (visual via CLIP, textual via Gemini);
 *   3. copies the image into `Backend/public/reference-posts/` so it can be
 *      attached to generation calls as a style reference.
 *
 * Usage (from Backend/):
 *   node scripts/seed-image-posts.cjs                        # ../Social Media Posts
 *   node scripts/seed-image-posts.cjs "D:\\path\\to\\folder" # custom folder
 *   node scripts/seed-image-posts.cjs --force                # wipe + reseed
 *   node scripts/seed-image-posts.cjs --no-describe          # CLIP only, no Gemini vision
 *   node scripts/seed-image-posts.cjs --limit 5              # only first N images
 *
 * Requires: Postgres running (DB_* in .env), the Python image-service
 * running on :8000 (CLIP model auto-downloads on first call), and
 * GEMINI_API_KEY in .env unless --no-describe is used.
 */
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');
const { Client } = require('pg');

config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const EMBED_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const DIMENSIONS = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 768);
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash';
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:8000';

const BACKEND_DIR = path.join(__dirname, '..');
const DEFAULT_FOLDER = path.join(BACKEND_DIR, '..', 'Social Media Posts');
const PUBLIC_REF_DIR = path.join(BACKEND_DIR, 'public', 'reference-posts');

const SEED_TAG = 'image-folder'; // style_metadata.seed marker for rows created here

/** Caption prompt for the Gemini vision pass (design style catalogue entry). */
const CAPTION_PROMPT =
  'You are cataloguing finished social-media post designs for a design style library. ' +
  'Describe THIS design in one dense sentence of at most 35 words covering: the subject/topic, ' +
  'palette, layout and composition, typography style, mood, and the likely industry. ' +
  'No preamble, no bullet points — just the sentence.';

/** Supported source extensions. */
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

// ---- HELPERS ----

/** Lists the image files of the folder (sorted for stable ordering). */
function listImages(folder) {
  return fs
    .readdirSync(folder)
    .filter((name) => EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => path.join(folder, name));
}

/** Filesystem-safe slug from the original file name. */
function slugify(name) {
  const base = name.replace(/\.(png|jpe?g)$/i, '');
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'post'
  );
}

/** Embeds one image via the Python CLIP endpoint. */
async function embedImage(buffer, mimeType, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), filename);
  const response = await fetch(`${IMAGE_SERVICE_URL}/embed-image`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`embed-image ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error('embed-image returned no vector');
  }
  return {
    vector: data.embedding.map(Number),
    model: String(data.model || 'unknown'),
    dims: Number(data.dimensions || data.embedding.length),
  };
}

/** One-sentence design caption via the Gemini vision model (with 429 backoff). */
async function describeImage(buffer, mimeType) {
  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await describeImageOnce(buffer, mimeType);
    } catch (error) {
      lastError = error;
      const retriable = /\b429\b|RESOURCE_EXHAUSTED|rate.?limit/i.test(error.message);
      if (!retriable || attempt === attempts) {
        break;
      }
      const waitMs = attempt * 20_000;
      console.warn(`    caption rate-limited — retry ${attempt}/${attempts - 1} in ${waitMs / 1000}s…`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function describeImageOnce(buffer, mimeType) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: buffer.toString('base64') } },
              { text: CAPTION_PROMPT },
            ],
          },
        ],
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Vision API ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) {
    throw new Error('Vision API returned no text');
  }
  return text;
}

/** Embeds text with the Gemini embedding API (same call as seed-sample-posts). */
async function embedText(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: DIMENSIONS,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Embedding API ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const values = data.embedding && data.embedding.values;
  if (!Array.isArray(values) || values.length !== DIMENSIONS) {
    throw new Error(`Unexpected embedding (dims: ${values ? values.length : 'none'})`);
  }
  return values;
}

// ---- MAIN ----

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const describe = !args.includes('--no-describe');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? Number(args[limitIndex + 1]) : NaN;
  const folderArg = args.find(
    (arg, index) => !arg.startsWith('--') && index !== limitIndex + 1,
  );
  const folder = folderArg ? path.resolve(folderArg) : DEFAULT_FOLDER;

  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }
  const doDescribe = describe && Boolean(GEMINI_API_KEY);
  if (describe && !doDescribe) {
    console.warn('GEMINI_API_KEY missing — falling back to CLIP-only seeding.');
  }

  const files = listImages(folder).slice(0, Number.isFinite(limit) ? limit : Infinity);
  if (files.length === 0) {
    console.error(`No .png/.jpg images found in ${folder}`);
    process.exit(1);
  }
  console.log(
    `Seeding image pool from ${folder} (${files.length} file(s), describe=${doDescribe})…`,
  );

  // Preflight: the Python CLIP endpoint must be up (first call loads the model).
  const health = await fetch(`${IMAGE_SERVICE_URL}/embedding-health`)
    .then((response) => response.json())
    .catch(() => null);
  if (!health) {
    console.error(`Image service unreachable at ${IMAGE_SERVICE_URL} — start it first:`);
    console.error(
      '  cd image-service && ..\\.venv\\Scripts\\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000',
    );
    process.exit(1);
  }
  console.log(`CLIP endpoint OK (model: ${health.model || 'unknown'}, loaded: ${health.loaded}).`);

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Social Yolo',
  });
  await client.connect();

  // Table exists even when the backend has not created it yet (mirrors the entity).
  await client.query(`
    CREATE TABLE IF NOT EXISTS post_image_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      image_path text NOT NULL,
      source text NOT NULL,
      model text NOT NULL,
      dims integer NOT NULL,
      embedding real[] NOT NULL,
      style_metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // ---- LOOP ----

  if (force) {
    // Remove this script's earlier rows (posts cascade to both embedding
    // tables) and the copied reference files.
    const previous = await client.query(
      `SELECT p.id, e.image_path FROM posts p
       JOIN post_image_embeddings e ON e.post_id = p.id
       WHERE e.source = 'sample' AND e.style_metadata->>'seed' = $1`,
      [SEED_TAG],
    );
    for (const row of previous.rows) {
      const filePath = path.join(BACKEND_DIR, 'public', row.image_path);
      fs.promises.unlink(filePath).catch(() => {});
    }
    const deleted = await client.query(
      `DELETE FROM posts p USING post_image_embeddings e
       WHERE e.post_id = p.id AND e.source = 'sample' AND e.style_metadata->>'seed' = $1`,
      [SEED_TAG],
    );
    console.log(`--force: removed ${deleted.rowCount} previously seeded image post(s).`);
  }

  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  for (let index = 0; index < files.length; index += 1) {
    const filePath = files[index];
    const originalName = path.basename(filePath);
    const progress = `[${index + 1}/${files.length}]`;

    // Resume support: skip files already ingested. When captions are enabled,
    // files that were seeded WITHOUT a caption (e.g. during a rate-limit
    // burst) are re-ingested so they can pick one up.
    const exists = await client.query(
      `SELECT e.id, e.style_metadata->>'captioned' AS captioned
       FROM post_image_embeddings e
       WHERE e.source = 'sample' AND e.style_metadata->>'seed' = $1
         AND e.style_metadata->>'original_name' = $2`,
      [SEED_TAG, originalName],
    );
    if (exists.rows.length > 0) {
      const captioned = exists.rows[0].captioned === 'true';
      if (!doDescribe || captioned) {
        skipped += 1;
        console.log(`  ${progress} skip (already seeded${captioned ? ' + captioned' : ''}): ${originalName}`);
        continue;
      }
      // Re-ingest: remove the caption-less post (cascades to both embedding
      // tables) and its copied reference file.
      const stale = await client.query(
        `SELECT post_id, image_path FROM post_image_embeddings WHERE id = $1`,
        [exists.rows[0].id],
      );
      if (stale.rows[0]) {
        fs.promises
          .unlink(path.join(BACKEND_DIR, 'public', stale.rows[0].image_path))
          .catch(() => {});
        await client.query(`DELETE FROM posts WHERE id = $1`, [stale.rows[0].post_id]);
      }
      console.log(`  ${progress} re-seeding without caption: ${originalName}`);
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const mimeType = /\.jpe?g$/i.test(originalName) ? 'image/jpeg' : 'image/png';

      const clip = await embedImage(buffer, mimeType, originalName);

      // Optional Gemini vision caption → short brief + text-side embedding.
      let userPrompt = slugify(originalName).replace(/-/g, ' ');
      let textEmbedding = null;
      if (doDescribe) {
        try {
          userPrompt = await describeImage(buffer, mimeType);
          textEmbedding = await embedText(userPrompt);
          // Stay under the free-tier requests-per-minute limit.
          await new Promise((resolve) => setTimeout(resolve, 2_000));
        } catch (error) {
          console.warn(`    caption failed (${error.message}) — using file name as brief.`);
        }
      }

      await ingestPost(client, {
        sourcePath: filePath,
        originalName,
        index,
        userPrompt,
        clip,
        textEmbedding,
      });

      seeded += 1;
      console.log(
        `  ${progress} seeded: ${originalName} → ${imagePathOf(index, originalName)} ` +
          `(clip ${clip.dims}d${textEmbedding ? ' + caption text-embed' : ''})`,
      );
    } catch (error) {
      failed += 1;
      console.error(`  ${progress} FAILED ${originalName}: ${error.message}`);
    }
  }

  console.log(`Done. Seeded ${seeded}, skipped ${skipped} (already present), failed ${failed}.`);
  await client.end();
}

/** Copy path (relative to Backend/public) for the given source file. */
function imagePathOf(index, originalName) {
  const fileName = `${String(index + 1).padStart(3, '0')}-${slugify(originalName)}${path
    .extname(originalName)
    .toLowerCase()}`;
  return `reference-posts/${fileName}`;
}

/** Persists one folder image: post row + CLIP embedding + optional text embedding. */
async function ingestPost(client, { sourcePath, originalName, index, userPrompt, clip, textEmbedding }) {
  const fileName = path.basename(imagePathOf(index, originalName));
  const imagePath = imagePathOf(index, originalName);
  fs.mkdirSync(PUBLIC_REF_DIR, { recursive: true });
  fs.copyFileSync(sourcePath, path.join(PUBLIC_REF_DIR, fileName));

  const post = await client.query(
    `INSERT INTO posts (user_id, user_prompt, final_prompt, image_path, rating)
     VALUES (NULL, $1, NULL, $2, NULL) RETURNING id`,
    [userPrompt, imagePath],
  );
  const postId = post.rows[0].id;

  await client.query(
    `INSERT INTO post_image_embeddings
       (post_id, image_path, source, model, dims, embedding, style_metadata)
     VALUES ($1, $2, 'sample', $3, $4, $5, $6)`,
    [
      postId,
      imagePath,
      clip.model,
      clip.dims,
      clip.vector,
      JSON.stringify({
        seed: SEED_TAG,
        original_name: originalName,
        // 'true' = the brief came from Gemini vision, 'false' = file-name fallback.
        captioned: textEmbedding ? 'true' : 'false',
      }),
    ],
  );

  if (textEmbedding) {
    await client.query(
      `INSERT INTO post_embeddings (post_id, content_text, source, embedding, style_metadata)
       VALUES ($1, $2, 'sample', $3, $4)`,
      [postId, userPrompt, textEmbedding, JSON.stringify({ seed: SEED_TAG, image_seeded: true })],
    );
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
