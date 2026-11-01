/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Estado civil e sexo apareciam escritos a mao no Onboarding e no Perfil
 * (`code-standart.md` §16). Duas listas concordam ate a primeira edicao: quem
 * acrescentasse uma opcao num lado deixaria o outro recusando o valor que a
 * propria tela oferece.
 *
 * O VALOR e' o que a API conhece; o rotulo mora em `*.locale.json` (§6).
 */
export const MARITAL_STATUS_OPTIONS = Object.freeze([
  { value: 'solteiro', labelKey: 'profile.maritalStatus.solteiro' },
  { value: 'casado', labelKey: 'profile.maritalStatus.casado' },
  { value: 'divorciado', labelKey: 'profile.maritalStatus.divorciado' },
  { value: 'viuvo', labelKey: 'profile.maritalStatus.viuvo' },
  { value: 'uniao_estavel', labelKey: 'profile.maritalStatus.uniao_estavel' },
]);

export const CHILD_GENDER_OPTIONS = Object.freeze([
  { value: 'masculino', labelKey: 'profile.gender.masculino' },
  { value: 'feminino', labelKey: 'profile.gender.feminino' },
  { value: 'outro', labelKey: 'profile.gender.outro' },
]);

const CHILD_GENDER_NOUN_KEY = Object.freeze({
  masculino: 'profile.childGender.masculino',
  feminino: 'profile.childGender.feminino',
  outro: 'profile.childGender.outro',
});

/** Sexo desconhecido cai em "outro" — a linha do filho nao pode sair vazia. */
export function childGenderNounKey(gender) {
  return CHILD_GENDER_NOUN_KEY[gender] ?? CHILD_GENDER_NOUN_KEY.outro;
}

/**
 * Os quatro campos livres do filho, na mesma ordem no cadastro e na edicao.
 * Duas listas divergiriam na primeira vez que alguem acrescentasse um campo.
 */
export const CHILD_FREE_FIELDS = Object.freeze([
  'favorite_hobby',
  'favorite_color',
  'favorite_food',
  'favorite_movie_genre',
]);

/** O formulario nasce vazio em tres lugares; um objeto compartilhado seria mutado por todos. */
export function createEmptyChildForm() {
  return {
    name: '',
    age: '',
    gender: '',
    favorite_hobby: '',
    favorite_color: '',
    favorite_food: '',
    favorite_movie_genre: '',
    avatar_url: null,
  };
}

/** O rotulo e o exemplo de cada campo do filho moram no escopo `profile`. */
export function childFieldLabelKey(field) {
  return `profile.childFields.${field}.label`;
}

export function childFieldPlaceholderKey(field) {
  return `profile.childFields.${field}.placeholder`;
}
