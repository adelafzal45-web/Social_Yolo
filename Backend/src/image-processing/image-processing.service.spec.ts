import { Test, TestingModule } from '@nestjs/testing';
import { ImageProcessingService } from './image-processing.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';

import { BackgroundRemovalQueueService } from './background-removal-queue.service';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockQueueService = {
    enqueueAndWait: jest.fn().mockResolvedValue({
      buffer: Buffer.from('cached-png'),
      engine: 'redis-cache',
      backgroundRemoved: true,
    }),
  };

  // Valid 1x1 PNG buffer
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
    0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
    0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
    0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
    0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]);

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessingService,
        {
          provide: BackgroundRemovalQueueService,
          useValue: mockQueueService,
        },
        {
          provide: RedisCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<ImageProcessingService>(ImageProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return cached result on cache hit', async () => {
    const cachedData = Buffer.from('cached-png').toString('base64');
    mockCache.get.mockResolvedValueOnce(cachedData);

    const mockFile: any = {
      buffer: validPngBuffer,
      originalname: 'test.png',
      mimetype: 'image/png',
      size: validPngBuffer.length,
    };

    const result = await service.processImageWithStatus(mockFile, { model: 'u2net' });
    expect(result.backgroundRemoved).toBe(true);
    expect(result.engine).toBe('redis-cache');
    expect(result.buffer.toString()).toBe('cached-png');
    expect(mockQueueService.enqueueAndWait).toHaveBeenCalled();
  });

  it('processImage returns buffer directly', async () => {
    const cachedData = Buffer.from('cached-png').toString('base64');
    mockCache.get.mockResolvedValueOnce(cachedData);

    const mockFile: any = {
      buffer: validPngBuffer,
      originalname: 'test.png',
      mimetype: 'image/png',
      size: validPngBuffer.length,
    };

    const buffer = await service.processImage(mockFile);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toBe('cached-png');
  });
});
