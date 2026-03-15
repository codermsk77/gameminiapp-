import type { Pattern } from '../data/patterns';
import { createPatternProjector } from '../utils/patternLayout';

const NODE_R = 4;
const STROKE = 1.2;
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
          const bodyLen = Math.max(len - 8, 0);
          const ax = (dx / len) * bodyLen;
          const ay = (dy / len) * bodyLen;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x1 + ax} y2={y1 + ay} />
              <polygon
                points={`${x2},${y2} ${x2 - (dx / len) * 7 + (-dy / len) * 3},${y2 - (dy / len) * 7 + (dx / len) * 3} ${x2 - (dx / len) * 7 - (-dy / len) * 3},${y2 - (dy / len) * 7 - (dx / len) * 3}`}
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
