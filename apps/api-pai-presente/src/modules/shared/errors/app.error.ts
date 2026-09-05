/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type AppErrorParams = {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: readonly FieldErrorDetail[];
  /** Cabecalhos que a RECUSA exige (`Retry-After` no 429, apis.md). */
  readonly responseHeaders?: Readonly<Record<string, string>>;
};

export type FieldErrorDetail = {
  readonly field: string;
  readonly message: string;
};

/** Nunca lancar AppError direto — sempre a classe do dominio (§7). */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details: readonly FieldErrorDetail[];
  readonly responseHeaders: Readonly<Record<string, string>>;

  constructor({ code, message, statusCode, details = [], responseHeaders = {} }: AppErrorParams) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.responseHeaders = responseHeaders;
  }
}

export class DomainError extends AppError {}
