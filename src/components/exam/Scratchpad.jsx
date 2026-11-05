import { useEffect, useRef, useState } from 'react';
import { Pen, Eraser, Undo2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Squared draft paper for working a task out by hand (finger or stylus).
// Strokes are stored with coordinates relative to the width, so they survive rotation/resizing.
const INKS = [
  { id: 'blue', css: '--pen' },
  { id: 'red', css: '--redpen' },
  { id: 'ink', css: '--ink' },
];

function inkColor(css) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(css).trim();
  return `hsl(${v})`;
}

export default function Scratchpad({ strokes, onChange, onClose, t }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(null);
  const [tool, setTool] = useState('pen');
  const [ink, setInk] = useState('blue');

  // redraw everything (on mount, resize, undo, clear)
  const redraw = () => {
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
    (strokes || []).forEach((s) => paint(ctx, s, w));
  };

  function paint(ctx, s, w) {
    if (!s.pts.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.erase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#000';
    } else {
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = inkColor(INKS.find((i) => i.id === s.ink)?.css || '--pen');
    }
    ctx.beginPath();
    s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * w) : ctx.moveTo(x * w, y * w)));
    if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * w + 0.1, s.pts[0][1] * w);
    ctx.stroke();
    ctx.restore();
  }

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  };

  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = { ink, erase: tool === 'eraser', pts: [point(e)] };
  };
  const move = (e) => {
    if (!drawing.current) return;
    drawing.current.pts.push(point(e));
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const w = c.getBoundingClientRect().width;
    const pts = drawing.current.pts;
    // draw just the newest segment for smooth live ink
    paint(ctx, { ...drawing.current, pts: pts.slice(-2) }, w);
  };
  const up = () => {
    if (!drawing.current) return;
    const s = drawing.current;
    drawing.current = null;
    onChange([...(strokes || []), s]);
  };

  const btn = (active) => cn('w-9 h-9 rounded-xl grid place-items-center border', active ? 'bg-pen text-on-pen border-pen' : 'bg-sheet border-line');

  return (
    <div
      className="fixed inset-x-0 z-20 bottom-0 flex flex-col bg-sheet border-t-2 border-pen/40 shadow-[0_-10px_30px_-12px_rgba(0,0,0,0.25)]"
      style={{ height: '46vh', paddingBottom: 'calc(var(--safe-bottom) + 76px)' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="max-w-3xl w-full mx-auto flex items-center gap-1.5 px-3 py-1.5">
        <span className="font-heading font-bold text-sm me-1">{t('p.draft')}</span>
        <button onClick={() => setTool('pen')} aria-label={t('p.pen')} aria-pressed={tool === 'pen'} className={btn(tool === 'pen')}><Pen className="w-4 h-4" /></button>
        {INKS.map((i) => (
          <button key={i.id} onClick={() => { setInk(i.id); setTool('pen'); }} aria-label={i.id} aria-pressed={ink === i.id && tool === 'pen'}
            className={cn('w-7 h-7 rounded-full border-2', ink === i.id && tool === 'pen' ? 'border-ink scale-110' : 'border-transparent')}
            style={{ background: `hsl(var(${i.css}))` }} />
        ))}
        <button onClick={() => setTool('eraser')} aria-label={t('p.eraser')} aria-pressed={tool === 'eraser'} className={btn(tool === 'eraser')}><Eraser className="w-4 h-4" /></button>
        <span className="flex-1" />
        <button onClick={() => onChange((strokes || []).slice(0, -1))} disabled={!strokes?.length} aria-label={t('common.back')} className={cn(btn(false), 'disabled:opacity-30')}><Undo2 className="w-4 h-4" /></button>
        <button onClick={() => onChange([])} disabled={!strokes?.length} aria-label={t('p.draftClear')} className={cn(btn(false), 'disabled:opacity-30 text-redpen')}><Trash2 className="w-4 h-4" /></button>
        <button onClick={onClose} aria-label={t('common.close')} className={btn(false)}><X className="w-4 h-4" /></button>
      </div>
      <div ref={wrapRef} className="paper flex-1 relative overflow-hidden mx-auto w-full max-w-3xl border-t border-line">
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
    </div>
  );
}
