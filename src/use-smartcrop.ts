import React, { useEffect, useState } from "react";

import quantize from "quantize";
import smartcrop from "smartcrop";

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

/**
 * Extracted from `lokesh/color-thief`.
 * @see https://github.com/lokesh/color-thief
 */
export interface GetPaletteOptions {
  /**
   * Pixels from the left side of the cropped image.
   * @default 0
   */
  x?: number | null;
  /**
   * Pixels from the top of the cropped image.
   * @default 0
   */
  y?: number | null;
  /**
   * In pixels of the cropped image. Defaults to full width.
   */
  width?: number | null;
  /**
   * In pixels of the cropped image. Defaults to full height.
   */
  height?: number | null;
  /**
   * How many colors as output.
   * @default 5
   */
  size?: number | null;
  /**
   * @default 10
   */
  quality?: number | null;
}

export enum SmartcropStatus {
  LOADING = 0,
  LOADED = 1,
  FAILED = -1,
}

/**
 * Crop and image given a position and size in pixels. The final images will have the desired dimension.
 * @see https://github.com/jwagner/smartcrop.js
 */
export function useSmartcrop(src: string | undefined | null, options: CropOptions) {
  const { width, height, minScale, boost = [], ruleOfThirds, debug } = options;
  const [srcProcessed, srcProcessedSet] = useState<string>();
  const [status, setStatus] = useState(SmartcropStatus.LOADING);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [error, setError] = useState<Error>();

  const serialized = boost.map((b) => JSON.stringify(b));
  const deps = ([] as any[]).concat(src, width, height, minScale, ruleOfThirds, debug, serialized);
  useEffect(() => {
    if (!src) return;

    const handleLoad: React.ReactEventHandler<HTMLImageElement> = (
      ev: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      const element = ev.target as HTMLImageElement;

      smartcrop
        .crop(element, options)
        .then(({ topCrop: crop }) => {
          const scale = 1;
          const canvas = document.createElement("canvas");
          canvas.width = ~~(width * scale);
          canvas.height = ~~(height * scale);
          const ctx = canvas.getContext("2d")!;
          // Origin: crop.x, crop.y, crop.width, crop.height
          // Destiny: 0, 0, canvas.width, canvas.height
          ctx.drawImage(element, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
          setContext(ctx);
          setError(undefined);
          srcProcessedSet(canvas.toDataURL());
          setStatus(SmartcropStatus.LOADED);
        })
        .catch((err) => {
          setError(err);
          setStatus(SmartcropStatus.FAILED);
        });
    };

    function onerror(ev: ErrorEvent) {
      console.error(ev);
      setStatus(SmartcropStatus.FAILED);
    }

    const img = new Image();
    img.addEventListener("load", handleLoad as any);
    img.addEventListener("error", onerror);
    img.crossOrigin = "";
    img.src = src;

    return function cleanup() {
      setContext(undefined);
      srcProcessedSet(undefined);
      setError(undefined);
      setStatus(SmartcropStatus.LOADING);
      img.removeEventListener("load", handleLoad as any);
      img.removeEventListener("error", onerror);
    };
  }, deps);

  /**
   * Get the color palette of the images in the selected area.
   * If no area is set then the whole image is analyzed.
   *
   * The returned value is an array of colors which each color is an array of numbers representing `rgba`.
   */
  function getPalette(opts: GetPaletteOptions = {}) {
    if (!context) return [];
    const x = opts.x || 0;
    const y = opts.y || 0;
    const w = opts.width || width;
    const h = opts.height || height;
    const quality = opts.quality || 10;
    const size = opts.size || 5;
    const imageData = context.getImageData(x, y, w, h);
    const pixelCount = w * h;
    const pixelArray = createPixelArray(imageData.data, pixelCount, quality);
    // Send array to quantize function which clusters values
    // using median cut algorithm
    const cmap = quantize(pixelArray, size);
    const palette = cmap ? cmap.palette() : [];
    return palette as number[][];
  }

  return { src: srcProcessed, status, error, getPalette };
}

function createPixelArray(imgData: Uint8ClampedArray, pixelCount: number, quality: number): number[][] {
  const pixels = imgData;
  const pixelArray = [];

  for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
    offset = i * 4;
    r = pixels[offset + 0];
    g = pixels[offset + 1];
    b = pixels[offset + 2];
    a = pixels[offset + 3];

    // If pixel is mostly opaque and not white
    if (typeof a === "undefined" || a >= 125) {
      // @ts-ignore
      if (!(r > 250 && g > 250 && b > 250)) {
        pixelArray.push([r, g, b]);
      }
    }
  }
  return pixelArray as number[][];
}
