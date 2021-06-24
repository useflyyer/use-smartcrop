import React, { useEffect, useState } from "react";

import quantize from "quantize";
import smartcrop from "smartcrop";

import { GetPaletteOptions } from "./use-palette";
import { CREATE_PIXEL_ARRAY } from "./utils";

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

export enum SmartcropStatus {
  LOADING = 0,
  LOADED = 1,
  FAILED = -1,
}

export interface UseSmartcropResult {
  /**
   * Final URL, use this as `<img src={src} />`
   */
  src: string | undefined;
  /**
   * Current operation status
   */
  status: SmartcropStatus;
  /**
   * ErrorEvent or Error object if `status` is `FAILED` (`-1`).
   */
  error: Error | ErrorEvent | undefined;
  /**
   * Get the color palette of the images in the selected area.
   * If no area is set then the whole image is analyzed.
   *
   * The returned value is an array of colors which each color is an array of numbers representing `rgba`.
   */
  getPalette: (opts?: GetPaletteOptions) => number[][];
}

/**
 * Crop and image given a position and size in pixels. The final images will have the desired dimension.
 * @see https://github.com/jwagner/smartcrop.js
 */
export function useSmartcrop(
  src: string | undefined | null | React.ComponentProps<"img">,
  options: CropOptions,
): UseSmartcropResult {
  const { width, height, minScale, boost = [], ruleOfThirds, debug } = options;
  const [srcProcessed, srcProcessedSet] = useState<string>();
  const [status, setStatus] = useState(SmartcropStatus.LOADING);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [error, setError] = useState<Error | ErrorEvent>();

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
      setError(ev.error);
      setStatus(SmartcropStatus.FAILED);
    }

    const img = new Image();
    img.addEventListener("load", handleLoad as any);
    img.addEventListener("error", onerror);
    if (typeof src === "object") {
      Object.assign(img, src);
    } else {
      img.crossOrigin = ""; // Use in conjunction with @flayyer/proxy
      img.src = src;
    }

    return function cleanup() {
      setContext(undefined);
      srcProcessedSet(undefined);
      setError(undefined);
      setStatus(SmartcropStatus.LOADING);
      img.removeEventListener("load", handleLoad as any);
      img.removeEventListener("error", onerror);
    };
  }, deps);

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
    const pixelArray = CREATE_PIXEL_ARRAY(imageData.data, pixelCount, quality);
    // Send array to quantize function which clusters values
    // using median cut algorithm
    const cmap = quantize(pixelArray, size);
    const palette = cmap ? cmap.palette() : [];
    return palette as number[][];
  }

  return { src: srcProcessed, status, error, getPalette };
}
