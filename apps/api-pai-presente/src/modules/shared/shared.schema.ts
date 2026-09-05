/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { FREE_TEXT_MAX_LENGTH, RATING_MAX, RATING_MIN, SHORT_TEXT_LENGTH } from './shared.constant';

export const uuidSchema = z.uuid();

export const ratingSchema = z.int().min(RATING_MIN).max(RATING_MAX);

export const freeTextSchema = z.string().trim().min(1).max(FREE_TEXT_MAX_LENGTH);

export const shortTextSchema = z.string().trim().min(1).max(SHORT_TEXT_LENGTH);

/** Data sem hora, do jeito que a coluna `date` guarda. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');

export const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:MM.');

export const pathIdSchema = z.object({ id: uuidSchema });
