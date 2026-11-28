/** Aldo celebra (confeti y pose de alegría) cuando alguien envía un formulario. */
export function celebrate() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aldore:celebrate"));
}
