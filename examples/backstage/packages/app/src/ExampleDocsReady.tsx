import { Content, ErrorPanel, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { techdocsApiRef } from '@backstage/plugin-techdocs-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const exampleRef = {
  namespace: 'default',
  kind: 'component',
  name: 'svg-viewer-example',
};
const examplePath = '/docs/default/component/svg-viewer-example';

// The in-memory catalogue ingests the fixture after the backend starts accepting
// requests. Mounting the reader before that finishes leaves it on a permanent 404.
export function ExampleDocsReady({ children }: { children: ReactNode }) {
  const api = useApi(techdocsApiRef);
  const { pathname } = useLocation();
  const isExample =
    pathname === examplePath || pathname.startsWith(`${examplePath}/`);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isExample) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + 30_000;
    setReady(false);
    setError(undefined);

    const check = async () => {
      try {
        await api.getEntityMetadata(exampleRef);
        if (!cancelled) setReady(true);
      } catch (cause) {
        if (cancelled) return;
        const status = (cause as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404 && Date.now() < deadline) {
          timer = setTimeout(check, 500);
        } else {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
    };
    void check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, isExample, attempt]);

  if (!isExample || ready) return <>{children}</>;
  if (error) {
    return (
      <Content>
        <ErrorPanel
          title="The example documentation is not ready"
          error={error}
        />
        <button onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </Content>
    );
  }
  return (
    <Content>
      <p role="status">Waiting for the example documentation…</p>
      <Progress />
    </Content>
  );
}
