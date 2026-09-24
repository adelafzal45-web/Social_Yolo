import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImageProcessingController } from './image-processing.controller';
import { ImageProcessingService } from './image-processing.service';
import { TokenService } from '../auth/jwt.service';
import { Reflector } from '@nestjs/core';

describe('ImageProcessingController', () => {
  let controller: ImageProcessingController;
  let service: ImageProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageProcessingController],
      providers: [
        {
          provide: ImageProcessingService,
          useValue: {
            processImageWithStatus: jest.fn().mockResolvedValue({
              buffer: Buffer.from('mock-png-buffer'),
              backgroundRemoved: true,
              engine: '@imgly/background-removal-node',
            }),
          },
        },
        {
          provide: TokenService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'test-user', email: 'test@example.com' }),
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ImageProcessingController>(ImageProcessingController);
    service = module.get<ImageProcessingService>(ImageProcessingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException when no file is provided', async () => {
    await expect(controller.removeBackground(undefined)).rejects.toThrow(BadRequestException);
  });

  it('should process uploaded image and return base64 and url', async () => {
    const mockFile: any = {
      buffer: Buffer.from('mock-input'),
      mimetype: 'image/jpeg',
      originalname: 'product.jpg',
      size: 500,
    };

    const result = await controller.removeBackground(mockFile);
    expect(service.processImageWithStatus).toHaveBeenCalledWith(mockFile, {
      model: 'u2net_human_seg',
      preserveText: true,
      alphaMatting: false,
    });
    expect(result.backgroundRemoved).toBe(true);
    expect(result.engine).toBe('@imgly/background-removal-node');
    expect(result.url).toContain('data:image/png;base64,');
  });

  it('should return health status', async () => {
    const health = await controller.health();
    expect(health.available).toBe(true);
    expect(health.service).toBe('node-native-redis-queue');
    expect(health.engine).toBe('@imgly/background-removal-node');
  });
});
