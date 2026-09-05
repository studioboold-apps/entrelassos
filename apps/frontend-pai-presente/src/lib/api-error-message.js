/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * A API recusa nomeando TODOS os campos (`apis.md` § Validacao), e `ApiError` ja
 * carrega essa lista. Ate aqui ninguem desenhava: as telas faziam `console.error`
 * e o pai via o botao voltar de "Salvando..." sem uma palavra. Este arquivo e o
 * unico lugar que traduz a recusa em frase, para as oito telas dizerem o mesmo.
 */

export const GENERIC_FAILURE_MESSAGE = 'Nao conseguimos salvar agora. Tente de novo em instantes.';

/**
 * `age` e o nome no corpo; "Idade" e o que o pai leu na tela. Campo que nao
 * estiver aqui NAO some do aviso — sai com o nome cru, porque esconde-lo devolve
 * exatamente o aviso generico que este modulo existe para consertar.
 */
export const API_FIELD_LABELS = Object.freeze({
  fullName: 'Nome',
  age: 'Idade',
  maritalStatus: 'Estado civil',
  onboardingCompleted: 'Cadastro',
  name: 'Nome',
  gender: 'Genero',
  favoriteHobby: 'Hobby favorito',
  favoriteColor: 'Cor favorita',
  favoriteFood: 'Comida favorita',
  favoriteMovieGenre: 'Genero de filme favorito',
  activityDate: 'Data',
  activityTime: 'Horario',
  title: 'Titulo',
  description: 'Descricao',
  category: 'Categoria',
  content: 'Conteudo',
});

function toFieldLabels(details) {
  const labels = details.map(({ field }) => API_FIELD_LABELS[field] ?? field);
  return [...new Set(labels)];
}

/**
 * Devolve o que a tela desenha: a frase, e a lista de campos para quem quiser
 * ancorar cada nome no campo correspondente.
 */
export function describeApiFailure(error) {
  const details = Array.isArray(error?.details) ? error.details : [];
  const fields = toFieldLabels(details.filter(({ field }) => typeof field === 'string' && field !== ''));

  if (fields.length > 0) return { message: `Confira: ${fields.join(', ')}.`, fields };
  if (typeof error?.code === 'string' && error.code !== '' && typeof error?.message === 'string' && error.message !== '') {
    return { message: error.message, fields };
  }
  return { message: GENERIC_FAILURE_MESSAGE, fields };
}
