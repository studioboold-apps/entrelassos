/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * O mentor tem UMA conversa continua por pai, entao o id dela e' o id do proprio
 * pai. Um segundo identificador precisaria ser guardado em algum lugar, e todo
 * lugar disponivel no navegador some: aba anonima limpa, celular novo comeca do
 * zero, e o pai perderia o historico achando que o app esqueceu dele.
 *
 * `conversation_id` e' uma coluna uuid comum, sem chave estrangeira: reaproveitar
 * o valor e' legitimo, e a API filtra por `user_id` de qualquer modo.
 */
export function toConversationId(userId) {
  return userId;
}

/** A tela desenha `{role, content}`; o resto da linha e' assunto do banco. */
export function toScreenMessages(rows) {
  return rows.map(({ role, content }) => ({ role, content }));
}
