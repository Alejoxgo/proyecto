import Aldo from "./Aldo";

/**
 * Aldo cruza la sección volando de vez en cuando. Es decorativo: no se puede tocar,
 * no tapa nada y desaparece si el visitante prefiere menos movimiento.
 * El contenedor padre debe tener `relative overflow-hidden`.
 */
export default function AldoFlyBy({
  top = "20%",
  size = 72,
  every = 18,
  delay = 2,
  reverse = false,
  onDark = false,
}: {
  top?: string;
  size?: number;
  every?: number;
  delay?: number;
  reverse?: boolean;
  onDark?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`aldo-flyby z-0 ${reverse ? "reverse" : ""}`}
      style={{ top, ["--fly-time" as string]: `${every}s`, ["--fly-delay" as string]: `${delay}s` }}
    >
      <div style={{ width: size, height: size }}>
        <Aldo pose="fly" follow={false} onDark={onDark} className="h-full w-full" title="" />
      </div>
    </div>
  );
}
