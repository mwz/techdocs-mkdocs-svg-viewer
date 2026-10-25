import { createApp } from '@backstage/frontend-defaults';
import authPlugin from '@backstage/plugin-auth';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import { techDocsSvgViewerModule } from '@mwz/techdocs-mkdocs-svg-viewer/alpha';

export default createApp({
  features: [
    authPlugin,
    catalogPlugin,
    searchPlugin,
    techdocsPlugin,
    userSettingsPlugin,
    techDocsSvgViewerModule,
  ],
});
