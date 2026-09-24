import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService, PlatformConfig } from '../../design-platform/platform-config.service';
import {
  StructuredDesignDocument,
  DesignLayer,
} from './structured-design.service';

export interface AdaptationResult {
  sourcePlatform: string;
  targetPlatform: string;
  adaptedDocument: StructuredDesignDocument;
  appliedAdjustments: string[];
}

@Injectable()
export class PlatformAdaptationService {
  private readonly logger = new Logger(PlatformAdaptationService.name);

  constructor(private readonly platformConfigService: PlatformConfigService) {}

  /**
   * Dynamically adapts a StructuredDesignDocument to a target platform
   * without regenerating from scratch. Recomputes canvas dimensions,
   * safe zones, typography sizes, and focal layouts.
   */
  adaptDesign(
    doc: StructuredDesignDocument,
    targetPlatformId: string,
  ): AdaptationResult {
    const targetConfig = this.platformConfigService.getPlatformById(targetPlatformId) || {
      id: targetPlatformId,
      name: targetPlatformId,
      channel: 'Social',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      safeArea: { top: 250, bottom: 250, left: 40, right: 40 },
      active: true,
      category: 'story' as const,
      description: 'Auto-resolved target format',
    };

    const sourceWidth = doc.canvas.width || 1080;
    const sourceHeight = doc.canvas.height || 1080;
    const targetWidth = targetConfig.width;
    const targetHeight = targetConfig.height;

    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    const appliedAdjustments: string[] = [];

    this.logger.log(
      `Adapting design ${doc.id} from ${doc.metadata.platform} (${sourceWidth}x${sourceHeight}) to ${targetConfig.name} (${targetWidth}x${targetHeight})`,
    );

    const adaptedLayers: DesignLayer[] = doc.layers.map((origLayer) => {
      const layer: DesignLayer = JSON.parse(JSON.stringify(origLayer));

      if (layer.type === 'background') {
        layer.x = 0;
        layer.y = 0;
        layer.width = targetWidth;
        layer.height = targetHeight;
        return layer;
      }

      // Check category shift: e.g. feed (1:1, 4:5) to story (9:16)
      const isStory = targetConfig.category === 'story' || targetConfig.height > targetConfig.width * 1.5;
      const isLandscape = targetConfig.category === 'banner' || targetConfig.category === 'cover' || targetWidth > targetHeight * 1.3;

      if (isStory) {
        // Story vertical orientation (e.g. 1080x1920)
        const safeTop = targetConfig.safeArea.top || 250;
        const safeBottom = targetConfig.safeArea.bottom || 250;
        const safeLeft = targetConfig.safeArea.left || 40;
        const safeRight = targetConfig.safeArea.right || 40;
        const safeContentWidth = targetWidth - safeLeft - safeRight;

        switch (layer.type) {
          case 'logo':
            layer.x = safeLeft;
            layer.y = safeTop + 20;
            layer.width = Math.min(layer.width * scaleX, safeContentWidth * 0.4);
            break;

          case 'badge':
            layer.x = targetWidth - safeRight - layer.width;
            layer.y = safeTop + 20;
            break;

          case 'image':
            layer.width = Math.round(safeContentWidth);
            layer.height = Math.round(targetHeight * 0.42);
            layer.x = safeLeft;
            layer.y = Math.round(safeTop + 90);
            layer.borderRadius = 28;
            break;

          case 'headline':
            layer.x = safeLeft;
            layer.y = Math.round(targetHeight * 0.62);
            layer.width = Math.round(safeContentWidth);
            if (layer.fontSize) {
              layer.fontSize = Math.round(Math.min(targetWidth * 0.065, Math.max(32, layer.fontSize * 1.1)));
            }
            break;

          case 'subheadline':
          case 'body':
            layer.x = safeLeft;
            layer.y = Math.round(targetHeight * 0.74);
            layer.width = Math.round(safeContentWidth);
            if (layer.fontSize) {
              layer.fontSize = Math.round(Math.min(targetWidth * 0.03, Math.max(16, layer.fontSize * 1.05)));
            }
            break;

          case 'cta':
            layer.x = safeLeft;
            layer.y = Math.round(targetHeight - safeBottom - layer.height - 30);
            layer.width = Math.round(safeContentWidth * 0.55);
            layer.height = Math.round(Math.max(54, layer.height * 1.1));
            break;

          default:
            layer.x = Math.round(layer.x * scaleX);
            layer.y = Math.round(layer.y * scaleY);
            layer.width = Math.round(layer.width * scaleX);
            layer.height = Math.round(layer.height * scaleY);
            break;
        }
      } else if (isLandscape) {
        // Landscape orientation (e.g. 1200x628 Facebook post / X post / Cover)
        switch (layer.type) {
          case 'logo':
            layer.x = Math.round(targetWidth * 0.05);
            layer.y = Math.round(targetHeight * 0.1);
            layer.width = Math.round(layer.width * 0.9);
            break;

          case 'badge':
            layer.x = Math.round(targetWidth * 0.35);
            layer.y = Math.round(targetHeight * 0.1);
            break;

          case 'image':
            // Split layout: image on the right half
            layer.x = Math.round(targetWidth * 0.52);
            layer.y = Math.round(targetHeight * 0.1);
            layer.width = Math.round(targetWidth * 0.43);
            layer.height = Math.round(targetHeight * 0.8);
            layer.borderRadius = 16;
            break;

          case 'headline':
            // Headline on the left half
            layer.x = Math.round(targetWidth * 0.05);
            layer.y = Math.round(targetHeight * 0.28);
            layer.width = Math.round(targetWidth * 0.44);
            if (layer.fontSize) {
              layer.fontSize = Math.round(Math.min(targetHeight * 0.09, 38));
            }
            break;

          case 'subheadline':
          case 'body':
            layer.x = Math.round(targetWidth * 0.05);
            layer.y = Math.round(targetHeight * 0.55);
            layer.width = Math.round(targetWidth * 0.44);
            if (layer.fontSize) {
              layer.fontSize = Math.round(Math.min(targetHeight * 0.045, 18));
            }
            break;

          case 'cta':
            layer.x = Math.round(targetWidth * 0.05);
            layer.y = Math.round(targetHeight * 0.75);
            layer.width = Math.round(targetWidth * 0.24);
            layer.height = Math.round(targetHeight * 0.12);
            break;

          default:
            layer.x = Math.round(layer.x * scaleX);
            layer.y = Math.round(layer.y * scaleY);
            layer.width = Math.round(layer.width * scaleX);
            layer.height = Math.round(layer.height * scaleY);
            break;
        }
      } else {
        // Feed format (1:1 or 4:5)
        layer.x = Math.round(layer.x * scaleX);
        layer.y = Math.round(layer.y * scaleY);
        layer.width = Math.round(layer.width * scaleX);
        layer.height = Math.round(layer.height * scaleY);
        if (layer.fontSize) {
          layer.fontSize = Math.round(layer.fontSize * Math.min(scaleX, scaleY));
        }
      }

      // Constrain boundaries to canvas
      layer.x = Math.max(0, Math.min(layer.x, targetWidth - layer.width));
      layer.y = Math.max(0, Math.min(layer.y, targetHeight - layer.height));

      return layer;
    });

    appliedAdjustments.push(
      `Rescaled canvas to ${targetWidth}x${targetHeight} (${targetConfig.aspectRatio})`,
      `Adjusted safe zones for ${targetConfig.channel} ${targetConfig.category}`,
      `Repositioned visual hierarchy to prevent clipping and preserve balance`,
    );

    const adaptedDocument: StructuredDesignDocument = {
      id: `${doc.id}-adapted-${targetConfig.id}`,
      version: doc.version + 1,
      canvas: {
        width: targetWidth,
        height: targetHeight,
        backgroundColor: doc.canvas.backgroundColor,
        backgroundGradient: doc.canvas.backgroundGradient,
        aspectRatio: targetConfig.aspectRatio,
      },
      layers: adaptedLayers,
      metadata: {
        ...doc.metadata,
        platform: targetConfig.id,
        updatedAt: new Date().toISOString(),
        lastAction: `adapt_to_${targetConfig.id}`,
      },
    };

    return {
      sourcePlatform: doc.metadata.platform,
      targetPlatform: targetConfig.id,
      adaptedDocument,
      appliedAdjustments,
    };
  }
}
