/**
 * Built-in global knowledge base.
 *
 * These entries are the UI-driven replacement for the old
 * `scripts/seed-sample-posts.cjs`: an admin presses "Seed starter library"
 * on the Knowledge page and these are embedded and made globally retrievable.
 *
 * Each entry is written the way a senior art director would brief a
 * freelancer — transferable craft, never a specific brand — because the RAG
 * retriever injects this text straight into the planner prompt.
 */
export interface StarterLibraryEntry {
  title: string;
  category: string;
  tags: string[];
  notes: string;
  contentText: string;
}

export const STARTER_STYLE_LIBRARY: StarterLibraryEntry[] = [
  {
    title: 'Luxury beauty hero — soft sculpting light',
    category: 'beauty',
    tags: ['beige', 'soft-light', 'serif', 'editorial', 'skincare', 'premium'],
    notes:
      'Our best-performing skincare format. Soft directional key, warm neutral palette, type anchored in the lower third.',
    contentText:
      'Premium skincare campaign photography. Warm neutral palette of bone, sand and soft taupe with a single muted rose accent. ' +
      'A single hero bottle or jar placed on a matte stone plinth, lit by a large softbox at 45 degrees with gentle negative fill so the ' +
      'form reads sculpturally without harsh shadow edges. Shallow depth of field, creamy bokeh, fine surface texture on both glass and ' +
      'stone clearly visible. Editorial serif headline in mixed case set in the lower left third, generous negative space above. ' +
      'Mood: calm, expensive, unhurried. Minimum production bar: retouched to the standard of a print beauty campaign.',
  },
  {
    title: 'Bold discount promo — high-urgency retail',
    category: 'retail',
    tags: ['bold', 'sale', 'high-contrast', 'condensed-type', 'energetic'],
    notes:
      'High-converting sale layout. Works for fashion, electronics and general retail when urgency matters.',
    contentText:
      'High-urgency promotional retail post. Deep charcoal or saturated brand-coloured background with one electric accent used sparingly. ' +
      'Oversized heavy condensed numerals carry the discount as the single loudest element. Diagonal dynamic composition with the hero product ' +
      'cropped boldly against the frame edge. Hard directional light with crisp specular highlights on the product surface. ' +
      'Bold sans-serif headline plus a high-contrast CTA pill. Mood: urgent, confident, expensive rather than cheap. ' +
      'Never clutter the frame with multiple coupon stickers or fake urgency badges.',
  },
  {
    title: 'Minimal product launch — clean studio',
    category: 'tech',
    tags: ['minimal', 'studio', 'clean', 'launch', 'neutral', 'soft-shadow'],
    notes:
      'The safe default for consumer electronics and new product launches.',
    contentText:
      'Minimal product launch hero. Pale grey seamless studio backdrop with a subtle vertical gradient and a soft horizon line. ' +
      'The product sits centred on an invisible surface with a single soft elliptical contact shadow, shot on a 100mm macro at f/8 for ' +
      'edge-to-edge sharpness. Cool neutral palette with one brand accent used on a single small element. Thin geometric sans-serif headline ' +
      'above the product, one thin accent rule beneath it, nothing else. Mood: precise, trustworthy, modern. ' +
      'Minimum bar: flawless product edges, no dust, no seams.',
  },
  {
    title: 'Food & hospitality — warm appetite appeal',
    category: 'food',
    tags: ['food', 'warm', 'appetizing', 'terracotta', 'natural-light', 'hospitality'],
    notes:
      'Made a restaurant launch perform very well. Warm, inviting, hand-plated feel.',
    contentText:
      'Appetising food and hospitality campaign. Warm terracotta, cream and charred-orange palette lit by soft late-afternoon window light ' +
      'with a gentle warm bounce. Hero dish photographed at a low three-quarter angle, steam and micro-texture on the food surface clearly ' +
      'rendered, shallow depth of field on a softly blurred linen and wood background. Handwritten-feeling accent script for a single word, ' +
      'with a clean sans-serif for practical details like date and time in a small tidy badge. Mood: inviting, generous, authentic. ' +
      'Avoid greasy specular hotspots on the plate and avoid sterile white-balance.',
  },
  {
    title: 'Fashion editorial — high-fashion portrait',
    category: 'fashion',
    tags: ['fashion', 'editorial', 'portrait', '85mm', 'rim-light', 'model'],
    notes:
      'Use when a real model photo is attached. The identity mandate matters more than anything else here.',
    contentText:
      'High-fashion editorial portrait. 85mm f/1.4 at eye level with a three-quarter body crop, creamy shallow bokeh and tack-sharp focus on the ' +
      'eyes. Key light from a large octabox camera-left, subtle rim or kicker light separating the subject from the background, low ambient fill ' +
      'for sculptural shadow. Restrained palette so the garment is the colour event. Confident pose with relaxed shoulders and natural hand ' +
      'placement. Type is minimal: one small uppercase credit line in a wide margin, never competing with the face. ' +
      'Skin must read as real — visible pores, fine peach fuzz, natural subsurface scattering. Never a plastic or waxy AI finish.',
  },
  {
    title: 'Event keynote — stage atmosphere',
    category: 'events',
    tags: ['event', 'stage', 'volumetric', 'keynote', 'conference', 'dramatic'],
    notes:
      'Conference and summit promos. Volumetric light and architectural scale do the heavy lifting.',
    contentText:
      'Prestigious event and keynote visual. Vast modern architectural venue with a sweeping stage, volumetric light beams cutting through ' +
      'atmospheric haze, and a large luminous LED backdrop carrying a restrained brand gradient. Wide-angle establishing perspective with strong ' +
      'leading lines pulling toward the stage. Dramatic contrast between a bright focal zone and deep surrounding shadow. Balanced, authoritative ' +
      'event typography detailing theme, date and venue, never crowded. Mood: awe, scale, authority. ' +
      'Quality bar: crisp architecture, believable haze falloff.',
  },

  {
    title: 'Educational knowledge card — editorial clarity',
    category: 'education',
    tags: ['education', 'infographic', 'scandinavian', 'clean', 'legible', 'numbered'],
    notes: 'For tips, guides and how-tos. Prioritises legibility over photography.',
    contentText:
      'Minimal Scandinavian editorial knowledge card. Warm off-white or very pale grey canvas, generous breathing margins, and a strict grid. ' +
      'One bold numbered takeaway headline, at most two short supporting lines, and a single simple icon or focal graphic in a brand accent colour. ' +
      'Flawless typographic hierarchy with generous line spacing and no crowding. Flat, even lighting with no distracting photography competing ' +
      'for attention. Mood: clear, credible, calm authority. Quality bar: every character perfectly legible at thumbnail size, nothing clipped.',
  },
  {
    title: 'Wellness & spa — organic calm',
    category: 'wellness',
    tags: ['wellness', 'spa', 'organic', 'sage', 'soft-light', 'calm'],
    notes: 'Spa, self-care and wellness formats. The organic background treatment is what sells it.',
    contentText:
      'Wellness and spa campaign. Muted sage, oat and clay palette with warm off-white negative space. Organic background of softly blurred ' +
      'botanical forms, textured linen and matte ceramic, lit by broad diffuse daylight with a gentle warm shift in the highlights. Hero subject ' +
      'relaxed and unhurried, materials with visible natural grain. Light-weight elegant sans-serif with wide letter spacing. ' +
      'Mood: restorative, tactile, quiet. Avoid glossy plastic props and avoid harsh contrast.',
  },
  {
    title: 'Fitness & gym — kinetic energy',
    category: 'fitness',
    tags: ['fitness', 'gym', 'athletic', 'neon', 'dynamic', 'high-energy'],
    notes: 'Gym offers and membership drives. Motion and diagonal energy matter most.',
    contentText:
      'High-energy fitness campaign. Deep charcoal or near-black background with neon accent lighting raking across the subject from behind, ' +
      'producing a defined rim edge. Athletic subject captured mid-movement with genuine muscular tension and dynamic diagonal composition. ' +
      'Heavy italic sans-serif headline with tight tracking, plus one compact CTA badge. Sweat and skin texture rendered realistically with ' +
      'specular highlights on defined muscle. Mood: driven, powerful, disciplined. Quality bar: anatomically correct, no distorted limbs.',
  },

  {
    title: 'Real estate — architectural trust',
    category: 'real-estate',
    tags: ['real-estate', 'architecture', 'beige', 'navy', 'trustworthy', 'serif'],
    notes: 'Property listings and open houses. Calm, trustworthy, premium.',
    contentText:
      'Premium real-estate campaign. Beige, warm grey and deep navy palette. Architectural exterior or refined interior shot on a 24mm lens with ' +
      'correct verticals, shot in the golden hour with a soft warm key and clean blue sky fill. Generous negative space reserved for a text column, ' +
      'with property details set in a disciplined small grid beneath a trustworthy serif headline. Mood: calm, established, premium. ' +
      'Quality bar: no keystoning distortion, no blown highlights on white walls.',
  },
  {
    title: 'Tech launch — dark premium interface',
    category: 'tech',
    tags: ['tech', 'dark', 'premium', 'glow', 'sleek', 'saas'],
    notes:
      'SaaS and electronics launches that want a dark, premium, product-forward look.',
    contentText:
      'Dark premium technology campaign. Deep charcoal or near-black environment with controlled cyan, violet or brand-accent glow used as rim ' +
      'light on a hero device or interface element. Matte and anodised materials with precise specular highlights. Macro detail shot with a very ' +
      'shallow depth of field and a soft graduated background falloff. Clean geometric sans-serif typography, one short headline, one minimal CTA. ' +
      'Mood: precise, premium, engineered. Quality bar: perfectly straight edges, no chromatic fringing, believable reflections.',
  },
  {
    title: 'Seasonal festival — warm celebration',
    category: 'events',
    tags: ['seasonal', 'festival', 'warm', 'celebration', 'gold', 'ornamental'],
    notes:
      'Eid, Ramadan, Diwali, New Year. Warm, ornate, celebratory but still premium.',
    contentText:
      'Seasonal festival celebration. Warm palette of deep jewel tones balanced with antique gold or brass accents, on a rich textured ground. ' +
      'Subtle ornamental motif used as a low-opacity background pattern, never as clutter. Warm directional light with gentle glowing highlights ' +
      'suggesting lanterns or festoons. Elegant serif or display typography for the greeting with a clean sans-serif for practical details. ' +
      'Generous white space around the greeting. Mood: warm, celebratory, generous, culturally respectful. ' +
      'Avoid cartoonish clip-art ornament and avoid mixing more than two metallic accents.',
  },
];

