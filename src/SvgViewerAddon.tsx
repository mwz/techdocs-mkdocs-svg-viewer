import { useEffect } from 'react';
import { useShadowRoot } from '@backstage/plugin-techdocs-react';
import { installSvgViewer, type SvgViewerOptions } from './viewer';

export type SvgViewerProps = SvgViewerOptions;

export function SvgViewerAddon({
  selector,
  minWidth,
  minHeight,
  minZoom,
  maxZoom,
}: SvgViewerProps) {
  const root = useShadowRoot();
  useEffect(() => {
    if (!root) return undefined;
    return installSvgViewer(root, {
      selector,
      minWidth,
      minHeight,
      minZoom,
      maxZoom,
    });
  }, [root, selector, minWidth, minHeight, minZoom, maxZoom]);
  return null;
}
