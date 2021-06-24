import React from "react";

export const IMAGE_TO_CANVAS = (image: HTMLImageElement) => {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const instance = CREATE_CANVAS(w, h);
  if (image.naturalWidth && (image.naturalWidth != image.width || image.naturalHeight != image.height)) {
    instance.width = image.naturalWidth;
    instance.height = image.naturalHeight;
  } else {
    instance.width = image.width;
    instance.height = image.height;
  }
  const ctx = instance.getContext("2d");
  if (ctx) {
    ctx.drawImage(image, 0, 0);
    return instance;
  } else {
    throw new Error("Couldn't get canvas context");
  }
};

export const ONLOAD_TO_CANVAS = (ev: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const image = ev.target as HTMLImageElement;
  return IMAGE_TO_CANVAS(image);
};

export function IS_IMG_LOADED(imgElement: HTMLImageElement): boolean {
  return imgElement.complete && imgElement.naturalHeight !== 0;
}

function CREATE_CANVAS(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function CREATE_PIXEL_ARRAY(imgData: Uint8ClampedArray, pixelCount: number, quality: number): number[][] {
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
