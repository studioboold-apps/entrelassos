/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { loadScript } from './load-script';

/** Identificador de cliente e publico por definicao — nao e segredo. */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID ?? '';

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/pt_BR/appleid.auth.js';

const GOOGLE_BUTTON = Object.freeze({
  type: 'standard',
  theme: 'outline',
  size: 'large',
  shape: 'pill',
  text: 'continue_with',
  locale: 'pt-BR',
  width: 320,
});

const FALHA_ENTRADA = 'Nao foi possivel entrar agora. Tente de novo em instantes.';

export function useSignIn() {
  const { signIn } = useAuth();
  const googleButtonRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * A mensagem da API pode citar o motivo tecnico da recusa; a tela mostra uma
   * frase so, porque detalhe de token nao ajuda quem esta tentando entrar.
   */
  const submitToken = useCallback(
    async ({ provider, idToken }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await signIn({ provider, idToken });
      } catch {
        setError(FALHA_ENTRADA);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signIn],
  );

  /** O Google guarda a funcao no `initialize` e nunca mais a rele. */
  const submitTokenRef = useRef(submitToken);
  submitTokenRef.current = submitToken;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let isMounted = true;

    loadScript(GOOGLE_SCRIPT)
      .then(() => {
        if (!isMounted || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) =>
            submitTokenRef.current({ provider: 'google', idToken: credential }),
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, GOOGLE_BUTTON);
      })
      .catch(() => {
        if (isMounted) setError(FALHA_ENTRADA);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      await loadScript(APPLE_SCRIPT);
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      await submitToken({ provider: 'apple', idToken: response.authorization.id_token });
    } catch {
      /** Fechar a janelinha da Apple tambem cai aqui, e nao e erro de ninguem. */
      setError(FALHA_ENTRADA);
    }
  }, [submitToken]);

  return {
    googleButtonRef,
    signInWithApple,
    isGoogleEnabled: GOOGLE_CLIENT_ID !== '',
    isAppleEnabled: APPLE_CLIENT_ID !== '',
    isSubmitting,
    error,
  };
}
