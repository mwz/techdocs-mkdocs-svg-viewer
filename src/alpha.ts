import { createElement } from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { TechDocsAddonLocations } from '@backstage/plugin-techdocs-react';
import { AddonBlueprint } from '@backstage/plugin-techdocs-react/alpha';
import { SvgViewerAddon, type SvgViewerProps } from './SvgViewerAddon';

/** New frontend system. Install exactly once, instead of the legacy JSX addon. */
export function createTechDocsSvgViewerModule(options: SvgViewerProps = {}) {
  return createFrontendModule({
    pluginId: 'techdocs',
    extensions: [
      AddonBlueprint.make({
        name: 'svg-viewer',
        params: {
          name: 'SvgViewer',
          location: TechDocsAddonLocations.Content,
          component: () => createElement(SvgViewerAddon, options),
        },
      }),
    ],
  });
}
export const techDocsSvgViewerModule = createTechDocsSvgViewerModule();
export default techDocsSvgViewerModule;
