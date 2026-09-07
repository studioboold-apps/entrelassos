/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type MediaObject = {
  readonly objectKey: string;
  readonly bytes: Uint8Array;
  /**
   * Vai junto para o balde porque o link assinado entrega o objeto SEM passar
   * pela API: se o tipo nao estiver gravado ali, o navegador recebe
   * `application/octet-stream` e baixa a foto em vez de mostra-la.
   */
  readonly contentType: string;
};

export type PresignReadParams = {
  readonly objectKey: string;
  readonly ttlSeconds: number;
};

/**
 * O destino da midia e' INTERFACE (`code-standart.md` §6) pelo mesmo motivo do
 * backup: a prova roda em disco e a producao roda em balde. Sem isto, provar que
 * uma foto sobe e desce exigiria credencial de nuvem em maquina de
 * desenvolvimento — e o teste que precisa de credencial e' o teste que ninguem
 * roda.
 *
 * Nao existe `list()` de proposito. Quem sabe quais arquivos um filho tem e' o
 * Postgres, e e' por ele que a remocao em cascata caminha; varrer o balde por
 * prefixo faria a verdade morar em dois lugares (`code-standart.md`).
 *
 * A cifra NAO acontece aqui, e sim no use case — se morasse no adaptador, trocar
 * de destino perderia a cifra. E' a mesma decisao do modulo `Backup`.
 */
export type MediaStorage = {
  put(object: MediaObject): Promise<void>;
  get(objectKey: string): Promise<Uint8Array>;
  /** Apagar byte que nao existe e' sucesso: o pai pediu que sumisse, e sumiu. */
  delete(objectKey: string): Promise<void>;
  /**
   * Opcional POR AUSENCIA, nunca por bandeira `bCanPresign`. Destino que nao
   * sabe assinar link simplesmente nao declara isto, e quem entrega o arquivo
   * cai em servir os bytes pela API.
   *
   * Exame NUNCA sai por aqui, mesmo quando o destino sabe assinar: link
   * assinado deixa de ser auditavel no instante em que e' emitido, e dado de
   * saude de crianca exige trilha em TODA leitura (`security.md` §10).
   */
  presignRead?(params: PresignReadParams): Promise<string>;
};
