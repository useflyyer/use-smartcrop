import { ComponentProps, useEffect, useMemo, useRef } from "react";

import { dequal } from "dequal/lite";
import { useAsyncFn } from "react-use";
import type { AsyncState } from "react-use/lib/useAsyncFn";
import smartcrop, { CropOptions, CropResult } from "smartcrop";

export { CropScore, Crop, CropResult, CropBoost, CropOptions } from "smartcrop";

import { useImageCanvas } from "./use-image-canvas";
import { useStable } from "./use-stable";

export type UseSmartcropResult = AsyncState<CropResult | null>;

export function SMARTCROP_RESULT(source: HTMLCanvasElement, options: CropOptions) {
  const promise = smartcrop.crop(source, options);
  return promise;
}

export function CROP_CANVAS(
  source: HTMLCanvasElement,
  result: CropResult,
  options: Pick<CropOptions, "width" | "height">,
) {
  const scale = 1;
  const canvas = document.createElement("canvas");
  canvas.width = ~~(options.width * scale);
  canvas.height = ~~(options.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const crop = result.topCrop;
  // Origin: crop.x, crop.y, crop.width, crop.height
  // Destiny: 0, 0, canvas.width, canvas.height
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function useSmartcropResult(
  source: HTMLCanvasElement | null | undefined,
  options: CropOptions,
): UseSmartcropResult {
  const optionsStable = useStable(options);

  const [state, callback] = useAsyncFn(
    () => {
      if (source && optionsStable) {
        const promise = SMARTCROP_RESULT(source, optionsStable);
        return promise;
      }
      return Promise.resolve(null);
    },
    [source, optionsStable],
    { loading: Boolean(source) }, // initial value, doesn't matter if changes
  );

  useEffect(() => {
    if (source && optionsStable) {
      callback();
    }
  }, [callback, source, optionsStable]);

  return state;
}

export function useCroppedCanvas(
  source: HTMLCanvasElement | null | undefined,
  result: CropResult | null | undefined,
  options: Pick<CropOptions, "width" | "height">,
): HTMLCanvasElement | null {
  const resultRef = useRef<CropResult | null | undefined>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!source || !result || !result.topCrop || !options || !options.width || !options.height) {
    return null;
  }

  if (!dequal(resultRef.current, result)) {
    canvasRef.current = CROP_CANVAS(source, result, options);
    resultRef.current = result;
  }
  return canvasRef.current;
}

/**
 * Crop and image given a position and size in pixels.
 * The final images will have the desired dimension.
 * Returns `[string, Error?]` where the string is a DataURL you can use as `<img src={dataURL} />`.
 * @see https://github.com/jwagner/smartcrop.js
 */
export function useSmartcrop(
  image: ComponentProps<"img"> | null | undefined,
  options: CropOptions,
): [string | null, Error | null] {
  const [source, error] = useImageCanvas(image);
  const result = useSmartcropResult(source, options);
  const canvas = useCroppedCanvas(source, result.value, options);
  const src = useMemo(() => (canvas ? canvas.toDataURL() : null), [canvas]);
  return [src, error || result.error || null];
}
