import { renderHook } from "@testing-library/react-hooks";

import { useSmartcrop } from "../src/use-smartcrop";

describe("useStartcrop", () => {
  it("is defined", () => {
    expect(useSmartcrop).toBeDefined();
  });
});
