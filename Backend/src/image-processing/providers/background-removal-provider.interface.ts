/**
 * Common options passed to background removal providers.
 */
export interface BackgroundRemovalOptions {
  model?: 'small' | 'medium' | 'large';
  quality?: number;
  debug?: boolean;
}

/**
 * Standard interface for all background removal providers.
 *
 * Facilitates hot-swapping between `@imgly/background-removal-node`,
 * `BRIA RMBG`, or future models without modifying business logic.
 */
export interface BackgroundRemovalProvider {
  /** Identifier name of the provider (e.g. 'imgly', 'bria') */
  readonly name: string;

  /** Checks whether the provider's dependencies/engine are initialized and ready */
  isAvailable(): Promise<boolean>;

  /**
   * Executes AI background removal on the input image buffer.
   *
   * @param imageBuffer Preprocessed image buffer (RGB/RGBA)
   * @param options Execution settings (model tier, debug)
   * @returns Raw PNG image buffer with alpha channel
   */
  removeBackground(
    imageBuffer: Buffer,
    options?: BackgroundRemovalOptions,
  ): Promise<Buffer>;
}
