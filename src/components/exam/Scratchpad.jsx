import { useEffect, useMemo, useRef, useState } from 'react';
import { Pen, Eraser, Undo2, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Full-screen squared notebook for working a task out by hand (finger or stylus).
// The task stays pinned on top, and in maths the task's numbers can be tapped onto the paper
// as "stamps" and dragged around – so a child only writes the working, not every digit.
// Items are stored with coordinates relative to the width, so they survive rotation/resizing:
//   stroke: { ink, erase, pts: [[x, y], …] }      stamp: { num: '12,5', x, y }
const INKS = [
  { id: 'blue', css: '--pen' },
  { id: 'red', css: '--redpen' },
  { id: 'ink', css: '--ink' },
];
const STAMP_PX = 26; // stamp font size in screen pixels

function inkColor(css) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(css).trim();
  return `hsl(${v})`;
}

// the numbers that appear in a maths task, in order, without repeats (fractions kept whole)
export function taskNumbers(q) {
  if (!q || q.subject !== 'math') return [];
  const text = [q.context, q.text, q.expr].filter(Boolean).join(' ');
  const found = text.match(/\d+(?:[.,]\d+)?(?:\s?\/\s?\d+)?/g) || [];
  return [...new Set(found.map((n) => n.replace(/\s/g, '')))].slice(0, 12);
}

