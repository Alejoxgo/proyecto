/** "48% | más reservas" → { value: "48%", label: "más reservas" } */
export function parseResults(v: string) {
  return v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [value, ...rest] = l.split("|");
      return { value: value.trim(), label: rest.join("|").trim() };
    });
}

export const caseTags = (v: string) => v.split(",").map((t) => t.trim()).filter(Boolean);
