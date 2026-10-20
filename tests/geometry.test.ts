import { describe, expect, it } from 'vitest';
import { clamp, fitCamera, transformAt } from '../src/viewer/geometry';
describe('camera geometry', () => {
  it('fits both wide and tall diagrams without clipping', () => {
    for (const content of [
      { width: 1600, height: 200 },
      { width: 200, height: 1600 },
    ]) {
      const camera = fitCamera(content, { width: 600, height: 400 });
      expect(camera.x).toBeGreaterThanOrEqual(0);
      expect(camera.y).toBeGreaterThanOrEqual(0);
      expect(camera.x + content.width * camera.scale).toBeLessThanOrEqual(600);
      expect(camera.y + content.height * camera.scale).toBeLessThanOrEqual(400);
    }
  });
  it('keeps the cursor focal point fixed through zoom', () => {
    const camera = { x: 120, y: -80, scale: 2 };
    const point = { x: 245, y: 60 };
    const result = transformAt(camera, point, point, 7);
    expect((point.x - result.x) / result.scale).toBeCloseTo(
      (point.x - camera.x) / camera.scale,
    );
    expect((point.y - result.y) / result.scale).toBeCloseTo(
      (point.y - camera.y) / camera.scale,
    );
  });
  it('combines pinch translation and scaling', () => {
    expect(
      transformAt(
        { x: 0, y: 0, scale: 1 },
        { x: 100, y: 100 },
        { x: 150, y: 180 },
        2,
      ),
    ).toEqual({ x: -50, y: -20, scale: 2 });
  });
  it('clamps extreme zoom requests', () => {
    expect(clamp(100, 0.25, 16)).toBe(16);
    expect(clamp(-100, 0.25, 16)).toBe(0.25);
  });
});
