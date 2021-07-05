import { ComponentProps, useEffect, useState, ReactEventHandler } from "react";

import { ONLOAD_TO_CANVAS, IS_IMG_LOADED, IMAGE_TO_CANVAS } from "./utils";

export function useImageCanvas(image: ComponentProps<"img"> | null | undefined = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const {
    src,
    crossOrigin = "",
    decoding,
    loading,
    referrerPolicy,
    ...attributes // TODO
  } = image || {};

  useEffect(() => {
    if (!src) return;
    const handleLoad: ReactEventHandler<HTMLImageElement> = (ev) => {
      try {
        const instance = ONLOAD_TO_CANVAS(ev);
        setCanvas(instance);
        setError(null);
      } catch (err) {
        setCanvas(null);
        setError(err);
      }
    };
    function onerror(ev: ErrorEvent) {
      // @ts-expect-error TODO: parse or create Error
      setError(ev);
    }

    const current = new Image();
    current.crossOrigin = crossOrigin; // Use in conjunction with @flayyer/proxy
    current.src = src;
    if (decoding) current.decoding = decoding;
    if (loading) current.loading = loading;
    if (referrerPolicy) current.referrerPolicy = referrerPolicy;

    if (IS_IMG_LOADED(current)) {
      try {
        const instance = IMAGE_TO_CANVAS(current);
        setCanvas(instance);
        setError(null);
      } catch (err) {
        setCanvas(null);
        setError(err);
      }
    } else {
      current.addEventListener("load", handleLoad as any);
      current.addEventListener("error", onerror);
    }

    return function cleanup() {
      setError(null);
      try {
        current.removeEventListener("load", handleLoad as any);
      } catch (err) {}
      try {
        current.removeEventListener("error", onerror);
      } catch (err) {}
    };
  }, [src, crossOrigin, decoding, loading, referrerPolicy]);

  return [canvas, error] as const;
}
