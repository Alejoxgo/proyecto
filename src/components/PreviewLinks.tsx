"use client";
import { useEffect } from "react";

/**
 * En la vista previa del panel (borrador o temática), los enlaces internos conservan el modo vista previa
 * para que puedas navegar por el sitio sin perderla.
 */
export default function PreviewLinks({ params }: { params: string }) {
  useEffect(() => {
    const [k, v] = params.split("=");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || a.target === "_blank" || !href.startsWith("/") || href.startsWith("//") || href.startsWith("/admin")) return;
      const u = new URL(href, location.origin);
      u.searchParams.set(k, v);
      e.preventDefault();
      e.stopPropagation();
      location.assign(u.pathname + u.search + u.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [params]);
  return null;
}
