"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function DriverFooterLinks() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/storefront/settings")
      .then((response) => response.json())
      .then((data) => { if (active) setEnabled(data?.config?.driverPortalEnabled !== false); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!enabled) return null;
  return <ul className="mt-2.5 flex flex-col gap-2.5">
    <li><Link href="/driver/register" className="block text-sm leading-5 text-neutral-600 transition-colors hover:text-neutral-900">Become a driver</Link></li>
    <li><Link href="/driver/login" className="block text-sm leading-5 text-neutral-600 transition-colors hover:text-neutral-900">Driver sign in</Link></li>
  </ul>;
}