export default function Scratchpad({ strokes, onChange, onClose, t, q }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(null);
  const dragging = useRef(null);
  const [tool, setTool] = useState('pen');
  const [ink, setInk] = useState('blue');
  const [taskOpen, setTaskOpen] = useState(false);
  const items = strokes || [];
  const nums = useMemo(() => taskNumbers(q), [q]);

  function stampBox(ctx, s, w) {
    ctx.font = `800 ${STAMP_PX}px ui-rounded, system-ui, sans-serif`;
    const tw = ctx.measureText(s.num).width;
    return { x: s.x * w - 8, y: s.y * w - STAMP_PX / 2 - 6, w: tw + 16, h: STAMP_PX + 12 };
  }

  function paint(ctx, s, w) {
    if (s.num !== undefined) {
      const b = stampBox(ctx, s, w);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 214, 10, 0.35)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(b.x, b.y, b.w, b.h, 8) : ctx.rect(b.x, b.y, b.w, b.h);
      ctx.fill();
      ctx.fillStyle = inkColor('--ink');
      ctx.textBaseline = 'middle';
      ctx.fillText(s.num, s.x * w, s.y * w + 1);
      ctx.restore();
      return;
    }
    if (!s.pts?.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.erase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 26;
      ctx.strokeStyle = '#000';
    } else {
      ctx.lineWidth = 3;
      ctx.strokeStyle = inkColor(INKS.find((i) => i.id === s.ink)?.css || '--pen');
    }
    ctx.beginPath();
    s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * w) : ctx.moveTo(x * w, y * w)));
    if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * w + 0.1, s.pts[0][1] * w);
    ctx.stroke();
    ctx.restore();
  }

  // redraw everything (on mount, resize, undo, clear, stamp moves)
  const redraw = (list = items) => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // strokes first, stamps on top so they never disappear under ink
    list.filter((s) => s.num === undefined).forEach((s) => paint(ctx, s, w));
    list.filter((s) => s.num !== undefined).forEach((s) => paint(ctx, s, w));
  };

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(() => redraw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // the paper must not scroll the page behind it
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const rel = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  };
  const hitStamp = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d');
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    for (let i = items.length - 1; i >= 0; i--) {
      const s = items[i];
      if (s.num === undefined) continue;
      const b = stampBox(ctx, s, r.width);
      if (px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 6 && py <= b.y + b.h + 6) return i;
    }
    return -1;
  };

  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const hit = hitStamp(e);
    if (hit >= 0 && tool === 'eraser') {
      onChange(items.filter((_, i) => i !== hit));
      return;
    }
    if (hit >= 0) {
      const [x, y] = rel(e);
      dragging.current = { i: hit, dx: x - items[hit].x, dy: y - items[hit].y, list: items.slice() };
      return;
    }
    drawing.current = { ink, erase: tool === 'eraser', pts: [rel(e)] };
  };
  const move = (e) => {
    if (dragging.current) {
      const d = dragging.current;
      const [x, y] = rel(e);
      d.list[d.i] = { ...d.list[d.i], x: Math.max(0, x - d.dx), y: Math.max(0.03, y - d.dy) };
      redraw(d.list);
      return;
    }
    if (!drawing.current) return;
    drawing.current.pts.push(rel(e));
    const c = canvasRef.current;
    const pts = drawing.current.pts;
    // draw just the newest segment for smooth live ink
    paint(c.getContext('2d'), { ...drawing.current, pts: pts.slice(-2) }, c.getBoundingClientRect().width);
  };
  const up = () => {
    if (dragging.current) {
      const { list } = dragging.current;
      dragging.current = null;
      onChange(list);
      return;
    }
    if (!drawing.current) return;
    const s = drawing.current;
    drawing.current = null;
    onChange([...items, s]);
  };

  // a new stamp goes to the next free spot along the top rows of the paper
  const addStamp = (num) => {
    const n = items.filter((s) => s.num !== undefined).length;
    const col = n % 4;
    const row = Math.floor(n / 4) % 6;
    onChange([...items, { num, x: 0.05 + col * 0.24, y: 0.07 + row * 0.13 }]);
  };

  const btn = (active) => cn('w-10 h-10 rounded-full grid place-items-center border-2 shrink-0', active ? 'bg-pen text-on-pen border-pen' : 'bg-sheet border-line');

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-sheet"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={t('p.draft')}
    >
      {/* the task, pinned (short by default, tap to read it all) + Done, always in reach */}
      <div className="max-w-3xl w-full mx-auto flex items-start gap-2 px-3 pt-2 pb-1.5 border-b border-line">
        {(q?.text || q?.expr) ? (
          <button onClick={() => setTaskOpen((o) => !o)} aria-expanded={taskOpen} className="flex-1 min-w-0 text-start flex items-start gap-1.5">
            <span className={cn('flex-1 min-w-0 text-[14.5px] leading-snug font-bold', !taskOpen && 'line-clamp-2')}>
              {q.text}{q.expr && <span className="block font-heading text-lg mt-0.5">{q.expr}</span>}
              {taskOpen && q.context && <span className="block mt-1 font-normal text-ink-soft whitespace-pre-line">{q.context}</span>}
            </span>
            {taskOpen ? <ChevronUp className="w-5 h-5 text-ink-soft shrink-0 mt-0.5" /> : <ChevronDown className="w-5 h-5 text-ink-soft shrink-0 mt-0.5" />}
          </button>
        ) : <span className="flex-1 font-heading font-bold self-center">{t('p.draft')}</span>}
        <button onClick={onClose}
          className="h-10 rounded-full border-[3px] border-[#1B2340] bg-[#BDF0CF] text-[#1B2340] px-3 font-heading font-extrabold flex items-center gap-1 shadow-[2px_2px_0_0_rgba(27,35,64,0.85)] shrink-0">
          <Check className="w-4 h-4" />{t('p.draftDone')}
        </button>
      </div>

      {/* the task's numbers: tap to put one on the paper, then drag it */}
      {nums.length > 0 && (
        <div className="max-w-3xl w-full mx-auto px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto border-b border-line">
          <span className="text-[11px] font-bold text-ink-soft shrink-0 max-w-[6rem] leading-tight">{t('p.draftNums')}</span>
          {nums.map((n) => (
            <button key={n} onClick={() => addStamp(n)}
              className="shrink-0 rounded-lg border-2 border-[#1B2340] bg-marker text-[#1B2340] px-2.5 py-1 font-heading font-extrabold tabular shadow-[2px_2px_0_0_rgba(27,35,64,0.85)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
              {n}
            </button>
          ))}
        </div>
      )}

      <div ref={wrapRef} className="paper flex-1 relative overflow-hidden mx-auto w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        />
      </div>

      {/* tools at the bottom, where the thumb is */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between gap-1 px-3 py-2 border-t border-line">
        <button onClick={() => setTool('pen')} aria-label={t('p.pen')} aria-pressed={tool === 'pen'} className={btn(tool === 'pen')}><Pen className="w-4 h-4" /></button>
        {INKS.map((i) => (
          <button key={i.id} onClick={() => { setInk(i.id); setTool('pen'); }} aria-label={i.id} aria-pressed={ink === i.id && tool === 'pen'}
            className={cn('w-7 h-7 rounded-full border-2 shrink-0', ink === i.id && tool === 'pen' ? 'border-ink scale-110' : 'border-transparent')}
            style={{ background: `hsl(var(${i.css}))` }} />
        ))}
        <button onClick={() => setTool('eraser')} aria-label={t('p.eraser')} aria-pressed={tool === 'eraser'} className={btn(tool === 'eraser')}><Eraser className="w-4 h-4" /></button>
        <button onClick={() => onChange(items.slice(0, -1))} disabled={!items.length} aria-label={t('common.back')} className={cn(btn(false), 'disabled:opacity-30')}><Undo2 className="w-4 h-4" /></button>
        <button onClick={() => onChange([])} disabled={!items.length} aria-label={t('p.draftClear')} className={cn(btn(false), 'disabled:opacity-30 text-redpen')}><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
