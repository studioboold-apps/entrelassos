/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Heart } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useSignIn } from '@/lib/use-sign-in';

/** A marca da Apple nao vem da biblioteca de icones: e logotipo de terceiro. */
const AppleMark = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.42 2.2-1.26 3.02-.99.99-2.14 1.56-3.31 1.47-.13-1.13.44-2.3 1.24-3.07.9-.87 2.28-1.5 3.33-1.42zM20.7 17.2c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.01-3.05-1.76-4.04-3.32C.13 15.98-.15 10.85 1.86 8.13c1.09-1.49 2.8-2.36 4.42-2.36 1.65 0 2.68 1 4.05 1 1.32 0 2.13-1 4.03-1 1.44 0 2.96.78 4.05 2.14-3.56 1.95-2.98 7.03.29 8.29z" />
  </svg>
);

export default function SignIn() {
  const { googleButtonRef, signInWithApple, isGoogleEnabled, isAppleEnabled, isSubmitting, error } =
    useSignIn();

  /** Falha ao consultar a sessao nao e "nao entrou": o pai precisa saber que
   *  o problema foi nosso, senao ele fica tentando entrar de novo. */
  const { authError } = useAuth();
  const hasProvider = isGoogleEnabled || isAppleEnabled;

  return (
    <AuthLayout
      icon={Heart}
      title="Pai Presente"
      subtitle="Entre para acompanhar o tempo com seus filhos."
      footer="Usamos sua conta só para identificar você."
    >
      <div className="flex flex-col items-center gap-4">
        {isGoogleEnabled && <div ref={googleButtonRef} className="min-h-11" />}

        {isAppleEnabled && (
          <Button
            variant="outline"
            className="w-full gap-2 min-h-11 rounded-full"
            onClick={signInWithApple}
            disabled={isSubmitting}
          >
            <AppleMark />
            Continuar com Apple
          </Button>
        )}

        {!hasProvider && (
          <p className="text-sm text-muted-foreground text-center">
            A entrada ainda não está configurada neste ambiente.
          </p>
        )}

        {isSubmitting && <p className="text-sm text-muted-foreground">Entrando…</p>}

        {authError && (
          <p role="alert" className="text-sm text-destructive text-center">
            Não conseguimos falar com o servidor agora. Tente de novo em instantes.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive text-center">
            {error}
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
