/**
 * Seeds the global sample-post pool used by the RAG retriever.
 *
 * Each sample is stored as a `posts` row (user_id NULL) plus a
 * `post_embeddings` row (source 'sample', style_metadata {seeded:true})
 * with a REAL 768-dim embedding from `gemini-embedding-001`.
 *
 * Usage (from Backend/):
 *   node scripts/seed-sample-posts.cjs            # seeds only if empty
 *   node scripts/seed-sample-posts.cjs --force    # wipes seeded samples and reseeds
 */
const { config } = require('dotenv');
const { Client } = require('pg');

config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const EMBED_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const DIMENSIONS = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 768);

/**
 * The global reference pool. `userPrompt` is the short brief a designer
 * would receive; `contentText` is the style description that gets
 * EMBEDDED — this is where the retrievable "style" lives.
 */
const SAMPLES = [
  {
    userPrompt: 'Eid sale post',
    contentText:
      'Festive Eid promotion. Deep emerald and gold palette with crescent and lantern motifs, ' +
      'generous white space around the headline, elegant serif typography for the greeting, ' +
      'bold sans-serif for the discount. Warm celebratory mood, retail industry.',
  },
  {
    userPrompt: 'Ramadan offer announcement',
    contentText:
      'Serene Ramadan announcement. Midnight blue and warm amber palette, subtle geometric ' +
      'arabesque pattern in the background, centered composition with soft glow, refined ' +
      'light typography, calm spiritual mood. Food and hospitality industry.',
  },
  {
    userPrompt: 'Black Friday 70% off',
    contentText:
      'High-urgency Black Friday deal. Black background with electric yellow accents, huge ' +
      'condensed numerals for the percentage, diagonal dynamic layout, torn-paper texture ' +
      'edges, aggressive bold mood. Fashion e-commerce industry.',
  },
  {
    userPrompt: 'New product launch',
    contentText:
      'Product launch hero post. Clean light-grey studio backdrop, product hero shot centered ' +
      'with soft drop shadow, thin sans-serif headline above, single accent color underline, ' +
      'minimal premium mood. Consumer electronics industry.',
  },
  {
    userPrompt: 'Restaurant grand opening',
    contentText:
      'Restaurant opening invitation. Warm terracotta and cream palette, appetizing dish photo ' +
      'in a circular frame, hand-drawn style script for the word "opening", date and time in a ' +
      'small badge, inviting friendly mood. Food and beverage industry.',
  },
  {
    userPrompt: 'Gym membership discount',
    contentText:
      'Fitness membership promo. Dark charcoal background with neon green highlights, athletic ' +
      'silhouette in motion, heavy italic sans-serif headline, angled energetic layout, ' +
      'motivational intense mood. Health and fitness industry.',
  },
  {
    userPrompt: 'Real estate open house',
    contentText:
      'Real estate open house post. Soft beige and navy palette, property photo with rounded ' +
      'corners top half, clean grid for details below, trustworthy serif headline, professional ' +
      'calm mood. Real estate industry.',
  },
  {
    userPrompt: 'Coffee shop loyalty program',
    contentText:
      'Cafe loyalty program post. Warm brown and latte-cream palette, coffee cup illustration ' +
      'with steam forming a heart, rounded friendly typography, stamped-card graphic, cozy ' +
      'welcoming mood. Cafe industry.',
  },
  {
    userPrompt: 'Free tech webinar',
    contentText:
      'Tech webinar announcement. Deep purple gradient with subtle circuit pattern, speaker ' +
      'portrait right third, bold white headline left, date/time in pill badges, modern ' +
      'informative mood. Technology industry.',
  },
  {
    userPrompt: 'Summer collection drop',
    contentText:
      'Summer fashion drop. Bright coral and turquoise palette, sun-drenched model photo with ' +
      'palm shadows, airy light typography with wide letter spacing, playful breezy mood. ' +
      'Fashion retail industry.',
  },
  {
    userPrompt: 'Salon spa day offer',
    contentText:
      'Salon spa offer post. Blush pink and soft gold palette, delicate floral line art in ' +
      'corners, elegant thin serif headline, soft-focus treatment photo, relaxing luxurious ' +
      'mood. Beauty and wellness industry.',
  },
  {
    userPrompt: 'Back to school sale',
    contentText:
      'Back-to-school promotion. Playful primary colors on white, stationery flat-lay with ' +
      'crayon-style doodles, rounded chunky headline, sticker-style price tags, cheerful ' +
      'energetic mood. Stationery retail industry.',
  },
];

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

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY missing in Backend/.env — cannot embed samples.');
    process.exit(1);
  }
  const force = process.argv.includes('--force');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Social Yolo',
  });
  await client.connect();

  const existing = await client.query(
    "SELECT count(*)::int AS n FROM post_embeddings WHERE source = 'sample' AND style_metadata->>'seeded' = 'true'",
  );
  const already = existing.rows[0].n;

  if (already > 0 && !force) {
    console.log(`Sample pool already seeded (${already} rows). Use --force to reseed.`);
    await client.end();
    return;
  }

  if (already > 0 && force) {
    // Remove previously seeded samples (posts cascade to their embeddings).
    const del = await client.query(
      `DELETE FROM posts p USING post_embeddings e
       WHERE e.post_id = p.id AND e.source = 'sample' AND e.style_metadata->>'seeded' = 'true'`,
    );
    console.log(`--force: removed ${del.rowCount} previously seeded sample(s).`);
  }

  let done = 0;
  for (const sample of SAMPLES) {
    const embedding = await embedText(sample.contentText);
    const post = await client.query(
      `INSERT INTO posts (user_id, user_prompt, final_prompt, image_path, rating)
       VALUES (NULL, $1, NULL, NULL, NULL) RETURNING id`,
      [sample.userPrompt],
    );
    await client.query(
      `INSERT INTO post_embeddings (post_id, content_text, source, embedding, style_metadata)
       VALUES ($1, $2, 'sample', $3, $4)`,
      [post.rows[0].id, sample.contentText, embedding, JSON.stringify({ seeded: true })],
    );
    done += 1;
    console.log(`  seeded ${done}/${SAMPLES.length}: "${sample.userPrompt}"`);
  }

  console.log(`Done. Sample pool now has ${SAMPLES.length} entries.`);
  await client.end();
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});