import { removeBackground } from '@imgly/background-removal-node';
import { ImglyBackgroundRemovalProvider } from './imgly-background-removal.provider';

jest.mock('@imgly/background-removal-node', () => ({
  removeBackground: jest.fn(),
}));

describe('IMG.LY model asset selection', () => {
  const originalPath = process.env.IMGLY_LARGE_PUBLIC_PATH;
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.IMGLY_LARGE_PUBLIC_PATH;
    (removeBackground as jest.Mock).mockResolvedValue(
      new Blob(['png'], { type: 'image/png' }),
    );
  });
  afterEach(() => {
    if (originalPath === undefined) delete process.env.IMGLY_LARGE_PUBLIC_PATH;
    else process.env.IMGLY_LARGE_PUBLIC_PATH = originalPath;
  });
  it('keeps medium on bundled assets and requests straight foreground PNG', async () => {
    await new ImglyBackgroundRemovalProvider().removeBackground(
      Buffer.from('input'),
      { model: 'medium' },
    );
    expect(removeBackground).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.objectContaining({
        model: 'medium',
        output: expect.objectContaining({
          format: 'image/png',
          type: 'foreground',
        }),
      }),
    );
    expect((removeBackground as jest.Mock).mock.calls[0][1]).not.toHaveProperty(
      'publicPath',
    );
  });
  it('explains missing large assets before inference', async () => {
    await expect(
      new ImglyBackgroundRemovalProvider().removeBackground(
        Buffer.from('input'),
        { model: 'large' },
      ),
    ).rejects.toThrow('IMGLY_LARGE_PUBLIC_PATH');
    expect(removeBackground).not.toHaveBeenCalled();
  });
  it('uses the configured HTTPS directory only for large', async () => {
    process.env.IMGLY_LARGE_PUBLIC_PATH = 'https://models.example/assets';
    await new ImglyBackgroundRemovalProvider().removeBackground(
      Buffer.from('input'),
      { model: 'large' },
    );
    expect(removeBackground).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.objectContaining({
        model: 'large',
        publicPath: 'https://models.example/assets/',
      }),
    );
  });
});
