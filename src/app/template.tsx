"use client";

/**
 * App Router `template.tsx` remounts on every navigation, so the fade/slide
 * animation re-runs each time — giving smooth page-to-page transitions.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
