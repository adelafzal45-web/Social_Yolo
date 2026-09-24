process.env.BG_REFINE_ENABLED = process.argv[2] === 'parity' ? 'false' : 'true';
process.env.BG_ANALYSIS_ENABLED = process.env.BG_REFINE_ENABLED;
process.env.BG_FALLBACK_ENABLED = 'false';

const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve('Backend/node_modules/ts-node')).register({project: path.resolve('Backend/tsconfig.json'), transpileOnly: true});
const sharp = require(path.resolve('Backend/node_modules/sharp'));
const { MatteRefinementService } = require(path.resolve('Backend/src/image-processing/refinement/matte-refinement.service'));
const { ImageValidator } = require(path.resolve('Backend/src/image-processing/utils/image-validator'));
(async () => {
  const rgba = Buffer.from([200,20,10,255, 100,180,120,128, 0,255,0,0]);
  const input = await sharp(rgba, {raw:{width:3,height:1,channels:4}}).png().toBuffer();
  const service = new MatteRefinementService();
  const result = await service.process(input);
  const validator = new ImageValidator();
  if (process.env.BG_REFINE_ENABLED === 'false') {
    assert.strictEqual(result.buffer, input);
    const legacy = await validator.postprocess(input);
    const current = await validator.postprocess(result.buffer);
    assert.ok(legacy.equals(current));
    console.log('PASS: real PNG kill-switch output is byte-identical after existing postprocess');
  } else {
    const {data,info} = await sharp(result.buffer).raw().toBuffer({resolveWithObject:true});
    assert.equal(info.channels,4); assert.deepEqual([...data.slice(4,8)],[200,20,10,128]);
    assert.equal(result.qualityReport.maxAlpha,255);
    const gray = await sharp(Buffer.from([0,128,255]), {raw:{width:3,height:1,channels:1}}).toColourspace('b-w').png().toBuffer();
    const converted = await service.process(gray);
    const meta = await sharp(converted.buffer).metadata(); assert.equal(meta.channels,4);
    console.log('PASS: real Sharp straight-alpha edge RGB repair and grayscale normalization');
  }
})().catch(e=>{console.error(e);process.exitCode=1});
