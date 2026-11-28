import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TC from "@/components/TC";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CaseCard } from "@/components/CaseSections";

export const metadata: Metadata = {
  title: "Casos de éxito",
  description: "Proyectos reales de Aldore: el reto, lo que hicimos y los resultados en números.",
  alternates: { canonical: "/casos" },
};

export default async function CasesPage() {
  const s = await getSettings();
  const cases = await prisma.caseStudy.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { id: "desc" }] });
  if (!cases.length) notFound();
  return (
    <>
      <section className="border-b border-paper-line">
        <div className="container-x pb-12 pt-14 sm:pt-20">
          <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Casos de éxito"}</TC></p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">{s["cases.pageTitle"]}<span className="text-brand-500">.</span></h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{s["cases.pageText"]}</p>
        </div>
      </section>
      <section className="py-16">
        <div className="container-x grid gap-5 md:grid-cols-2">
          {cases.map((c, i) => <div key={c.id} className={i === 0 ? "md:col-span-2" : ""}><CaseCard c={c} big={i === 0} /></div>)}
        </div>
      </section>
    </>
  );
}
