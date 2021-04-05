import React, { useEffect, useState } from "react";
import smartcrop from "smartcrop";
import quantize from "quantize";

export interface CropBoost {
  x: number;
  y: number;
  width: number;
  height: number;
  weight: number;
}
export interface CropOptions {
  minScale?: number;
  width: number;
  height: number;
  boost?: CropBoost[];
  ruleOfThirds?: boolean;
  debug?: boolean;
}
export interface GetPaletteOptions {
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  quality?: number | null;
}

export enum SmartcropStatus {
  LOADING = 0,
  LOADED = 1,
  FAILED = -1,
}

export function useSmartcrop(src: string | undefined | null, options: CropOptions) {
  const {
    width,
    height,
    minScale,
    boost = [],
    ruleOfThirds,
    debug,
  } = options;
  const [srcProcessed, srcProcessedSet] = useState<string>();
  const [status, setStatus] = useState(SmartcropStatus.LOADING);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [error, setError] = useState<Error>()

  const serialized = boost.map(b => JSON.stringify(b));
  const deps = ([] as any[]).concat(src, width, height, minScale, ruleOfThirds, debug, serialized);
  useEffect(() => {
    if (!src) return;

    const handleLoad: React.ReactEventHandler<HTMLImageElement> = (ev: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const element = ev.target as HTMLImageElement;

      smartcrop.crop(element, options).then(({ topCrop: crop }) => {
        const scale = 1;
        const canvas = document.createElement("canvas");
        canvas.width = ~~(width * scale);
        canvas.height = ~~(height * scale);
        const ctx = canvas.getContext("2d")!;
        // Origin: crop.x, crop.y, crop.width, crop.height
        // Destiny: 0, 0, canvas.width, canvas.height
        ctx.drawImage(
          element,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        setContext(ctx);
        setError(undefined);
        srcProcessedSet(canvas.toDataURL());
        setStatus(SmartcropStatus.LOADED);
      }).catch(err => {
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


  function getPalette(opts: GetPaletteOptions = {}) {
    if (!context) return [];
    const x = opts.x || 0;
    const y = opts.y || 0;
    const w = opts.width || width;
    const h = opts.height || height;
    const quality = opts.quality || 10
    const size = opts.size || 5
    const imageData = context.getImageData(x, y, w, h);
    const pixelCount = w * h;
    const pixelArray = createPixelArray(imageData.data, pixelCount, quality);
    // Send array to quantize function which clusters values
    // using median cut algorithm
    const cmap    = quantize(pixelArray, size);
    const palette = (cmap ? cmap.palette() : []);
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
