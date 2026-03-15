import { useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import type { Pattern } from '../data/patterns';
import { hapticLight, hapticSelection } from '../utils/haptic';
import { createPatternProjector } from '../utils/patternLayout';

const NODE_R = 6;
const HIT_R = 20;
const STROKE = 1.5;
const snapCoord = (value: number) => Math.round(value) + 0.5;

type UserSegment = [number, number];
type ActiveSegment = {
  startIndex: number;
  endIndex: number | null;
  pointer: [number, number];
};

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
  toSvg: (nx: number, ny: number) => readonly [number, number]
): number | null {
  let minD = HIT_R;
  let idx: number | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const [nx, ny] = toSvg(nodes[i][0], nodes[i][1]);
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
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [activeSegment, setActiveSegment] = useState<ActiveSegment | null>(null);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (userSegments.length === 0) return false;
      setUserSegments((prev) => prev.slice(0, -1));
      hapticLight();
      return true;
    },
    hasDrawn: () => userSegments.length > 0,
  }), [userSegments.length]);

  const padding = size * 0.08;

  const toSvg = useMemo(
    () => createPatternProjector(pattern.nodes, size, padding, snapCoord),
    [pattern.nodes, size, padding]
  );

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [x, y] = getSvgCoords(e, rect);
      const nodeIdx = findNearestNode(x, y, pattern.nodes, toSvg);
      if (nodeIdx !== null) {
        hapticSelection();
        setActiveSegment({
          startIndex: nodeIdx,
          endIndex: null,
          pointer: [x, y],
        });
      }
    },
    [pattern, toSvg]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!activeSegment) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [x, y] = getSvgCoords(e, rect);
      const nodeIdx = findNearestNode(x, y, pattern.nodes, toSvg);
      setActiveSegment((prev) => (
        prev
          ? {
              ...prev,
              pointer: [x, y],
              endIndex: nodeIdx !== null && nodeIdx !== prev.startIndex ? nodeIdx : null,
            }
          : null
      ));
    },
    [activeSegment, pattern.nodes, toSvg]
  );

  const handleEnd = useCallback(() => {
    if (activeSegment && activeSegment.endIndex !== null) {
      const { startIndex, endIndex } = activeSegment;
      hapticLight();
      setUserSegments((prev) => [...prev, [startIndex, endIndex]]);
    }
    setActiveSegment(null);
  }, [activeSegment]);

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
      style={{ touchAction: 'none', userSelect: 'none', maxWidth: '100%', height: 'auto', display: 'block' }}
    >
      {/* Pattern edges */}
      <g stroke="var(--color-stroke)" strokeWidth={STROKE} fill="none">
        {pattern.edges.map(([from, to], i) => {
          const [x1, y1] = toSvg(pattern.nodes[from][0], pattern.nodes[from][1]);
          const [x2, y2] = toSvg(pattern.nodes[to][0], pattern.nodes[to][1]);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const bodyLen = Math.max(len - 12, 0);
          const ax = (dx / len) * bodyLen;
          const ay = (dy / len) * bodyLen;
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
        {userSegments.map(([from, to], i) => {
          const [x1, y1] = toSvg(pattern.nodes[from][0], pattern.nodes[from][1]);
          const [x2, y2] = toSvg(pattern.nodes[to][0], pattern.nodes[to][1]);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {activeSegment && (() => {
          const [x1, y1] = toSvg(
            pattern.nodes[activeSegment.startIndex][0],
            pattern.nodes[activeSegment.startIndex][1]
          );
          const [x2, y2] = activeSegment.endIndex !== null
            ? toSvg(pattern.nodes[activeSegment.endIndex][0], pattern.nodes[activeSegment.endIndex][1])
            : activeSegment.pointer;
          return <line x1={x1} y1={y1} x2={x2} y2={y2} opacity={0.9} />;
        })()}
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
