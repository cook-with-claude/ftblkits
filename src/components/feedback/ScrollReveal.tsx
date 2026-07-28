"use client";

import { useEffect } from "react";
import { initScrollReveal } from "@/lib/scroll-reveal";

/** Mounts the single page-wide reveal observer. Renders nothing. */
export function ScrollReveal() {
  useEffect(() => initScrollReveal(), []);
  return null;
}
