import { DependencyList, useMemo } from "react";

import quantize from "./quantize";
import { CREATE_PIXEL_ARRAY } from "./utils";

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

/**
 * Returns empty array if the only color is white.
 * @example
 * <img
      ref={logoRef}
      src={proxy(logo)}
      crossOrigin="" // Important to prevent "tainted canvas" errors
      className={clsx('h-full w-auto object-contain')}
    />
 */
export function usePalette(
  canvas: HTMLCanvasElement | null | undefined,
  opts: GetPaletteOptions = {},
  deps?: DependencyList,
) {
  const x = opts.x || 0;
  const y = opts.y || 0;
  const width = opts.width; // || canvas.width;
  const height = opts.height; // || canvas.height;
  const quality = opts.quality || 10;
  const size = opts.size || 5;

  return useMemo(
    () => {
      if (!canvas) return null;
      const context = canvas.getContext("2d");
      if (!context) return null;
      const w = width || canvas.width;
      const h = height || canvas.height;
      const imageData = context.getImageData(x, y, w, h);
      const pixelCount = w * h;
      const pixelArray = CREATE_PIXEL_ARRAY(imageData.data, pixelCount, quality);
      // Send array to quantize function which clusters values
      // using median cut algorithm
      const cmap = quantize(pixelArray, size);
      const palette = cmap ? cmap.palette() : [];
      return palette as number[][];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps ? deps.concat(canvas, height, quality, size, width, x, y) : [canvas, height, quality, size, width, x, y],
  );
}
