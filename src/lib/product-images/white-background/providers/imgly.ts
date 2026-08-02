import "server-only";

import type { WhiteBackgroundProvider } from "./types";

/** Local ONNX model via IMG.LY — offline fallback. */
export function createImglyProvider(): WhiteBackgroundProvider {
  return {
    id: "imgly",
    isAvailable() {
      return process.env.PRODUCT_IMAGE_BG_REMOVAL !== "off";
    },
    async process(input) {
      const { removeBackground } = await import("@imgly/background-removal-node");
      const blob = await removeBackground(input, {
        model: "small",
        output: { format: "image/png", quality: 1 },
      });
      return { kind: "cutout", bytes: Buffer.from(await blob.arrayBuffer()) };
    },
  };
}
