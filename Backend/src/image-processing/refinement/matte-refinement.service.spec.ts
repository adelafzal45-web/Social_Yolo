import { Test, TestingModule } from '@nestjs/testing';
import { MatteRefinementService } from './matte-refinement.service';
import sharp from 'sharp';

describe('MatteRefinementService', () => {
  let service: MatteRefinementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatteRefinementService],
    }).compile();

    service = module.get<MatteRefinementService>(MatteRefinementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should decode, analyze, refine, and re-encode an image buffer', async () => {
    const mockInput = Buffer.from('mock-input-png');
    const result = await service.process(mockInput);

    expect(sharp).toHaveBeenCalledWith(mockInput);
    expect(result.buffer).toBeDefined();
    expect(result.qualityReport).toBeDefined();
    expect(result.refinement.applied).toBe(true);
    expect(result.refinement.stages).toContain('decontaminate');
    expect(result.refinement.stages).toContain('alpha-curve');
  });

  it('should perform fast analysis pass in analyzeOnly', async () => {
    const mockInput = Buffer.from('mock-input-png');
    const report = await service.analyzeOnly(mockInput);

    expect(sharp).toHaveBeenCalledWith(mockInput);
    expect(report.verdict).toBeDefined();
    expect(typeof report.coverage).toBe('number');
  });
});

describe('Matte refinement decode and kill switches', () => {
  afterEach(() => {
    jest.dontMock('../../config/image-processing.config');
    jest.resetModules();
  });
  it('reuses the analysis decode for the selected matte', async () => {
    const service = new MatteRefinementService();
    const input = Buffer.from('png');
    jest.clearAllMocks();
    const report = await service.analyzeOnly(input);
    const result = await service.process(input);
    expect(result.qualityReport).toBe(report);
    expect(
      (sharp as unknown as jest.Mock).mock.calls.filter(
        (call) => call[0] === input,
      ),
    ).toHaveLength(1);
    expect(sharp).toHaveBeenCalledTimes(2); // one decode, one encode
    expect(sharp).toHaveBeenLastCalledWith(expect.any(Buffer), {
      raw: { width: 500, height: 500, channels: 4 },
    });
  });
  it.each([false, true])(
    'preserves PNG bytes when refinement is disabled (analysis=%s)',
    async (analysis) => {
      jest.resetModules();
      jest.doMock('../../config/image-processing.config', () => ({
        ...jest.requireActual('../../config/image-processing.config'),
        BG_REFINE_ENABLED: false,
        BG_ANALYSIS_ENABLED: analysis,
      }));
      const {
        MatteRefinementService: Service,
      } = require('./matte-refinement.service');
      const localSharp = require('sharp') as jest.Mock;
      localSharp.mockClear();
      const input = Buffer.from('byte-identical-input');
      const result = await new Service().process(input);
      expect(result.buffer).toBe(input);
      expect(result.refinement).toEqual({ applied: false, stages: [] });
      expect(localSharp).toHaveBeenCalledTimes(analysis ? 1 : 0);
      expect(Boolean(result.qualityReport)).toBe(analysis);
    },
  );
});
