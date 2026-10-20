import { createPlugin } from '@backstage/core-plugin-api';
import {
  createTechDocsAddonExtension,
  TechDocsAddonLocations,
} from '@backstage/plugin-techdocs-react';
import { SvgViewerAddon, type SvgViewerProps } from './SvgViewerAddon';

export type { SvgViewerProps } from './SvgViewerAddon';
export const techdocsSvgViewerPlugin = createPlugin({
  id: 'techdocs-addon-svg-viewer',
});
export const SvgViewer = techdocsSvgViewerPlugin.provide(
  createTechDocsAddonExtension<SvgViewerProps>({
    name: 'SvgViewer',
    location: TechDocsAddonLocations.Content,
    component: SvgViewerAddon,
  }),
);
