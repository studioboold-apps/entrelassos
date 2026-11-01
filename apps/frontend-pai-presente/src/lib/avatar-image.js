/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** Lado do quadrado salvo: nitido no maior avatar do app (96px em tela 2x/3x). */
export const AVATAR_SIZE_PX = 256;
const AVATAR_JPEG_QUALITY = 0.85;

/**
 * Corta a foto no centro (quadrado) e reduz para `AVATAR_SIZE_PX`, em JPEG.
 * A foto da camera tem megabytes; o avatar viaja junto da lista de filhos em
 * toda tela, entao chega a API ja' pequeno (~20-40 KB).
 *
 * @param {File} file
 * @returns {Promise<string>} data URL `data:image/jpeg;base64,...`
 */
export async function toAvatarDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - side) / 2;
    const sourceY = (bitmap.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE_PX;
    canvas.height = AVATAR_SIZE_PX;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
    return canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY);
  } finally {
    bitmap.close?.();
  }
}

/** Inicial para o avatar sem foto. Nome vazio nao quebra a tela. */
export function initialOf(name) {
  return (name ?? '').trim().charAt(0).toUpperCase();
}
