declare module "smartcrop" {
  export interface CropScore {
    boost: number;
    detail: number;
    saturation: number;
    skin: number;
    total: number;
  }

  export interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
    score: CropScore;
  }
  export interface CropResult {
    topCrop: Crop;
  }

  /**
   * Describes a region to boost. A usage example of this is to take into account faces in the image.
   */
  export interface CropBoost {
    /**
     * Pixels from the left side.
     */
    x: number;
    /**
     * Pixels from the top.
     */
    y: number;
    /**
     * In pixels.
     */
    width: number;
    /**
     * In pixels.
     */
    height: number;
    /**
     * In the range `[0, 1]`
     */
    weight: number;
  }

  /**
   * Arguments for `smartcrop.js`
   * @see https://github.com/jwagner/smartcrop.js
   */
  export interface CropOptions {
    /**
     * Minimal scale of the crop rect, set to `1.0` to prevent smaller than necessary crops (lowers the risk of chopping things off).
     */
    minScale?: number;
    /**
     * Width of the crop you want to use.
     */
    width: number;
    /**
     *  Height of the crop you want to use.
     */
    height: number;
    /**
     * Optional array of regions whose 'interestingness' you want to boost
     */
    boost?: CropBoost[];
    /**
     * Optional boolean if set to `false` it will turn off the rule of thirds composition weight
     */
    ruleOfThirds?: boolean;
    debug?: boolean;
  }

  export const smartcrop: {
    // eslint-disable-next-line no-undef
    crop(image: CanvasImageSource, options: CropOptions): Promise<CropResult>;
  };
  export default smartcrop;
}
