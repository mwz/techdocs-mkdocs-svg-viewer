import { convertLegacyRouteRef } from '@backstage/core-compat-api';
import { Content } from '@backstage/core-components';
import { configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  PageBlueprint,
  SubPageBlueprint,
  createFrontendModule,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { DefaultEntityPresentationApi } from '@backstage/plugin-catalog';
import {
  catalogApiRef,
  entityPresentationApiRef,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import {
  techdocsApiRef,
  techdocsStorageApiRef,
} from '@backstage/plugin-techdocs-react';
import { UserSettingsAppearanceCard } from '@backstage/plugin-user-settings';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import { techDocsSvgViewerModule } from '@mwz/techdocs-mkdocs-svg-viewer/alpha';
import { Navigate } from 'react-router-dom';
import { createStaticApis, readerPath } from './staticApis';

const redirect = async () => <Navigate to={readerPath} replace />;
const apiDependencies = { configApi: configApiRef };

const staticTechdocs = techdocsPlugin.withOverrides({
  extensions: [
    PageBlueprint.make({
      params: {
        path: '/docs',
        routeRef: techdocsPlugin.routes.root,
        title: 'Docs',
        icon: techdocsPlugin.icon,
        loader: redirect,
      },
    }),
    ApiBlueprint.make({
      params: (defineParams) =>
        defineParams({
          api: techdocsApiRef,
          deps: apiDependencies,
          factory: ({ configApi }) =>
            createStaticApis(configApi.getString('app.baseUrl')).techdocs,
        }),
    }),
    ApiBlueprint.make({
      name: 'storage',
      params: (defineParams) =>
        defineParams({
          api: techdocsStorageApiRef,
          deps: apiDependencies,
          factory: ({ configApi }) =>
            createStaticApis(configApi.getString('app.baseUrl'))
              .techdocsStorage,
        }),
    }),
  ],
});

// Supply only the catalogue pieces used by the reader; no catalogue editor or
// backend is included in this app.
const staticCatalog = createFrontendPlugin({
  pluginId: 'catalog',
  extensions: [
    PageBlueprint.make({
      name: 'entity',
      params: {
        path: '/catalog/:namespace/:kind/:name',
        routeRef: convertLegacyRouteRef(entityRouteRef),
        loader: redirect,
      },
    }),
    ApiBlueprint.make({
      params: (defineParams) =>
        defineParams({
          api: catalogApiRef,
          deps: apiDependencies,
          factory: ({ configApi }) =>
            createStaticApis(configApi.getString('app.baseUrl')).catalog,
        }),
    }),
    ApiBlueprint.make({
      name: 'entity-presentation',
      params: (defineParams) =>
        defineParams({
          api: entityPresentationApiRef,
          deps: { catalogApi: catalogApiRef },
          factory: ({ catalogApi }) =>
            DefaultEntityPresentationApi.create({ catalogApi }),
        }),
    }),
  ],
});

const demoApp = createFrontendModule({
  pluginId: 'app',
  extensions: [
    PageBlueprint.make({
      name: 'home',
      params: { path: '/', loader: redirect },
    }),
    ApiBlueprint.make({
      name: 'fetch',
      params: (defineParams) =>
        defineParams({
          api: fetchApiRef,
          deps: apiDependencies,
          factory: ({ configApi }) =>
            createStaticApis(configApi.getString('app.baseUrl')).fetchApi,
        }),
    }),
  ],
});

const settings = userSettingsPlugin.withOverrides({
  extensions: [
    SubPageBlueprint.make({
      name: 'general',
      params: {
        path: 'general',
        title: 'Appearance',
        loader: async () => (
          <Content>
            <UserSettingsAppearanceCard />
          </Content>
        ),
      },
    }),
  ],
});

export default createApp({
  features: [
    demoApp,
    staticCatalog,
    staticTechdocs,
    settings,
    techDocsSvgViewerModule,
  ],
});
