import { Fragment } from "react";

/**
 * Markdown sencillo y seguro (sin HTML crudo) para el blog:
 * ## y ### títulos, - listas, 1. listas numeradas, > citas, ![alt](url) imágenes,
 * **negrita**, *cursiva*, `código` y [enlaces](url).
 */
export function inline(text: string, keyBase = "i"): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}-${k++}`}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-${k++}`} className="font-semibold text-ink-900">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={`${keyBase}-${k++}`} className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[0.9em]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)\s]+)\)/)!;
      const safe = /^(https?:|mailto:|tel:|\/|#)/.test(href) ? href : "#";
      const ext = /^https?:/.test(safe);
      out.push(
        <a key={`${keyBase}-${k++}`} href={safe} className="link-u text-brand-600" {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {label}
        </a>,
      );
    } else out.push(<em key={`${keyBase}-${k++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}-${k++}`}>{text.slice(last)}</Fragment>);
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.startsWith("### ")) return <h3 key={key} className="mt-10 font-display text-2xl text-ink-900">{inline(b.slice(4), key)}</h3>;
        if (b.startsWith("## ")) return <h2 key={key} className="mt-12 font-display text-3xl text-ink-900">{inline(b.slice(3), key)}</h2>;
        const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (img) {
          return (
            <figure key={key} className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img[2]} alt={img[1]} loading="lazy" className="w-full rounded-xl border border-paper-line" />
              {img[1] && <figcaption className="mt-2 text-center text-sm text-ink-500">{img[1]}</figcaption>}
            </figure>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={key} className="my-6 space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{inline(l.slice(2), `${key}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+[.)] /.test(l))) {
          return (
            <ol key={key} className="my-6 space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 font-mono text-xs text-paper">{j + 1}</span>
                  <span>{inline(l.replace(/^\d+[.)] /, ""), `${key}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return (
            <blockquote key={key} className="my-8 rounded-r-xl border-l-4 border-brand-500 bg-brand-50/60 px-6 py-5 text-ink-800">
              {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), key)}
            </blockquote>
          );
        }
        return <p key={key} className="my-5">{inline(lines.join(" "), key)}</p>;
      })}
    </>
  );
}

export function readingMinutes(source: string) {
  return Math.max(1, Math.round(source.split(/\s+/).length / 200));
}
