import {
  ErrorPanel,
  Progress,
  ProxiedSignInPage,
} from '@backstage/core-components';
import type { SignInPageProps } from '@backstage/core-plugin-api';
import { useEffect, useMemo, useState } from 'react';

function SignInError({
  error,
  deadline,
  retry,
  restart,
}: {
  error?: Error;
  deadline: number;
  retry: () => void;
  restart: () => void;
}) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const temporary =
    error instanceof TypeError || [502, 503, 504].includes(status ?? 0);
  const waiting = temporary && Date.now() < deadline;

  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setTimeout(retry, 500);
    return () => clearTimeout(timer);
  }, [waiting, retry]);

  if (waiting) {
    return (
      <>
        <p role="status">Waiting for Backstage to start…</p>
        <Progress />
      </>
    );
  }
  return (
    <>
      <ErrorPanel
        title="Unable to sign in to the example"
        error={error ?? new Error('Guest sign-in failed')}
      />
      <button onClick={restart}>Try again</button>
    </>
  );
}

export function GuestSignInPage(props: SignInPageProps) {
  const [attempt, setAttempt] = useState(0);
  const [deadline, setDeadline] = useState(() => Date.now() + 30_000);
  // Keep the error component stable between attempts. Remount only the sign-in
  // component so Backstage still owns credentials and subsequent token refreshes.
  const ErrorComponent = useMemo(() => {
    const retry = () => setAttempt((value) => value + 1);
    const restart = () => {
      setDeadline(Date.now() + 30_000);
      retry();
    };
    return function GuestSignInError({ error }: { error?: Error }) {
      return (
        <SignInError
          error={error}
          deadline={deadline}
          retry={retry}
          restart={restart}
        />
      );
    };
  }, [deadline]);

  return (
    <ProxiedSignInPage
      {...props}
      key={attempt}
      provider="guest"
      ErrorComponent={ErrorComponent}
    />
  );
}
