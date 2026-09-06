const nodes = [
  { x: 60, y: 60, r: 5 },
  { x: 180, y: 40, r: 4 },
  { x: 290, y: 90, r: 6 },
  { x: 110, y: 150, r: 4 },
  { x: 230, y: 170, r: 5 },
  { x: 320, y: 200, r: 4 },
  { x: 80, y: 240, r: 5 },
  { x: 200, y: 260, r: 6 },
];

const edges: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [4, 7],
  [6, 7],
];

export default function HeroVisual() {
  return (
    <div
      aria-hidden
      className="animate-drift relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl border border-line bg-coal"
    >
      <div className="bg-grid absolute inset-0" />
      <div className="glow-brand absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2" />
      <svg
        viewBox="0 0 360 320"
        className="absolute inset-0 h-full w-full p-6"
        fill="none"
      >
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#FF9900"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            className="animate-dash"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r + 7} fill="#FF9900" opacity="0.12" />
            <circle cx={n.x} cy={n.y} r={n.r} fill="#141A20" stroke="#FF9900" strokeWidth="1.5" />
            <circle cx={n.x} cy={n.y} r={n.r - 2.5} fill="#FF9900" opacity={i % 3 === 0 ? 0.95 : 0.45} />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-line bg-ink/85 p-3 font-mono text-[11px] leading-relaxed backdrop-blur">
        <p className="text-faint">$ aws s3 ls sbg-workshops</p>
        <p className="text-emerald-300">✓ deployed · cloud-fundamentals-lab</p>
      </div>
    </div>
  );
}
