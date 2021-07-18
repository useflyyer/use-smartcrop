declare module "./quantize" {
  interface CMap {
    palette(): [number, number, number, number?][];
  }
  const quantize: (pixels: number[][], colorCount: number) => CMap | null;
  export default quantize;
}
