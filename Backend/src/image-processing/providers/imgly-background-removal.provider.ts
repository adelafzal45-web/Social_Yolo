import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { removeBackground } from '@imgly/background-removal-node';
import {
  BackgroundRemovalOptions,
  BackgroundRemovalProvider,
} from './background-removal-provider.interface';
import { IMGLY_MODEL } from '../../config/image-processing.config';

@Injectable()
export class ImglyBackgroundRemovalProvider
  implements BackgroundRemovalProvider
{
  readonly name = 'imgly';
  private readonly logger = new Logger(ImglyBackgroundRemovalProvider.name);

  async isAvailable(): Promise<boolean> {
    try {
      // Confirms the library is loadable and functional in Node.js
      return typeof removeBackground === 'function';
    } catch {
      return false;
    }
  }

  async removeBackground(
    imageBuffer: Buffer,
    options?: BackgroundRemovalOptions,
  ): Promise<Buffer> {
    const selectedModel = options?.model || IMGLY_MODEL;
    this.logger.log(
      `Starting background removal using @imgly/background-removal-node (model: ${selectedModel})`,
    );

    const largePublicPath = process.env.IMGLY_LARGE_PUBLIC_PATH?.trim();
    if (selectedModel === 'large' && !largePublicPath) {
      throw new ServiceUnavailableException(
        'Large model assets are not bundled. Set IMGLY_LARGE_PUBLIC_PATH to an HTTPS asset directory containing resources.json with /models/large.',
      );
    }
    if (
      selectedModel === 'large' &&
      largePublicPath &&
      new URL(largePublicPath).protocol !== 'https:'
    ) {
      throw new ServiceUnavailableException(
        'IMGLY_LARGE_PUBLIC_PATH must use HTTPS.',
      );
    }
    const config = {
      ...(selectedModel === 'large'
        ? { publicPath: largePublicPath!.replace(/\/?$/, '/') }
        : {}),
      model: selectedModel,
      debug: options?.debug ?? false,
      output: {
        format: 'image/png' as const,
        quality: options?.quality ?? 0.9,
        type: 'foreground' as const,
      },
    };

    // Wrap Buffer in a typed Blob with explicit 'image/png' MIME type for imgly's internal decoder
    const imageBlob = new Blob([imageBuffer as unknown as BlobPart], {
      type: 'image/png',
    });

    // removeBackground processes the Blob through ONNX matting
    const resultBlob = await removeBackground(imageBlob, config);

    // Convert output Blob to Node.js Buffer
    const arrayBuffer = await resultBlob.arrayBuffer();
    const outputBuffer = Buffer.from(arrayBuffer);

    this.logger.log(
      `Background removal completed successfully. Output size: ${outputBuffer.length} bytes`,
    );

    return outputBuffer;
  }
}
