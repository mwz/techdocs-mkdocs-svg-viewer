import { CatalogClient, type CatalogApi } from '@backstage/catalog-client';
import {
  stringifyEntityRef,
  parseEntityRef,
  type CompoundEntityRef,
  type Entity,
} from '@backstage/catalog-model';
import type { FetchApi } from '@backstage/core-plugin-api';
import type {
  TechDocsApi,
  TechDocsMetadata,
  TechDocsStorageApi,
} from '@backstage/plugin-techdocs-react';

export const entityId = {
  namespace: 'default',
  kind: 'component',
  name: 'svg-viewer-example',
};
export const readerPath = '/docs/default/component/svg-viewer-example';

export function createStaticApis(baseUrl: string): {
  catalog: CatalogApi;
  techdocs: TechDocsApi;
  techdocsStorage: TechDocsStorageApi;
  fetchApi: FetchApi;
} {
  const base = `${baseUrl.replace(/\/$/, '')}/`;
  const storage = new URL('static/docs/', base).href;
  const entityUrl = (ref: CompoundEntityRef) => {
    if (stringifyEntityRef(ref) !== stringifyEntityRef(entityId)) {
      throw new Error('This demo contains only the SVG viewer documentation.');
    }
    return new URL(
      `${ref.namespace}/${ref.kind}/${ref.name}/`.toLowerCase(),
      storage,
    ).href;
  };
  const read = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Unable to load ${url}: ${response.status}`);
    return response;
  };
  const entity = async (): Promise<Entity> =>
    (await read(new URL('entity.json', base).href)).json();

  // Only the two catalogue reads used by the reader and its entity label are
  // supported. Any accidental use of another catalogue operation fails locally.
  class StaticCatalog extends CatalogClient {
    constructor() {
      super({
        discoveryApi: {
          getBaseUrl: async () => {
            throw new Error('The static demo has no catalogue backend.');
          },
        },
      });
    }
    override async getEntityByRef(ref: string | CompoundEntityRef) {
      return stringifyEntityRef(
        typeof ref === 'string' ? parseEntityRef(ref) : ref,
      ) === stringifyEntityRef(entityId)
        ? entity()
        : undefined;
    }
    override async getEntitiesByRefs(request: { entityRefs: string[] }) {
      return {
        items: await Promise.all(
          request.entityRefs.map((ref) => this.getEntityByRef(ref)),
        ),
      };
    }
  }

  const techdocs: TechDocsApi = {
    getApiOrigin: async () => base,
    getCookie: async () => ({
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }),
    getTechDocsMetadata: async (ref) =>
      (
        await read(new URL('techdocs_metadata.json', entityUrl(ref)).href)
      ).json() as Promise<TechDocsMetadata>,
    getEntityMetadata: async (ref) => {
      entityUrl(ref);
      return entity();
    },
  };
  const techdocsStorage: TechDocsStorageApi = {
    getApiOrigin: async () => base,
    getStorageUrl: async () => storage.replace(/\/$/, ''),
    getBuilder: async () => 'external',
    syncEntityDocs: async () => 'cached',
    getEntityDocs: async (ref, path) => {
      const relative = path
        ? `${path.replace(/\/$/, '')}/index.html`
        : 'index.html';
      return (await read(new URL(relative, entityUrl(ref)).href)).text();
    },
    getBaseUrl: async (oldUrl, ref, path) =>
      new URL(
        oldUrl,
        new URL(path ? `${path.replace(/\/$/, '')}/` : '', entityUrl(ref)),
      ).href,
  };

  const cookieUrl = new URL('api/techdocs/.backstage/auth/v1/cookie', base)
    .href;
  const fetchApi: FetchApi = {
    fetch: async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        base,
      );
      if (url.href === cookieUrl) {
        // The standard reader checks this endpoint independently of TechDocsApi.
        return Response.json(await techdocs.getCookie());
      }
      if (
        url.origin === new URL(base).origin &&
        url.pathname.startsWith(new URL('api/', base).pathname)
      ) {
        throw new Error(`The static demo has no backend for ${url.pathname}.`);
      }
      return fetch(input, init);
    },
  };

  return { catalog: new StaticCatalog(), techdocs, techdocsStorage, fetchApi };
}
