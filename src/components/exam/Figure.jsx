// Draws task figures from data (no images needed, works offline and in every theme).

const PEN = 'hsl(var(--pen))';
const INK = 'hsl(var(--ink))';
const SOFT = 'hsl(var(--ink-soft))';
const LINE = 'hsl(var(--line))';
const FILL = 'hsl(var(--pen) / 0.14)';

// Room a label needs, so the drawing area always grows with its text and nothing is cut off
// (wide digits and long units included). Checked for every generated figure in e2e/figures.spec.js.
const textW = (label, size = 13) => String(label).length * size * 0.62 + 6;
const withUnit = (n, unit) => (unit ? `${n} ${unit}` : String(n));

function Bars({ labels, values }) {
  const max = Math.max(...values);
  // at most ~6 grid lines, whatever the size of the numbers
  let step = max <= 12 ? 1 : max <= 30 ? 5 : 10;
  for (const m of [2, 2.5, 2]) { if (max / step > 6) step *= m; }
  while (max / step > 6) step *= 10;
  const top = Math.ceil(max / step) * step;
  const W = 340, H = 210, B = 34, T = 12;
  const L = Math.max(34, textW(top, 11) + 8);
  const bw = (W - L - 10) / labels.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 6} y1={y(v)} y2={y(v)} stroke={LINE} strokeWidth="1" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={SOFT}>{v}</text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <rect x={L + i * bw + bw * 0.18} y={y(v)} width={bw * 0.64} height={y(0) - y(v)} rx="4" fill={PEN} opacity="0.85" />
          <text x={L + i * bw + bw / 2} y={H - B + 18} textAnchor="middle" fontSize="12" fill={INK}>{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-center border-collapse tabular">
        <thead>
          <tr>{headers.map((h) => <th key={h} className="px-3 py-1.5 border border-line font-bold text-sm">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-1.5 border border-line">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rect({ a, b, unit }) {
  const s = 200 / Math.max(a, b);
  const w = a * s, h = b * s;
  const la = withUnit(a, unit), lb = withUnit(b, unit);
  // a narrow shape still needs room for the label under it
  const x0 = Math.max(30, (textW(la) - w) / 2 + 6);
  const W = Math.max(x0 + w + 8 + textW(lb), x0 + w / 2 + textW(la) / 2 + 4);
  return (
    <svg viewBox={`0 0 ${W} ${h + 50}`} className="w-full max-w-[260px]">
      <rect x={x0} y="15" width={w} height={h} fill={FILL} stroke={PEN} strokeWidth="2.5" />
      <text x={x0 + w / 2} y={h + 38} textAnchor="middle" fontSize="13" fill={INK}>{la}</text>
      <text x={x0 + w + 8} y={15 + h / 2 + 4} fontSize="13" fill={INK}>{lb}</text>
    </svg>
  );
}

function LShape({ a, b, c, unit }) {
  const s = 200 / Math.max(a, b);
  const W = a * s, H = b * s, C = c * s;
  const la = withUnit(a, unit), lb = withUnit(b, unit);
  const x0 = Math.max(30, (textW(la) - W) / 2 + 6);
  const VW = Math.max(x0 + W + 8 + textW(lb), x0 + W / 2 + textW(la) / 2 + 4);
  const p = `${x0},15 ${x0 + W - C},15 ${x0 + W - C},${15 + C} ${x0 + W},${15 + C} ${x0 + W},${15 + H} ${x0},${15 + H}`;
  return (
    <svg viewBox={`0 0 ${VW} ${H + 50}`} className="w-full max-w-[280px]">
      <rect x={x0 + W - C} y="15" width={C} height={C} fill="none" stroke={SOFT} strokeDasharray="4 4" />
      <polygon points={p} fill={FILL} stroke={PEN} strokeWidth="2.5" />
      <text x={x0 + W / 2} y={H + 38} textAnchor="middle" fontSize="13" fill={INK}>{la}</text>
      <text x={x0 + W + 8} y={15 + (H + C) / 2 + 4} fontSize="13" fill={INK}>{lb}</text>
      <text x={x0 + W - C / 2} y={15 + C / 2 + 4} textAnchor="middle" fontSize="12" fill={SOFT}>{c}</text>
    </svg>
  );
}

function Cuboid({ a, b, c, unit }) {
  const s = 150 / Math.max(a, b + c * 0.5, c);
  const w = a * s, h = c * s, d = b * s * 0.5;
  const la = withUnit(a, unit), lb = withUnit(b, unit);
  const x0 = Math.max(25, textW(c) + 10, (textW(la) - w) / 2 + 6), y0 = 15 + d;
  const bx = x0 + w + d / 2 + 8;
  const VW = Math.max(x0 + w + d + 12, bx + textW(lb), x0 + w / 2 + textW(la) / 2 + 4);
  const front = `${x0},${y0} ${x0 + w},${y0} ${x0 + w},${y0 + h} ${x0},${y0 + h}`;
  const topF = `${x0},${y0} ${x0 + d},${y0 - d} ${x0 + w + d},${y0 - d} ${x0 + w},${y0}`;
  const side = `${x0 + w},${y0} ${x0 + w + d},${y0 - d} ${x0 + w + d},${y0 + h - d} ${x0 + w},${y0 + h}`;
  return (
    <svg viewBox={`0 0 ${VW} ${h + d + 45}`} className="w-full max-w-[260px]">
      <polygon points={topF} fill="hsl(var(--pen) / 0.22)" stroke={PEN} strokeWidth="2" />
      <polygon points={side} fill="hsl(var(--pen) / 0.08)" stroke={PEN} strokeWidth="2" />
      <polygon points={front} fill={FILL} stroke={PEN} strokeWidth="2" />
      <text x={x0 + w / 2} y={y0 + h + 20} textAnchor="middle" fontSize="13" fill={INK}>{la}</text>
      <text x={bx} y={y0 + h - d / 2 + 14} fontSize="13" fill={INK}>{lb}</text>
      <text x={x0 - 6} y={y0 + h / 2} textAnchor="end" fontSize="13" fill={INK}>{c}</text>
    </svg>
  );
}

function Grid({ size, cells, axis, small }) {
  // size×size squares; axis tasks mirror in the dashed middle line, point tasks around the red centre
  const s = small ? 18 : 30;
  const filled = new Set(cells.map(([x, y]) => `${x},${y}`));
  const W = size * s + 2;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className={small ? 'w-[84px]' : 'w-full max-w-[170px]'}>
      {Array.from({ length: size * size }).map((_, i) => {
        const x = i % size, y = Math.floor(i / size);
        return (
          <rect key={i} x={1 + x * s} y={1 + y * s} width={s} height={s}
            fill={filled.has(`${x},${y}`) ? PEN : 'transparent'} fillOpacity={0.82} stroke={LINE} strokeWidth="1" />
        );
      })}
      <rect x="1" y="1" width={size * s} height={size * s} fill="none" stroke={SOFT} strokeWidth="1.5" />
      {axis === 'vertical' && (
        <line x1={W / 2} x2={W / 2} y1="0" y2={W} stroke="hsl(var(--redpen))" strokeWidth="2.5" strokeDasharray="6 5" />
      )}
      {axis === 'point' && <circle cx={W / 2} cy={W / 2} r={small ? 3 : 5} fill="hsl(var(--redpen))" />}
    </svg>
  );
}

export default function Figure({ figure }) {
  if (!figure) return null;
  switch (figure.kind) {
    case 'bars': return <Bars {...figure} />;
    case 'table': return <Table {...figure} />;
    case 'rect': return <Rect {...figure} />;
    case 'lshape': return <LShape {...figure} />;
    case 'cuboid': return <Cuboid {...figure} />;
    case 'grid': return <Grid {...figure} />;
    default: return null;
  }
}
