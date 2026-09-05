/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * O detector mora separado do roteiro porque ele mesmo precisa de teste. Uma
 * varredura que nao acha nada tem duas explicacoes — o log esta limpo, ou o
 * detector esta cego — e do lado de fora as duas parecem iguais.
 */

/**
 * Cada isca cobre um mecanismo de redacao diferente, e e' por isso que sao
 * cinco: e-mail, CPF e telefone tem PADRAO, entao o logger os apaga mesmo
 * grudados numa frase; NOME nao tem, e so se salva por CHAVE conhecida.
 */
export const PLANTED_CANARIES = {
  PARENT_EMAIL: 'pai.canario@teste.dev',
  PARENT_NAME: 'Aurelio Canarinho',
  CHILD_NAME: 'Joaquim Girassol',
  TAX_ID: '529.982.247-25',
  PHONE: '11987654321',
} as const;

/** Rede para o que nao foi plantado: valor de terceiro que passe pelo log. */
const PII_PATTERNS = [
  { label: 'e-mail', pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { label: 'CPF', pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/ },
  { label: 'telefone de 11 digitos', pattern: /(?<!\d)\d{11}(?!\d)/ },
] as const;

export type PiiFinding = {
  readonly reason: string;
  readonly line: string;
};

export function findPiiInLog(log: string): readonly PiiFinding[] {
  const findings: PiiFinding[] = [];

  for (const line of log.split('\n').filter((candidate) => candidate.length > 0)) {
    for (const [label, value] of Object.entries(PLANTED_CANARIES)) {
      if (line.includes(value)) findings.push({ reason: `isca ${label}`, line });
    }
    for (const { label, pattern } of PII_PATTERNS) {
      const hit = line.match(pattern);
      if (hit !== null) findings.push({ reason: `${label} solto (${hit[0]})`, line });
    }
  }
  return findings;
}
