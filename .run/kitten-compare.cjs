const fs = require('node:fs/promises');
const path = require('node:path');
require('../Backend/node_modules/ts-node').register({ project: path.resolve('Backend/tsconfig.json'), transpileOnly: true });
require('../Backend/src/config/env');
const sharp = require('../Backend/node_modules/sharp');
const { ImglyBackgroundRemovalProvider } = require('../Backend/src/image-processing/providers/imgly-background-removal.provider');
const { BriaRmbgProvider } = require('../Backend/src/image-processing/providers/bria-rmbg.provider');
const { MatteRefinementService } = require('../Backend/src/image-processing/refinement/matte-refinement.service');
const inputPath = 'C:/Users/Haseeb Iqbal/Downloads/profilo-sfondi-carini-carta-da-parati-kawaii-camera-original-full-size.jpg';
(async () => {
  const out = path.resolve('.run/kitten'); await fs.mkdir(out,{recursive:true});
  process.chdir(path.resolve('Backend'));
  const input = await sharp(await fs.readFile(inputPath)).png().toBuffer();
  for (const provider of [new ImglyBackgroundRemovalProvider(), new BriaRmbgProvider()]) {
    if (!await provider.isAvailable()) continue;
    const dest = path.join(out, provider.name + '-raw.png');
    try {
      let raw; try { raw = await fs.readFile(dest); } catch { raw = await provider.removeBackground(input, {model: 'medium'}); await fs.writeFile(dest,raw); }
      const svc = new MatteRefinementService();
      console.log(provider.name, JSON.stringify(await svc.analyzeOnly(raw)));
      const result = await svc.process(raw);
      await fs.writeFile(path.join(out,provider.name + '-refined.png'),result.buffer);
      await sharp(raw).flatten({background:'#34444e'}).toFile(path.join(out,provider.name + '-raw-dark.png'));
      await sharp(result.buffer).flatten({background:'#34444e'}).toFile(path.join(out,provider.name + '-refined-dark.png'));
    } catch(e) { console.error(provider.name, e.message); }
  }
})().catch(e=>{console.error(e); process.exitCode=1});
