function createMockImageData() {
  const width = 500;
  const height = 500;
  const data = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - 250, y - 250);
      if (dist < 100) {
        // Solid foreground
        data[idx] = 200;
        data[idx + 1] = 100;
        data[idx + 2] = 50;
        data[idx + 3] = 255;
      } else if (dist < 120) {
        // Transition edge
        data[idx] = 50;
        data[idx + 1] = 200;
        data[idx + 2] = 50;
        data[idx + 3] = 128;
      } else {
        // Transparent background
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }
  return data;
}

const mockSharpInstance = {
  metadata: jest.fn().mockResolvedValue({
    format: 'png',
    width: 500,
    height: 500,
    channels: 4,
    hasAlpha: true,
  }),
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  toFormat: jest.fn().mockReturnThis(),
  toColourspace: jest.fn().mockReturnThis(),
  ensureAlpha: jest.fn().mockReturnThis(),
  raw: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockImplementation((options) => {
    if (options && options.resolveWithObject) {
      const data = createMockImageData();
      return Promise.resolve({
        data,
        info: {
          width: 500,
          height: 500,
          channels: 4,
          format: 'raw',
          size: data.length,
        },
      });
    }
    return Promise.resolve(Buffer.from('mock-processed-png-buffer'));
  }),
  stats: jest.fn().mockResolvedValue({
    channels: [
      { min: 0, max: 255 },
      { min: 0, max: 255 },
      { min: 0, max: 255 },
      { min: 0, max: 255 },
    ],
  }),
};

const sharp = jest.fn(() => mockSharpInstance);

module.exports = sharp;
