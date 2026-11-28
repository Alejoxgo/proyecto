import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DRAFT, SETTINGS_GROUPS } from "@/lib/settings";
import { groqReady } from "@/lib/i18n";
import VisualEditor from "@/components/admin/VisualEditor";

export const metadata = { title: "Editor visual" };

/** Grupos que no se ven en el sitio o que tienen su propia pantalla. */
const HIDDEN = new Set(["avisos", "temporada", "agendaHorario", "cobros"]);

export default async function EditorPage() {
  const session = await requireAdmin();
  const rows = await prisma.setting.findMany();
  const published: Record<string, string> = {};
  const draft: Record<string, string> = {};
  for (const g of SETTINGS_GROUPS) for (const f of g.fields) published[f.key] = f.default;
  for (const r of rows) {
    if (r.key.startsWith(DRAFT)) draft[r.key.slice(DRAFT.length)] = r.value;
    else published[r.key] = r.value;
  }
  const groups = SETTINGS_GROUPS.filter((g) => !HIDDEN.has(g.id)).map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    fields: g.fields.map((f) => ({ key: f.key, label: f.label, type: f.type || "text", help: f.help })),
  }));
  return <VisualEditor groups={groups} published={published} draft={draft} aiReady={groqReady()} userName={session.name.split(" ")[0] || ""} />;
}
