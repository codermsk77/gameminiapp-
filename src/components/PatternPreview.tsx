import type { Pattern } from '../data/patterns';
import { createPatternProjector } from '../utils/patternLayout';

const NODE_R = 4;
const STROKE = 1.2;
const ARROW_GAP = 9;
const ARROW_HEAD_LENGTH = 7;
const ARROW_HEAD_WIDTH = 3;
const snapCoord = (value: number) => Math.round(value) + 0.5;

interface PatternPreviewProps {
  pattern: Pattern;
  size?: number;
  className?: string;
}

export function PatternPreview({ pattern, size = 180, className = '' }: PatternPreviewProps) {
  const padding = size * 0.08;
  const toSvg = createPatternProjector(pattern.nodes, size, padding, snapCoord);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
    >
      <g stroke="var(--color-stroke)" strokeWidth={STROKE} fill="none">
        {pattern.edges.map(([from, to], i) => {
          const [x1, y1] = toSvg(pattern.nodes[from][0], pattern.nodes[from][1]);
          const [x2, y2] = toSvg(pattern.nodes[to][0], pattern.nodes[to][1]);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          if (len === 0) return null;
          const ux = dx / len;
          const uy = dy / len;
          const nx = -uy;
          const ny = ux;
          const tipX = x2 - ux * ARROW_GAP;
          const tipY = y2 - uy * ARROW_GAP;
          const baseX = tipX - ux * ARROW_HEAD_LENGTH;
          const baseY = tipY - uy * ARROW_HEAD_LENGTH;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={baseX} y2={baseY} />
              <polygon
                points={`${tipX},${tipY} ${baseX + nx * ARROW_HEAD_WIDTH},${baseY + ny * ARROW_HEAD_WIDTH} ${baseX - nx * ARROW_HEAD_WIDTH},${baseY - ny * ARROW_HEAD_WIDTH}`}
                fill="var(--color-stroke)"
              />
            </g>
          );
        })}
      </g>
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
}
