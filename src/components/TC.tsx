"use client";
import { createContext, useContext } from "react";

/**
 * Textos fijos de la interfaz traducidos. En español el diccionario va vacío y se muestra el texto tal cual.
 * El diccionario lo arma el servidor (ver UiDict en el layout del sitio).
 */
export const UiContext = createContext<Record<string, string>>({});

export function UiProvider({ dict, children }: { dict: Record<string, string>; children: React.ReactNode }) {
  return <UiContext.Provider value={dict}>{children}</UiContext.Provider>;
}

/** Para textos sueltos en atributos (placeholder, aria-label…) dentro de componentes cliente. */
export function useTr() {
  const d = useContext(UiContext);
  return (s: string) => {
    const k = s.trim();
    const v = d[k];
    return v === undefined ? s : s.replace(k, v);
  };
}

export default function TC({ children }: { children: string }) {
  const tr = useTr();
  return <>{tr(children)}</>;
}
