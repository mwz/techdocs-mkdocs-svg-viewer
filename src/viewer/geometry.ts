export interface Point {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface Camera extends Point {
  scale: number;
}

export function fitCamera(content: Size, viewport: Size): Camera {
  const padding = Math.min(32, viewport.width / 10, viewport.height / 10);
  const scale = Math.max(
    0.000001,
    Math.min(
      (viewport.width - 2 * padding) / content.width,
      (viewport.height - 2 * padding) / content.height,
    ),
  );
  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2,
  };
}

/** Keep the diagram coordinate under `from` stationary at `to` while scaling. */
export function transformAt(
  camera: Camera,
  from: Point,
  to: Point,
  scale: number,
): Camera {
  const ratio = scale / camera.scale;
  return {
    scale,
    x: to.x - (from.x - camera.x) * ratio,
    y: to.y - (from.y - camera.y) * ratio,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
