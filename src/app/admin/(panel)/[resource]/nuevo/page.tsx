import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import ResourceForm from "@/components/admin/ResourceForm";
import Flash from "@/components/admin/Flash";

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function NewResource({ params, searchParams }: Props) {
  await requireAdmin();
  const res = getResource((await params).resource);
  if (!res) notFound();
  const { error, back, ...rest } = await searchParams;
  const backTo = back && back.startsWith("/admin/") ? back : undefined;
  const initial = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  return (
    <div className="max-w-3xl">
      <Link href={backTo || `/admin/${res.key}`} className="text-sm text-slate-500 hover:text-brand-700">← {backTo ? "Volver" : res.label}</Link>
      <h1 className="mb-6 mt-2 font-display text-3xl text-ink-900">Nuevo {res.singular}</h1>
      <Flash error={error} />
      <ResourceForm res={res} initial={initial} back={backTo} />
    </div>
  );
}
