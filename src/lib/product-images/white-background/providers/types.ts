import "server-only";

import type { ProviderOutput } from "../types";

export interface WhiteBackgroundProvider {
  readonly id: string;
  isAvailable(): boolean;
  /** Cutout (transparent) or final white-backdrop image. */
  process(input: Buffer): Promise<ProviderOutput>;
}
