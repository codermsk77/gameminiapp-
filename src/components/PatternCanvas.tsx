import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { Pattern } from '../data/patterns';
import { hapticLight, hapticSelection } from '../utils/haptic';

const NODE_R = 6;
const HIT_R = 20;
const STROKE = 1.5;
const snapCoord = (value: number) => Math.round(value) + 0.5;

function getSvgCoords(
  e: React.MouseEvent | React.TouchEvent,
  rect: DOMRect
): [number, number] {
  const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
  return [clientX - rect.left, clientY - rect.top];
}

function findNearestNode(
  x: number,
  y: number,
  nodes: [number, number][],
  size: number,
  padding: number
): number | null {
  let minD = HIT_R;
  let idx: number | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const nx = snapCoord(padding + nodes[i][0] * (size - 2 * padding));
    const ny = snapCoord(padding + (1 - nodes[i][1]) * (size - 2 * padding));
    const d = Math.hypot(x - nx, y - ny);
    if (d < minD) {
      minD = d;
      idx = i;
    }
  }
  return idx;
}

export interface PatternCanvasRef {
  undo: () => boolean;
  hasDrawn: () => boolean;
}

interface PatternCanvasProps {
  pattern: Pattern;
  size?: number;
  className?: string;
}

export const PatternCanvas = forwardRef<PatternCanvasRef, PatternCanvasProps>(
  function PatternCanvas({ pattern, size = 280, className = '' }, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [userLines, setUserLines] = useState<[number, number][][]>([]);
  const [currentLine, setCurrentLine] = useState<[number, number][] | null>(null);
  const lastNodeRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (userLines.length === 0) return false;
      setUserLines((prev) => prev.slice(0, -1));
      hapticLight();
      return true;
    },
    hasDrawn: () => userLines.length > 0,
  }), [userLines.length]);

  const padding = size * 0.12;

  const toSvg = useCallback(
    (nx: number, ny: number) => {
      // Привязка к пиксельной сетке убирает визуальный "дрейф" вертикалей и горизонталей.
      const x = snapCoord(padding + nx * (size - 2 * padding));
      const y = snapCoord(padding + (1 - ny) * (size - 2 * padding));
      return [x, y] as const;
    },
    [size, padding]
  );

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [x, y] = getSvgCoords(e, rect);
      const nodeIdx = findNearestNode(x, y, pattern.nodes, size, padding);
      if (nodeIdx !== null) {
        hapticSelection();
        const [sx, sy] = toSvg(pattern.nodes[nodeIdx][0], pattern.nodes[nodeIdx][1]);
        lastNodeRef.current = nodeIdx;
        setCurrentLine([[sx, sy]]);
      }
    },
    [pattern, size, padding, toSvg]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!currentLine?.length) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [x, y] = getSvgCoords(e, rect);
      setCurrentLine((prev) => (prev ? [...prev, [x, y]] : null));
    },
    [currentLine]
  );

  const handleEnd = useCallback(() => {
    if (currentLine && currentLine.length > 1) {
      hapticLight();
      setUserLines((prev) => [...prev, currentLine]);
    }
    setCurrentLine(null);
    lastNodeRef.current = null;
  }, [currentLine]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      {/* Pattern edges */}
      <g stroke="var(--color-stroke)" strokeWidth={STROKE} fill="none">
        {pattern.edges.map(([from, to], i) => {
          const [x1, y1] = toSvg(pattern.nodes[from][0], pattern.nodes[from][1]);
          const [x2, y2] = toSvg(pattern.nodes[to][0], pattern.nodes[to][1]);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const ax = (dx / len) * (len - 12);
          const ay = (dy / len) * (len - 12);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x1 + ax} y2={y1 + ay} />
              <polygon
                points={`${x2},${y2} ${x2 - (dx / len) * 10 + (-dy / len) * 4},${y2 - (dy / len) * 10 + (dx / len) * 4} ${x2 - (dx / len) * 10 - (-dy / len) * 4},${y2 - (dy / len) * 10 - (dx / len) * 4}`}
                fill="var(--color-stroke)"
              />
            </g>
          );
        })}
      </g>

      {/* User drawn lines */}
      <g stroke="var(--color-accent)" strokeWidth={2.5} fill="none" strokeLinecap="round">
        {userLines.map((line, i) => (
          <polyline key={i} points={line.map(([x, y]) => `${x},${y}`).join(' ')} />
        ))}
        {currentLine && currentLine.length > 1 && (
          <polyline points={currentLine.map(([x, y]) => `${x},${y}`).join(' ')} />
        )}
      </g>

      {/* Nodes */}
      {pattern.nodes.map((node, i) => {
        const [x, y] = toSvg(node[0], node[1]);
        const isStart = i === pattern.startIndex;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={NODE_R}
            fill={isStart ? 'var(--color-node-start)' : 'var(--color-node)'}
          />
        );
      })}
    </svg>
  );
});
