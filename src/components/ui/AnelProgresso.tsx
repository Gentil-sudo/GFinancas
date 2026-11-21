/** Anel de progresso (0–100) com a porcentagem no meio. Cores só por tokens. */
export function AnelProgresso({
  porcentagem,
  tamanho = 132,
  rotulo,
}: {
  porcentagem: number
  tamanho?: number
  rotulo: string
}) {
  const p = Math.max(0, Math.min(100, porcentagem))
  const raio = 52
  const circunferencia = 2 * Math.PI * raio
  return (
    <svg
      role="img"
      aria-label={rotulo}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 132 132"
      className="shrink-0"
    >
      <circle cx="66" cy="66" r={raio} fill="none" strokeWidth="14" className="stroke-track" />
      <circle
        cx="66"
        cy="66"
        r={raio}
        fill="none"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * circunferencia} ${circunferencia}`}
        transform="rotate(-90 66 66)"
        className="stroke-primary transition-[stroke-dasharray] duration-500"
      />
      <text
        x="66"
        y="73"
        textAnchor="middle"
        className="fill-text font-display text-[22px] font-bold"
      >
        {Math.round(p)}%
      </text>
    </svg>
  )
}
