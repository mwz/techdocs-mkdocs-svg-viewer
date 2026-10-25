import { createApp } from '@backstage/frontend-defaults';
import {
  coreExtensionData,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import authPlugin from '@backstage/plugin-auth';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import { techDocsSvgViewerModule } from '@mwz/techdocs-mkdocs-svg-viewer/alpha';
import { ExampleDocsReady } from './ExampleDocsReady';

const localTechdocs = techdocsPlugin.withOverrides({
  extensions: [
    techdocsPlugin.getExtension('page:techdocs/reader').override({
      *factory(originalFactory) {
        const output = originalFactory();
        for (const item of output) {
          if (item.id !== coreExtensionData.reactElement.id) yield item;
        }
        yield coreExtensionData.reactElement(
          <ExampleDocsReady>
            {output.get(coreExtensionData.reactElement)}
          </ExampleDocsReady>,
        );
      },
    }),
  ],
});

const automaticGuestSignIn = createFrontendModule({
  pluginId: 'app',
  extensions: [
    SignInPageBlueprint.make({
      params: {
        loader: async () => {
          const { GuestSignInPage } = await import('./GuestSignInPage');
          return GuestSignInPage;
        },
      },
    }),
  ],
});

export default createApp({
  features: [
    automaticGuestSignIn,
    authPlugin,
    catalogPlugin,
    searchPlugin,
    localTechdocs,
    userSettingsPlugin,
    techDocsSvgViewerModule,
  ],
});
