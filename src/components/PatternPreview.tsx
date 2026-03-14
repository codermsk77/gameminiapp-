import type { Pattern } from '../data/patterns';

const NODE_R = 4;
const STROKE = 1.2;

interface PatternPreviewProps {
  pattern: Pattern;
  size?: number;
  className?: string;
}

export function PatternPreview({ pattern, size = 180, className = '' }: PatternPreviewProps) {
  const padding = size * 0.15;

  const toSvg = (nx: number, ny: number) => {
    const x = padding + nx * (size - 2 * padding);
    const y = padding + (1 - ny) * (size - 2 * padding);
    return [x, y] as const;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <g stroke="var(--color-stroke)" strokeWidth={STROKE} fill="none">
        {pattern.edges.map(([from, to], i) => {
          const [x1, y1] = toSvg(pattern.nodes[from][0], pattern.nodes[from][1]);
          const [x2, y2] = toSvg(pattern.nodes[to][0], pattern.nodes[to][1]);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const ax = (dx / len) * (len - 8);
          const ay = (dy / len) * (len - 8);
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
