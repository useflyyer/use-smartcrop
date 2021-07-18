import { useRef } from "react";

import { dequal } from "dequal/lite";

export function useStable<T>(value?: T) {
  const ref = useRef<T>();
  if (!ref.current || !dequal(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}
