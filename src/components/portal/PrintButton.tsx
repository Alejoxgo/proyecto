"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary !py-2 text-sm">
      Descargar PDF / imprimir
    </button>
  );
}
