import TC from "@/components/TC";
import Aldo from "@/components/Aldo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center text-ink-900">
      <Aldo pose="think" className="h-40 w-40" />
      <p className="mt-4 font-display text-8xl">404<span className="text-brand-500">.</span></p>
      <h1 className="mt-4 text-xl text-ink-700"><TC>{"Aldo buscó por todas partes, pero esta página no existe."}</TC></h1>
      <Link href="/" className="btn-primary mt-8"><TC>{"Volver al inicio"}</TC></Link>
    </div>
  );
}
