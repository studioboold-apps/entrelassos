/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const ERROR_CODES = {
  shared: {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
  user: {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
  },
  child: {
    CHILD_NOT_FOUND: 'CHILD_NOT_FOUND',
  },
  activity: {
    ACTIVITY_NOT_FOUND: 'ACTIVITY_NOT_FOUND',
    ACTIVITY_CHILD_NOT_OWNED: 'ACTIVITY_CHILD_NOT_OWNED',
  },
  community: {
    POST_NOT_FOUND: 'POST_NOT_FOUND',
    COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
    POST_NOT_OWNED: 'POST_NOT_OWNED',
  },
} as const;
