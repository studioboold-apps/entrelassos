/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { AVATAR_DATA_URL_MAX_LENGTH } from './shared.constant';
import { avatarDataUrlSchema } from './shared.schema';

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const PNG_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString('base64')}`;

describe('foto de perfil (data URL)', () => {
  test('aceita PNG de verdade e null (apagar)', () => {
    expect(avatarDataUrlSchema.safeParse(PNG_DATA_URL).success).toBe(true);
    expect(avatarDataUrlSchema.safeParse(null).success).toBe(true);
  });

  test('recusa bytes que nao batem com o tipo declarado', () => {
    const lie = `data:image/jpeg;base64,${PNG_BYTES.toString('base64')}`;
    expect(avatarDataUrlSchema.safeParse(lie).success).toBe(false);
  });

  test('recusa SVG e link externo, que voltariam para um <img src>', () => {
    expect(avatarDataUrlSchema.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success).toBe(false);
    expect(avatarDataUrlSchema.safeParse('https://exemplo.com/foto.png').success).toBe(false);
  });

  test('recusa a foto original da camera, grande demais para a linha', () => {
    const huge = PNG_DATA_URL + 'A'.repeat(AVATAR_DATA_URL_MAX_LENGTH);
    expect(avatarDataUrlSchema.safeParse(huge).success).toBe(false);
  });
});
