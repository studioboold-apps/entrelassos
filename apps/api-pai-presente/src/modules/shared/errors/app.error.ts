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

  constructor({ code, message, statusCode, details = [] }: AppErrorParams) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class DomainError extends AppError {}
