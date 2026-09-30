# ==================== RAG PROMPT ARCHITECTURE ====================

Everything that shapes a generated post lives in the files below. This is the
complete map — read this before changing generation behaviour.

## 1. The prompt file

**`src/post-generator/rag/prompt-builder.service.ts`** is the single file that
assembles every prompt sent to Gemini. This is the file to edit.

| Method | Purpose |
|---|---|
| `buildPlannerPrompt()` | Stage‑1 prompt → Gemini **text** model. Turns the brief + RAG references into a JSON design plan. |
| `buildRendererPromptFromPlan()` | ⭐ **The final prompt** → Gemini **image** model. Adds the hard rendering contracts to the planner's decision. |
| `buildFinalPrompt()` | Used when the planner stage fails. Builds the same contract directly from the brief. |
| `buildCompactImagePrompt()` | Short form for `IMAGE_PROVIDER=pollinations`. |
| `getArchetypeGuidelines()` | Per‑archetype art direction (7 archetypes). |
| `buildNegativePrompt()` | The exhaustive "do not render" list. |
| `buildReferenceDossier()` | Turns retrieved references into numbered, labelled cards. |

### The seven blocks of a final prompt

Order matters — image models weight the tail of a prompt most heavily.

1. **CREATIVE DIRECTION** — the planner's prose, verbatim
2. **ATTACHMENT SPECS** — what each uploaded image is and what it may be used for
3. **TYPOGRAPHY CONTRACT** — exact strings, counts, positions (kills gibberish text)
4. **COMPOSITION CONTRACT** — aspect‑ratio‑aware layout + palette
5. **RAG REFERENCE NOTES** — the transferable traits of the retrieved designs
6. **NEGATIVE PROMPT** — forbidden artefacts
7. **PRODUCTION STANDARDS** — camera, optics, lighting, resolution

## 2. The retrieval layer

**`src/post-generator/rag/retriever.service.ts`**

Three reference pools:

| Pool | Source | Gate |
|---|---|---|
| Personal | Posts this account rated 4★+ | `rating >= 4` |
| Global | Curated sample posts | always |
| Library | Style Reference Library entries | `is_active = true` |

**Hybrid ranking** (weights sum > 1 on purpose — it is a rank, not a probability):

```
score = 0.62·cosine + 0.14·category + 0.12·quality + 0.07·recency + 0.05·lexical
        + 0.04 bonus for proven personal taste
```

Finalists are then diversified with **Maximal Marginal Relevance** (λ = 0.75)
so the prompt never receives three near‑duplicates of the same look.

The corpus is cached in‑process for 45 s. Writers (feedback, library CRUD) call
`invalidateCache()` so changes are visible immediately.

> Cosine is computed in the app because pgvector is not installed. Upgrade path:
> change `embedding` to `vector(768)` and replace the body of `loadCorpus()` with
> a single `<=>` query.

## 3. The query

**`buildRetrievalQuery()`** in `post-generator.service.ts` composes a natural
language brief from *every* field the user supplied:

```
Velvet Matte Lipstick: Editorial launch for a limited-run matte berry lipstick.
industry: beauty. campaign type: launch. design style: luxury.
platform: instagram. message: THE BERRY EDIT. palette: #5b1030, #d4af6a
```

Embedding only `dto.prompt` (the old behaviour) gives the model almost no
semantic surface — "50% off" would happily match a festival post. This is the
single biggest lever on retrieval quality.

## 4. The Style Reference Library (the UI path to the vector DB)

This replaces `scripts/seed-sample-posts.cjs`. No script, no manual embedding.

```
src/style-references/
  entities/style-reference.entity.ts   the `style_references` table
  style-reference.service.ts            upload → Vision → embed → store
  style-reference.controller.ts         REST API (JWT required)
  starter-library.ts                    12 curated global playbooks
```

**Flow:** upload image → Gemini Vision writes its *design language* in words
(lighting, composition, typography, palette, mood) → that text **and** the image
are embedded → retrievable on the very next generation, and the image is
attached to the renderer as a visual anchor.

### Pages

| Page | Route | Who |
|---|---|---|
| My Style References | `/dashboard/references` | any signed-in user |
| RAG Knowledge Base | `/admin/knowledge` | admin (global pool, seeding, reindex) |
| Prompt Lab | `/admin/prompt-lab` | admin (inspect the exact prompts, free) |

### API

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/style-references` | multipart `file` + metadata. Auto-analysed + embedded. |
| `GET` | `/api/style-references` | `?scope=all\|global\|mine&category=&search=` |
| `GET` | `/api/style-references/stats` | corpus counts + embedding config |
| `PATCH` | `/api/style-references/:id` | re-embeds when text changes |
| `DELETE` | `/api/style-references/:id` | removes the row and the file |
| `POST` | `/api/style-references/:id/scope` | admin: promote/demote to global |
| `POST` | `/api/style-references/seed-starter-library` | admin, idempotent |
| `POST` | `/api/style-references/reindex?force=` | admin |
| `POST` | `/api/posts/preview-prompt` | Prompt Lab — no image, no credit |

### Storage gotcha

Uploads live in `public/uploads/style-refs/`, **not** `public/style-references/`.
`main.ts` serves `public/` under both `/` and `/api/`, so a folder named after an
API route shadows that route with a 301 from `serve-static`. Static assets are
also registered with `redirect: false` so this class of shadowing 404s instead of
silently redirecting.

## 5. Environment tuning

```env
GEMINI_API_KEY=...              # MUST be unquoted and must not start with "#"
GEMINI_TEXT_MODEL=models/gemini-3.8-flash
GEMINI_IMAGE_MODEL=models/gemini-2.5-flash-image
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=768

RAG_MAX_REFERENCES=7            # text references in the planner prompt
RAG_MIN_SIMILARITY=0.3          # below this a reference is not injected
GEMINI_MAX_STYLE_REFS=2         # reference IMAGES attached (0-4)
```

> ⚠️ **Gotcha:** a `.env` value that starts with `#` is parsed as a *comment* by
> dotenv, and a leading `#` also makes a Google key invalid. This silently
> disabled the entire RAG layer once — if retrieval is dead, check this first.
>
> `gemini-2.5-flash` was retired by Google and now returns 404. That silently
> disabled the Stage-1 planner. Check `tmp-start.log` / the backend console for
> `404 ... no longer available` if the planner seems absent.

## 6. Auto-indexing

Every generated post is embedded immediately after creation
(`indexPostForRetrieval()`), not only when rated. The retriever still gates the
*personal* pool on `rating >= 4`, so unrated posts are stored for free but never
injected into a prompt. The corpus therefore grows with usage instead of with
manual seeding.

---

# NestJS — original boilerplate


[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
