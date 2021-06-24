import React, { useEffect, useState } from "react";

import { ONLOAD_TO_CANVAS, IS_IMG_LOADED, IMAGE_TO_CANVAS } from "./utils";

export function useImageAsCanvas(current: HTMLImageElement | undefined | null) {
  const [error, setError] = useState<Error | ErrorEvent | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!current) return;
    const handleLoad: React.ReactEventHandler<HTMLImageElement> = (ev) => {
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
      setError(ev.error);
    }

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
  }, [current]);

  return [canvas, error] as const;
}
