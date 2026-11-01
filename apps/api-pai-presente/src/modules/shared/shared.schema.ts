/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { detectContentType } from '../Media/detect-content-type';
import {
  AVATAR_CONTENT_TYPES,
  AVATAR_DATA_URL_MAX_LENGTH,
  FREE_TEXT_MAX_LENGTH,
  RATING_MAX,
  RATING_MIN,
  SHORT_TEXT_LENGTH,
} from './shared.constant';

export const uuidSchema = z.uuid();

export const ratingSchema = z.int().min(RATING_MIN).max(RATING_MAX);

export const freeTextSchema = z.string().trim().min(1).max(FREE_TEXT_MAX_LENGTH);

export const shortTextSchema = z.string().trim().min(1).max(SHORT_TEXT_LENGTH);

/** Data sem hora, do jeito que a coluna `date` guarda. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');

export const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:MM.');

export const pathIdSchema = z.object({ id: uuidSchema });

const AVATAR_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Foto de perfil como data URL. Quem decide o tipo sao os BYTES, nao o prefixo
 * que o cliente escreveu (`security.md` §3): SVG, HTML ou "jpeg" que e' outra
 * coisa nao entram, porque a URL volta para um `<img src>` no app.
 * `null` apaga a foto.
 */
export const avatarDataUrlSchema = z
  .string()
  .max(AVATAR_DATA_URL_MAX_LENGTH)
  .superRefine((value, context) => {
    const match = AVATAR_DATA_URL_PATTERN.exec(value);
    const declared = match?.[1];
    const data = match?.[2];
    if (declared === undefined || data === undefined) {
      context.addIssue({ code: 'custom', message: 'A foto deve ser JPEG, PNG ou WebP.' });
      return;
    }
    const detected = detectContentType(Buffer.from(data.slice(0, 64), 'base64'));
    if (detected !== declared || !(AVATAR_CONTENT_TYPES as readonly string[]).includes(detected)) {
      context.addIssue({ code: 'custom', message: 'A foto nao e do tipo declarado.' });
    }
  })
  .nullable();
