import type { LucideIcon } from "lucide-react";
import { Store } from "lucide-react";

export interface ConsoleLoginTheme {
  accent: string;
  icon?: LucideIcon;
  /** When set, shows the site logo instead of the accent icon badge. */
  logoVariant?: "compact" | "full";
}

export const CONSOLE_LOGIN_THEMES = {
  seller: {
    accent: "#FFD23F",
    icon: Store,
  },
  admin: {
    accent: "#e30613",
    logoVariant: "full",
  },
} as const satisfies Record<string, ConsoleLoginTheme>;

export type ConsoleLoginVariant = keyof typeof CONSOLE_LOGIN_THEMES;
