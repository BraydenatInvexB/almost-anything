import "server-only";

export type {
  WhiteBackgroundMethod,
  WhiteBackgroundResult,
  WhiteBackgroundOptions,
} from "./types";
export { applyWhiteBackground } from "./apply";
export { compositeOntoWhite, frameOnWhite } from "./compose";
export { parseWhiteBackgroundFlag, normalizeWhiteBackgroundOptions } from "./options";
