/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Lado maior da foto mandada ao mentor. E' o tamanho que o modelo enxerga sem
 * desperdicio: acima disso a API so' reduz de novo, e o pai pagaria o envio de
 * uma foto de 12 MB pelo 4G para nada.
 */
export const CHAT_IMAGE_MAX_SIDE = 1568;
export const CHAT_IMAGE_TYPE = 'image/jpeg';
const CHAT_IMAGE_QUALITY = 0.85;

/** Gravacao para sozinha: audio maior que isso e' melhor mandar em partes. */
export const VOICE_MAX_SECONDS = 120;

/**
 * Marca que a mensagem gravada leva quando foi com foto. A foto em si NAO e'
 * guardada (vai ao mentor e some); a marca e' o que lembra, no historico, que
 * ali houve uma foto.
 */
export const PHOTO_MARK = '📷';

/**
 * O que o navegador grava. Chrome e Android: WebM/Opus. Safari e iPhone: MP4.
 * A ordem e' de preferencia; o primeiro que o aparelho suporta ganha.
 */
const VOICE_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/** Reduz mantendo a proporcao; foto ja pequena fica como esta. */
export function fitWithin(width, height, maxSide = CHAT_IMAGE_MAX_SIDE) {
  const largest = Math.max(width, height);
  if (largest <= maxSide) return { width, height };
  const scale = maxSide / largest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** `data:image/jpeg;base64,AAAA` -> `AAAA`: a API quer so' o base64. */
export function stripDataUrl(dataUrl) {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

/** O texto que fica gravado na conversa quando a pergunta foi com foto. */
export function toStoredContent(text, photoOnlyLabel) {
  const trimmed = text.trim();
  return `${PHOTO_MARK} ${trimmed.length > 0 ? trimmed : photoOnlyLabel}`;
}

/** Junta o que o pai ditou ao que ele ja tinha escrito, sem colar palavras. */
export function appendTranscript(current, transcript) {
  const before = current.trim();
  const spoken = transcript.trim();
  if (before.length === 0) return spoken;
  if (spoken.length === 0) return before;
  return `${before} ${spoken}`;
}

export function pickVoiceType(isSupported) {
  return VOICE_TYPES.find((type) => isSupported(type));
}

export function isVoiceRecordingSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof navigator?.mediaDevices?.getUserMedia === 'function'
  );
}

/**
 * Le a foto, reduz e reencoda em JPEG. Reencodar tambem resolve o resto: tira
 * o EXIF (onde mora a localizacao da casa) e converte PNG/WebP para um tipo
 * so'. HEIC que o navegador nao sabe abrir falha aqui, com aviso, e nao na API.
 */
export async function prepareChatImage(file) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL(CHAT_IMAGE_TYPE, CHAT_IMAGE_QUALITY);
  return { mediaType: CHAT_IMAGE_TYPE, data: stripDataUrl(dataUrl), previewUrl: dataUrl };
}

/**
 * Comeca a gravar e devolve quem para. `stop()` resolve com o audio inteiro;
 * o microfone e' desligado nos dois caminhos — luz de microfone acesa depois
 * de o pai parar e' o tipo de coisa que faz alguem desinstalar o app.
 */
export async function startVoiceRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickVoiceType((type) => window.MediaRecorder.isTypeSupported?.(type) ?? false);
  const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  const finished = new Promise((resolve) => {
    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach((track) => track.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }));
    });
  });

  recorder.start();
  return {
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      return finished;
    },
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
