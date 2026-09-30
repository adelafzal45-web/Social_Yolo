/**
 * Ad-hoc verification of the on-canvas text contract.
 *
 * Run with:  npx ts-node -P tsconfig.json scripts/verify-overlay-contract.ts
 *
 * Not part of the unit-test suite (there is none yet) — this is a quick way to
 * eyeball the exact prompt text for the four scenarios that matter:
 *   1. no overlay text          -> zero lettering demanded
 *   2. overlay + font + slot    -> exact string pinned to a fixed region
 *   3. overlay, placement auto  -> intelligent-placement contract
 *   4. legacy brief fields set  -> must NOT appear in the render whitelist
 */
import { PromptBuilderService, DesignBriefContext } from '../src/post-generator/rag/prompt-builder.service';

const builder = new PromptBuilderService();

function typography(ctx: DesignBriefContext): string {
  return builder.buildFinalPrompt(ctx, [], 'gemini');
}

function section(prompt: string, heading: string): string {
  const start = prompt.indexOf(heading);
  if (start === -1) return '(section missing)';
  const next = prompt.indexOf('\n===', start + heading.length);
  const nextTwo = prompt.indexOf('\n###', start + heading.length);
  const ends = [next, nextTwo].filter((i) => i !== -1);
  const end = ends.length ? Math.min(...ends) : prompt.length;
  return prompt.slice(start, end).trim();
}

let failures = 0;
function check(name: string, condition: boolean, detail?: string): void {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures += 1;
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

// ---------------------------------------------------------------------------
console.log('\n=== SCENARIO 1: no overlay text => must demand ZERO lettering ===');
{
  const prompt = typography({
    prompt: 'warm autumn launch for a cozy cafe with 50% off',
    productName: 'Cold Brew',
    headline: 'AI GENERATED HEADLINE',
    bodyCopy: 'AI GENERATED BODY COPY',
    cta: 'SHOP NOW',
    keyMessage: 'KEY MESSAGE LEAK',
  });
  const manifest = section(prompt, '### ON-CANVAS TEXT MANIFEST');

  console.log(manifest);
  console.log('');
  check('demands zero lettering', /must contain ZERO lettering/.test(manifest));
  check('forbids inventing a headline', /inventing a headline/.test(manifest));
  for (const leak of ['AI GENERATED HEADLINE', 'AI GENERATED BODY COPY', 'SHOP NOW', 'KEY MESSAGE LEAK']) {
    check(`does not whitelist "${leak}"`, !manifest.includes(leak));
  }
}

// ---------------------------------------------------------------------------
console.log('\n=== SCENARIO 2: overlay + explicit font + fixed slot ===');
{
  const prompt = typography({
    prompt: 'eid sale campaign',
    onImageText: 'Eid Sale',
    onImageTextFont: 'Bold Condensed Sans',
    onImageTextPlacement: 'bottom_center',
    aspectRatio: '4:5',
  });
  const manifest = section(prompt, '### ON-CANVAS TEXT MANIFEST');
  const placement = section(prompt, '### PLACEMENT');

  console.log(manifest);
  console.log('');
  console.log(placement);
  console.log('');
  check('whitelists exactly the overlay string', manifest.includes('[T1] "Eid Sale"'));
  // The font/colour/scale rules live in the following "### TYPOGRAPHY
  // SPECIFICATION" subsection, so assert against the whole prompt.
  check('pins the requested font', /Set it in Bold Condensed Sans/.test(prompt));
  check('gives contrast + scale rules', /4\.5:1 contrast/.test(prompt) && /6–14% of the canvas height/.test(prompt));
  check('honours the fixed slot', /bottom center/.test(placement) && /fixed by the user/.test(placement));
  check('does not offer auto-placement reasoning', !/YOU decide, intelligently/.test(placement));
}

// ---------------------------------------------------------------------------
console.log('\n=== SCENARIO 3: overlay, placement = auto => intelligent placement ===');
{
  const prompt = typography({
    prompt: 'cheesy factor launch',
    onImageText: 'Cheesy Factor',
    onImageTextPlacement: 'auto',
    aspectRatio: '9:16',
  });
  const manifest = section(prompt, '### ON-CANVAS TEXT MANIFEST');
  const placement = section(prompt, '### PLACEMENT');

  console.log(placement);
  console.log('');
  check('whitelists the overlay string', manifest.includes('[T1] "Cheesy Factor"'));
  check('emits the reasoning order', /YOU decide, intelligently/.test(placement));
  check('tells it to respect the subject', /never let a letter cross the subject silhouette/.test(placement));
  check('includes the aspect-aware zone hint', /9:16/.test(placement));
  check('allows omitting text as last resort', /omit the text entirely/.test(placement));
}

// ---------------------------------------------------------------------------
console.log('\n=== SCENARIO 4: legacy fields present but no overlay => still no text ===');
{
  const prompt = typography({
    prompt: 'user typed this brief',
    headline: 'LEAK-1',
    bodyCopy: 'LEAK-2',
    cta: 'LEAK-3',
    keyMessage: 'LEAK-4',
    content: 'LEAK-5',
  });
  const manifest = section(prompt, '### ON-CANVAS TEXT MANIFEST');
  check('no legacy field is whitelisted', !/LEAK-[1-5]/.test(manifest));
  check('still zero lettering', /ZERO lettering/.test(manifest));
}

// ---------------------------------------------------------------------------
console.log('\n=== SCENARIO 5: edit prompt keeps the text contract ===');
{
  const edit = builder.buildEditPrompt('make the background warmer', {
    onImageText: 'Eid Sale',
    aspectRatio: '1:1',
  });
  check('marks it as an edit', /EDIT MODE/.test(edit));
  check('carries the change request', /make the background warmer/.test(edit));
  check('demands surgical edits', /surgical edit/.test(edit));
  check('preserves the aspect ratio', /Preserve the canvas shape \(1:1\)/.test(edit));
  check('re-applies the text manifest', /\[T1\] "Eid Sale"/.test(edit));
}

// ---------------------------------------------------------------------------
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
