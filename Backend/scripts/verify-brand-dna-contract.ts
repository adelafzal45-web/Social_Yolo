/**
 * Ad-hoc verification of the BRAND DNA + digital-archetype contract.
 *
 * Run with:  npx ts-node -P tsconfig.json scripts/verify-brand-dna-contract.ts
 *
 * This reproduces the exact bug that was reported:
 *   "I fetch the address website data, prompt says 'our website is live now',
 *    and it makes a cheese picture with the text above it."
 */
import {
  PromptBuilderService,
  DesignBriefContext,
} from '../src/post-generator/rag/prompt-builder.service';

const builder = new PromptBuilderService();

let failures = 0;
function check(name: string, condition: boolean, detail?: string): void {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures += 1;
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

/** The exact brief from the bug report, with the scraped brand DNA attached. */
const websiteBrief: DesignBriefContext = {
  prompt: 'Our website is live now',
  onImageText: 'Our website is live now',
  brandName: 'Adress',
  niche: 'Furniture & Home Decor',
  brandDescription:
    'Adress is a furniture company selling solid wood dining tables, chairs and wardrobes.',
  brandTagline: 'Furniture crafted for modern living',
  brandWebsiteUrl: 'https://adress.com',
  brandColors: ['#1b3a2f', '#c9a227', '#f5f1e8'],
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  tone: 'Luxury & Elegant',
  platform: 'instagram',
  aspectRatio: '1:1',
  style: 'luxury',
  hasLogo: true,
  showLogo: true,
};

const planner = builder.buildPlannerPrompt(websiteBrief, []);
const renderer = builder.buildRendererPromptFromPlan(
  'A hero composition on a walnut desk.',
  websiteBrief,
  [],
);
const fallback = builder.buildFinalPrompt(websiteBrief, [], 'gemini');
const compact = builder.buildCompactImagePrompt(websiteBrief, []);

console.log('\n=== SCENARIO 1: "our website is live now" => digital showcase, not cheese ===');
{
  check(
    'planner classifies as DIGITAL_SHOWCASE',
    /CLASSIFIED CAMPAIGN ARCHETYPE: DIGITAL_SHOWCASE/.test(planner),
  );
  check(
    'fallback classifies as DIGITAL_SHOWCASE',
    /CAMPAIGN ARCHETYPE: DIGITAL_SHOWCASE/.test(fallback),
  );
  check(
    'does NOT fall back to commercial_product',
    !/CAMPAIGN ARCHETYPE: COMMERCIAL_PRODUCT/.test(fallback),
  );
  check(
    'cheese-inducing "organic drops" language is gone',
    !/organic drops/.test(fallback),
  );
  check(
    'device is named as the hero subject',
    /laptop|monitor|tablet|phone/i.test(fallback),
  );
  check(
    'screen must show a web page',
    /web page|navigation bar|hero banner/i.test(fallback),
  );
}

console.log('\n=== SCENARIO 2: scraped brand DNA actually reaches the prompt ===');
{
  for (const [label, prompt] of [
    ['planner', planner],
    ['renderer', renderer],
    ['fallback', fallback],
  ] as const) {
    check(`${label}: has BRAND DNA block`, /### BRAND DNA/.test(prompt));
    check(
      `${label}: palette present as hex`,
      prompt.includes('#1b3a2f') &&
        prompt.includes('#c9a227') &&
        prompt.includes('#f5f1e8'),
    );
    check(
      `${label}: business description survives intact`,
      prompt.includes('solid wood dining tables'),
    );
    check(`${label}: tagline present`, prompt.includes('Furniture crafted for modern living'));
    check(`${label}: heading font applied`, prompt.includes('Playfair Display'));
    check(`${label}: website URL known`, prompt.includes('adress.com'));
  }

  check('palette is stated as a RULE, not a suggestion', /PALETTE RULE/.test(renderer));
  check(
    'renderer restates brand rules (separate model call)',
    /### BRAND DNA/.test(renderer),
  );
}

console.log('\n=== SCENARIO 3: negative prompt actively blocks the cheese ===');
{
  const negative = fallback.slice(fallback.indexOf('NEGATIVE PROMPT'));
  check(
    'bans food/merch as hero for a digital brief',
    /NO food, NO cheese/i.test(negative),
  );
  check('bans blank / lorem-ipsum screens', /lorem ipsum/i.test(negative));
  check(
    '"fake UI chrome" is NOT banned (it is the subject here)',
    !/fake UI chrome/.test(negative),
  );
}

console.log('\n=== SCENARIO 4: logo lands on the screen, not in a corner ===');
{
  check(
    'brand rule says on-screen page header',
    /inside that on-screen page header/i.test(renderer),
  );
  const attStart = renderer.indexOf('### ATTACHMENT SPECIFICATIONS');
  const attachments = renderer.slice(
    attStart,
    renderer.indexOf('### ON-CANVAS TEXT'),
  );
  check(
    'attachment spec agrees: logo goes in the page header',
    /inside the header of the website\/app/i.test(attachments),
  );
  check(
    'attachment spec does NOT also say "top-right" (no contradiction)',
    !/top-right/.test(attachments),
  );
  check(
    'renderer restates the archetype art direction',
    /CAMPAIGN ARCHETYPE \(authoritative\): DIGITAL_SHOWCASE/.test(renderer),
  );
  check(
    'renderer mandates a legible on-screen page',
    /screen is fully legible|web page filling the display/i.test(renderer),
  );
}

console.log('\n=== SCENARIO 5: no regression — a real product photo still wins ===');
{
  const withPhoto: DesignBriefContext = {
    ...websiteBrief,
    prompt: 'Our new dining table is here',
    hasSubjectImage: true,
    subjectImagesCount: 1,
  };
  const out = builder.buildFinalPrompt(withPhoto, [], 'gemini');
  check(
    'uploaded product photo => commercial_product, not a laptop',
    /CAMPAIGN ARCHETYPE: COMMERCIAL_PRODUCT/.test(out),
  );
}

console.log('\n=== SCENARIO 6: no regression — a plain physical brief is unchanged ===');
{
  const physical: DesignBriefContext = {
    prompt: 'Flash sale on all kurtas, 50% off',
    onImageText: '50% OFF',
    brandName: 'Kapow',
    niche: 'Ethnic Wear',
    brandColors: ['#7c3aed'],
  };
  const out = builder.buildFinalPrompt(physical, [], 'gemini');
  check(
    'sale brief => promotional_campaign',
    /CAMPAIGN ARCHETYPE: PROMOTIONAL_CAMPAIGN/.test(out),
  );
  check('device is not forced into frame', !/laptop/i.test(out));
  check('"fake UI chrome" ban still applies to physical posts', /fake UI chrome/.test(out));
}

console.log('\n=== SCENARIO 7: pollinations fallback also understands the brief ===');
{
  check(
    'compact prompt names a laptop + website',
    /laptop/i.test(compact) && /website/i.test(compact),
  );
  check('compact prompt bans food/cheese', /cheese/i.test(compact));
  check('compact prompt carries the palette', compact.includes('#1b3a2f'));
}

console.log(
  failures === 0
    ? '\n✅ ALL BRAND DNA / DIGITAL CHECKS PASSED\n'
    : `\n❌ ${failures} CHECK(S) FAILED\n`,
);

// Print the real Stage-2 prompt for the reported scenario so the wording can be
// eyeballed and hand-tuned without a live generation.
if (process.argv.includes('--print')) {
  console.log('\n\n========== ACTUAL RENDERER PROMPT ==========\n');
  console.log(renderer);
  console.log('\n========== END PROMPT ==========\n');
}

process.exit(failures === 0 ? 0 : 1);
