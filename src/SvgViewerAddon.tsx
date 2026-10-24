import { useEffect } from 'react';
import { useShadowRoot } from '@backstage/plugin-techdocs-react';
import { installSvgViewer, type SvgViewerOptions } from './viewer';

export type SvgViewerProps = SvgViewerOptions;

export function SvgViewerAddon({
  selector = '.md-content__inner svg, article svg',
  minWidth,
  minHeight,
  minZoom,
  maxZoom,
  resolveXlinkHref = true,
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
      resolveXlinkHref,
    });
  }, [root, selector, minWidth, minHeight, minZoom, maxZoom, resolveXlinkHref]);
  return null;
}
