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

/** Lado maior da foto de post: nitida no feed sem pesar no celular. */
export const POST_IMAGE_MAX_SIDE_PX = 1280;
/** Igual ao teto da API (`POST_IMAGE_DATA_URL_MAX_LENGTH`). */
export const POST_IMAGE_MAX_LENGTH = 700_000;
const POST_IMAGE_QUALITIES = Object.freeze([0.82, 0.7, 0.55]);

/**
 * Reduz a foto do post para caber em `POST_IMAGE_MAX_SIDE_PX`, sem cortar, em
 * JPEG. Se ainda passar do teto da API, tenta de novo com menos qualidade.
 *
 * @param {File} file
 * @returns {Promise<string>} data URL `data:image/jpeg;base64,...`
 */
export async function toPostImageDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, POST_IMAGE_MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of POST_IMAGE_QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= POST_IMAGE_MAX_LENGTH) return dataUrl;
    }
    throw new Error('foto grande demais mesmo reduzida');
  } finally {
    bitmap.close?.();
  }
}

/** Inicial para o avatar sem foto. Nome vazio nao quebra a tela. */
export function initialOf(name) {
  return (name ?? '').trim().charAt(0).toUpperCase();
}
