import { Test, TestingModule } from '@nestjs/testing';
import { BriaRmbgProvider } from './bria-rmbg.provider';
import { ServiceUnavailableException } from '@nestjs/common';

describe('BriaRmbgProvider', () => {
  let provider: BriaRmbgProvider;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      providers: [BriaRmbgProvider],
    }).compile();

    provider = module.get<BriaRmbgProvider>(BriaRmbgProvider);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('bria');
  });

  it('should report unavailable if env vars are missing', async () => {
    delete process.env.BRIA_API_URL;
    delete process.env.BRIA_API_KEY;

    expect(await provider.isAvailable()).toBe(false);
  });

  it('should report available if env vars are present', async () => {
    process.env.BRIA_API_URL =
      'https://engine.prod.bria-api.com/v2/image/edit/remove_background';
    process.env.BRIA_API_KEY = 'mock-key';

    expect(await provider.isAvailable()).toBe(true);
  });

  it('should throw ServiceUnavailableException if not configured', async () => {
    delete process.env.BRIA_API_URL;
    delete process.env.BRIA_API_KEY;

    await expect(
      provider.removeBackground(Buffer.from('fake-image')),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
