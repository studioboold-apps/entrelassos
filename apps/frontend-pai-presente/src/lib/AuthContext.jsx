/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { forgetCachedApiResponses } from '@/lib/pwa-cache';

const HTTP_UNAUTHORIZED = 401;

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Nao ha "checar se tem token": o cookie e `HttpOnly` e o JavaScript nao o ve.
   * Quem responde se a sessao vale e a API, e 401 aqui significa apenas
   * "ainda nao entrou" — nao e falha, e o estado normal de quem chega.
   */
  const reloadUser = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      setUser(await api.auth.me());
    } catch (error) {
      setUser(null);
      if (error.status !== HTTP_UNAUTHORIZED) {
        setAuthError({ code: error.code, message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  const signIn = useCallback(
    async ({ provider, idToken }) => {
      await api.auth.signIn({ provider, idToken });
      await reloadUser();
    },
    [reloadUser],
  );

  /** Sair limpa a tela mesmo se a rede falhar: prender o pai na sessao e pior. */
  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      /** O cache do service worker e' do aparelho, nao da sessao: sem apagar, o
       * proximo a entrar neste celular leria os dados do pai anterior. */
      await forgetCachedApiResponses();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoadingAuth,
        authError,
        signIn,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de um AuthProvider.');
  }
  return context;
};
