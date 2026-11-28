import Aldo, { type AldoPose, type AldoWear } from "./Aldo";

/** Las 10 versiones de Aldo para foto de perfil. El valor guardado en el usuario es el id (ej. "aldo-3"). */
export const ALDO_AVATARS: { id: string; name: string; bg: string; wear: AldoWear[]; pose?: AldoPose }[] = [
  { id: "aldo-1", name: "Clásico", bg: "#f4f1ea", wear: [] },
  { id: "aldo-2", name: "Programador", bg: "#dbeafe", wear: ["glasses"] },
  { id: "aldo-3", name: "Soporte", bg: "#ede9fe", wear: ["headset"] },
  { id: "aldo-4", name: "Deportivo", bg: "#dcfce7", wear: ["cap"] },
  { id: "aldo-5", name: "Ejecutivo", bg: "#fef3c7", wear: ["bowtie", "glasses"] },
  { id: "aldo-6", name: "Fiesta", bg: "#fce7f3", wear: ["party"] },
  { id: "aldo-7", name: "Jefe", bg: "#fef9c3", wear: ["crown"] },
  { id: "aldo-8", name: "Invierno", bg: "#ccfbf1", wear: ["beanie", "scarf"] },
  { id: "aldo-9", name: "Graduado", bg: "#e5e7eb", wear: ["grad"] },
  { id: "aldo-10", name: "Enamorado", bg: "#ffe4e6", wear: ["heart"], pose: "happy" },
];

export function AldoAvatar({ id, className = "h-10 w-10" }: { id: string; className?: string }) {
  const a = ALDO_AVATARS.find((x) => x.id === id) ?? ALDO_AVATARS[0];
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 ${className}`} style={{ background: a.bg }} title={`Aldo ${a.name.toLowerCase()}`}>
      <span className="absolute inset-x-[-12%] top-[2%] bottom-[-40%]">
        <Aldo pose={a.pose ?? "base"} wear={a.wear} still className="h-full w-full" title="" />
      </span>
    </span>
  );
}

/** Foto de perfil de un usuario del panel: su foto, su Aldo elegido o sus iniciales. */
export function UserAvatar({ avatar, name, className = "h-10 w-10" }: { avatar?: string | null; name: string; className?: string }) {
  if (avatar?.startsWith("data:image/") || avatar?.startsWith("https://")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className={`shrink-0 rounded-full object-cover ring-1 ring-black/5 ${className}`} />;
  }
  if (avatar?.startsWith("aldo-")) return <AldoAvatar id={avatar} className={className} />;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return <span className={`grid shrink-0 place-items-center rounded-full bg-brand-500 font-display text-sm font-semibold text-white ${className}`}>{initials || "?"}</span>;
}
