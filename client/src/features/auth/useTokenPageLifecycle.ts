import { useEffect, useState } from "react";

const ENTRANCE_DELAY_MS = 50;
const FOCUS_DELAY_MS = 700;
const LOGIN_REDIRECT_DELAY_MS = 3500;

type TokenPageLifecycle = {
  token: string;
  done: boolean;
  focusFirstField: () => void;
  redirectToLogin: () => void;
};

export function useTokenPageLifecycle({
  token,
  done,
  focusFirstField,
  redirectToLogin,
}: TokenPageLifecycle): void {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) redirectToLogin();
    const id = setTimeout(() => setMounted(true), ENTRANCE_DELAY_MS);
    return () => clearTimeout(id);
  }, [token, redirectToLogin]);

  useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(focusFirstField, FOCUS_DELAY_MS);
    return () => clearTimeout(id);
  }, [mounted, focusFirstField]);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(redirectToLogin, LOGIN_REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [done, redirectToLogin]);
}
