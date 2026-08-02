export type WhiteBackgroundMethod =
  | "unchanged"
  | "already-white"
  | "ai-edit"
  | "ai-remove"
  | "alpha-flatten"
  | "white-frame";

export interface WhiteBackgroundResult {
  bytes: Buffer;
  contentType: "image/jpeg";
  method: WhiteBackgroundMethod;
}

export interface WhiteBackgroundOptions {
  /** When false, upload the photo as-is (EXIF-rotated JPEG only). Default true. */
  enabled?: boolean;
  /**
   * When enabled, ask vision (OpenAI/Claude) whether the backdrop is already white
   * and skip AI editing if so. Default true.
   */
  skipIfAlreadyWhite?: boolean;
}

export type ProviderOutput =
  | { kind: "cutout"; bytes: Buffer }
  | { kind: "final"; bytes: Buffer };
