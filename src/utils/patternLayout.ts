export type PatternNode = [number, number];

type ProjectedPoint = readonly [number, number];

const MIN_PATTERN_SIZE = 0.0001;

export function createPatternProjector(
  nodes: PatternNode[],
  size: number,
  padding: number,
  snapCoord: (value: number) => number
) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of nodes) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const width = Math.max(maxX - minX, MIN_PATTERN_SIZE);
  const height = Math.max(maxY - minY, MIN_PATTERN_SIZE);
  const innerSize = size - 2 * padding;
  const scale = innerSize / Math.max(width, height);
  const offsetX = padding + (innerSize - width * scale) / 2;
  const offsetY = padding + (innerSize - height * scale) / 2;

  return (nx: number, ny: number): ProjectedPoint => {
    const x = snapCoord(offsetX + (nx - minX) * scale);
    const y = snapCoord(offsetY + (maxY - ny) * scale);
    return [x, y];
  };
}
