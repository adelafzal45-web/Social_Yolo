import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  BackgroundRemovalOptions,
  BackgroundRemovalProvider,
} from './background-removal-provider.interface';

/**
 * Pluggable provider for BRIA RMBG v2 API.
 *
 * Implements the BackgroundRemovalProvider contract by:
 * 1. Submitting the image as a Base64-encoded JSON payload to Bria's v2 endpoint with api_token.
 * 2. Handling asynchronous execution via Bria's status_url polling.
 * 3. Downloading and returning the cutout PNG buffer once the job completes.
 */
@Injectable()
export class BriaRmbgProvider implements BackgroundRemovalProvider {
  readonly name = 'bria';
  private readonly logger = new Logger(BriaRmbgProvider.name);

  private get apiUrl(): string | undefined {
    return process.env.BRIA_API_URL;
  }

  private get apiKey(): string | undefined {
    return process.env.BRIA_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiUrl && this.apiKey);
  }

  async removeBackground(
    imageBuffer: Buffer,
    options?: BackgroundRemovalOptions,
  ): Promise<Buffer> {
    const apiUrl = this.apiUrl;
    const apiKey = this.apiKey;

    if (!apiUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'BriaRmbgProvider is not configured. Set BRIA_API_URL and BRIA_API_KEY in .env.',
      );
    }

    this.logger.log(`Invoking BRIA RMBG endpoint: ${apiUrl}`);

    const base64Image = imageBuffer.toString('base64');

    // 1. Submit background removal task to Bria API v2
    const submitResponse = await this.fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_token: apiKey,
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text().catch(() => '');
      throw new ServiceUnavailableException(
        `BRIA RMBG service error ${submitResponse.status}: ${errorText || submitResponse.statusText}`,
      );
    }

    const contentType = submitResponse.headers.get('content-type') || '';

    // Direct binary image returned
    if (contentType.includes('image/')) {
      const arrayBuffer = await submitResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    const submitData = (await submitResponse.json()) as {
      request_id?: string;
      status_url?: string;
      result?: { image_url?: string };
    };

    // Immediate result in payload
    if (submitData.result?.image_url) {
      return this.downloadImage(submitData.result.image_url);
    }

    if (!submitData.status_url) {
      throw new InternalServerErrorException(
        `BRIA RMBG did not return a valid status_url or image result: ${JSON.stringify(submitData)}`,
      );
    }

    // 2. Poll status_url until job is completed
    const statusUrl = submitData.status_url;
    const maxWaitMs = 60_000;
    const pollIntervalMs = 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const statusResponse = await this.fetchWithRetry(statusUrl, {
        method: 'GET',
        headers: {
          api_token: apiKey,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text().catch(() => '');
        this.logger.warn(
          `BRIA poll HTTP ${statusResponse.status}: ${errorText}`,
        );
        continue;
      }

      const statusData = (await statusResponse.json()) as {
        status?: string;
        result?: { image_url?: string };
        error?: any;
      };

      if (statusData.status === 'COMPLETED' && statusData.result?.image_url) {
        this.logger.log(`BRIA RMBG job completed. Downloading result image...`);
        return this.downloadImage(statusData.result.image_url);
      }

      if (statusData.status === 'ERROR') {
        throw new InternalServerErrorException(
          `BRIA RMBG processing failed: ${JSON.stringify(statusData.error || statusData)}`,
        );
      }
    }

    throw new InternalServerErrorException(
      `BRIA RMBG task timed out after ${maxWaitMs / 1000}s`,
    );
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    const res = await this.fetchWithRetry(imageUrl);
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Failed to download processed image from BRIA: HTTP ${res.status} ${res.statusText}`,
      );
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  private async fetchWithRetry(
    url: string,
    options?: RequestInit,
    retries = 3,
  ): Promise<Response> {
    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fetch(url, options);
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Fetch to ${url} failed (attempt ${attempt}/${retries}): ${err.message}`,
        );
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    throw lastError;
  }
}
