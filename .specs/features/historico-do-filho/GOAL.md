# 🎯 Objetivo — O histórico de cada filho

**Um pai abre a ficha do filho e vê a vida dele em ordem: as atividades que
fizeram juntos, as fotos daquele dia, e os exames guardados — com o exame
tratado como o que ele é, dado de saúde de uma criança.**

> 🤖 Modelo: `sonnet` para execução; `D1`–`D6` são 🧠 `opus` e já estão
> decididas abaixo.

---

## 1. A medição que abriu este objetivo

Feita em 07/09/2026, no código publicado:

| pergunta | resposta medida |
|---|---|
| Alguma rota aceita `multipart/form-data`? | **nenhuma** |
| Algum uso de `req.formData()`, `Blob`, upload? | **nenhum** |
| `children` tem coluna de foto? | **não** — 8 colunas, todas texto ou número |
| Existe tabela de exame, documento ou anexo? | **não** |
| O app original da Base44 tinha upload? | **não** — nunca existiu |
| O que se liga ao filho hoje? | **uma coisa só**: `activities.childId` |

O "histórico do filho" que existe hoje é a agenda de atividades: título,
descrição, data, hora, categoria, se foi sugerida pela IA, se foi concluída,
nota de 1 a 5 e um comentário. Nada mais.

E duas coisas que o pai supõe estarem no histórico **não estão**:
`chat_messages` e `insight_ratings` pendem do usuário, não do filho. Peça um
insight sobre o filho A e o que sair dali não entra na ficha dele.

Este objetivo fecha as duas lacunas: **os arquivos**, que não existem, e **a
linha do tempo**, que hoje é uma lista de atividades sem as fotos do dia.

---

## 2. A decisão que atravessa tudo: foto e exame não são a mesma coisa

Tratar os dois como "upload" seria o defeito central deste objetivo, e ele não
apareceria em nenhum teste de funcionamento — o arquivo subiria, desceria, e a
tela ficaria bonita.

| | **foto** | **exame** |
|---|---|---|
| natureza na LGPD | dado pessoal de criança (art. 14) | dado **sensível** de saúde (art. 5º II) **+** art. 14 |
| bytes no balde | privado, cifrado pelo balde | privado, cifrado **pela aplicação** (AES-256-GCM, chave nossa) |
| como chega ao pai | link assinado de vida curta — a API fica **fora** do caminho | **pela API**, que decifra e serve — a API fica **dentro** do caminho |
| trilha de auditoria | escrita e remoção | escrita, remoção **e toda leitura** |
| consentimento | o da conta basta | **específico**, art. 14 §1, registrado com data |

O exame passa pela API justamente porque a chave é nossa: o balde sozinho não
abre o arquivo. É isso que torna cada leitura auditável — **link assinado não é
auditável depois de emitido**, e é por isso que ele serve para foto e não serve
para exame.

---

## 3. Decisões (🧠, tomadas)

**`D1` — Os bytes moram em balde S3-compatível, não em volume de contêiner.**
Volume do Railway pertence ao serviço, cresce sem teto e não se entrega por
link. O balde entra por `Bun.S3Client`, que é do runtime: **nenhuma dependência
nova** (`code-standart.md` §13), o mesmo caminho que o módulo `Backup` já usa.
Qual provedor (R2, B2, S3) é variável de ambiente, decidida no dia de ligar —
**não bloqueia uma linha de código**, porque o destino é interface com
implementação de disco para desenvolvimento e prova.

**`D2` — Arquivo NUNCA vai para a IA.** Nem os bytes, nem o nome. Mandar exame
para a Anthropic seria transferência de dado de saúde de criança para terceiro
sem base legal. O prompt continua recebendo só os campos de texto do filho, e
existe teste que afirma isso — porque a tentação de "dar contexto ao mentor" vai
aparecer, e ela não pode passar em silêncio.

**`D3` — O tipo do arquivo se decide pelos BYTES, não pela extensão.** Assinatura
no início do arquivo. Um executável renomeado para `.jpg` é recusado na fronteira.

**`D4` — O nome que o pai enviou não é guardado.** `exame-joao-silva-2026.pdf`
é PII no nome do objeto, e `security.md` §7 proíbe isso explicitamente. A chave
no balde é `children/{childId}/{fileId}` — só uuid. O pai dá uma **legenda**, e
é a legenda que aparece na tela.

**`D5` — `ON DELETE CASCADE` não apaga byte nenhum.** Apagar o filho, o arquivo
ou a conta limpa a linha do Postgres e deixa o objeto no balde — que é violação
do art. 18 e não quebra teste nenhum. Cada um dos três caminhos remove os bytes,
e cada um tem teste que afirma o balde vazio depois.

**`D6` — A foto tem data própria.** `taken_on` é o que permite a foto entrar na
linha do tempo ao lado da atividade daquele dia, em vez de na ordem em que foi
enviada. Sem isso, digitalizar um álbum antigo empilha vinte anos num sábado.

---

## 4. PRONTO quando

- [x] `P1` — o pai sobe uma foto na ficha do filho e ela aparece na linha do
      tempo, na data em que foi tirada, ao lado da atividade daquele dia
- [x] `P2` — o pai sobe um exame, é avisado uma vez do que isso significa,
      consente, e o arquivo fica guardado **cifrado** — provado lendo o objeto
      cru do balde e não achando o conteúdo original
- [x] `P3` — toda leitura de exame grava trilha de auditoria com ator, alvo, IP
      e hora
- [x] `P4` — o pai de outra conta recebe `404` na foto e no exame deste filho,
      provado por teste negativo (BOLA, `security.md` §2)
- [x] `P5` — apagar o arquivo, apagar o filho e apagar a conta remove os bytes
      do balde, cada um com seu teste
- [x] `P6` — o `.exe` renomeado para `.jpg` é recusado na fronteira
- [x] `P7` — o prompt da IA não carrega arquivo nem nome de arquivo, afirmado
      por teste
- [x] `P8` — a exportação de dados do art. 18 inclui os arquivos
- [x] `P9` — existe teto de bytes por arquivo, por filho e por conta, e o pai vê
      quanto já usou
- [x] `P10` — o relatório de custo passa a dizer o gasto de balde e de saída de
      rede, medido e não estimado

---

## 5. Invariantes (reprovam a task, independentemente do resto)

1. **Arquivo não vai para a IA** (`D2`).
2. **Nome de objeto sem PII** (`D4`, `security.md` §7).
3. **Exame cifrado em repouso com chave separada da do banco** (`security.md` §5).
4. **Autorização por objeto, não por rota** — todo acesso confere que o arquivo
   pertence ao filho, e o filho ao usuário do token (BOLA, `security.md` §2).
5. **Apagar apaga os bytes** (`D5`).
6. **Defeito vira TESTE antes de virar conserto.**
7. **Texto do jogador em `FText`… aqui: texto do pai em `*.locale.json`** —
   nenhuma string visível dentro do JSX (`web.md` §6).
