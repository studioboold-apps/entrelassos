# Tasks — O histórico de cada filho

Execute em ordem. **Um commit por task**, com o motivo no corpo — não só o quê.

Gates de toda task (`model-economy.md` §3):

```bash
bun test                                                        # 501 passando hoje; nunca menos
cd apps/frontend-pai-presente && ./node_modules/.bin/tsc -p ./jsconfig.json  # 215 hoje; nunca mais
```

215 é linha de base, não meta: é ruído de `checkJs` sobre `forwardRef` do shadcn.

---

## Fase 1 — A fronteira, antes de qualquer rota
> 🤖 Modelo: `sonnet` (`H1.2` é 🧠 — cifra é `security.md` §5)

### `H1.1` — O destino da mídia é interface, com disco e balde

**Depende de** nada.

**Problema medido** Não existe caminho de upload no projeto: zero rotas
`multipart`, zero `req.formData()`, zero `Blob`. Os únicos dois usos de
`arrayBuffer()` na API são do módulo `Backup`. Começar pela rota faria os bytes
nascerem em disco de contêiner efêmero — que no Railway é o disco que o próximo
deploy joga fora.

**Fazer**
- `modules/Media/media-storage.interface.ts` — `MediaStorage` com
  `put`, `get`, `delete`, `presignRead(objectKey, ttlSeconds)`.
- `modules/Media/filesystem-media-storage.ts` — para desenvolvimento e prova.
  `presignRead` devolve caminho de rota própria, não `file://`.
- `modules/Media/s3-media-storage.ts` — `Bun.S3Client`, balde **privado**,
  `presign` com vida curta.
- `modules/Media/media-storage.factory.ts` — escolhe por env e **falha em voz
  alta** quando o destino escolhido não tem para onde escrever, igual a
  `createBackupStorage`.
- Fatia de env `mediaEnvironmentSchema`: `MEDIA_DESTINATION`,
  `MEDIA_DIRECTORY`, `MEDIA_S3_BUCKET`, `MEDIA_S3_ENDPOINT`,
  `MEDIA_PRESIGN_TTL_SECONDS`.

**Verificar** `bun test`, com o ciclo `put → get → delete` afirmado nas **duas**
implementações e a fábrica reprovando balde vazio com `MEDIA_DESTINATION=s3`.

**Aceite** Trocar de disco para balde é variável de ambiente, não edição de
código. Nenhuma dependência nova no `package.json`.

---

### `H1.2` — 🧠 O exame se guarda cifrado, com chave que não é a do banco

**Depende de** `H1.1`.

**Problema medido** `security.md` §5 exige campo sensível em repouso cifrado com
**chave de aplicação separada da chave do banco**. Exame de criança é dado de
saúde (LGPD art. 5º II) de menor (art. 14) — o caso mais protegido que este app
toca.

**Fazer**
- `modules/Media/media-cipher.ts` — AES-256-GCM por `node:crypto` (do runtime,
  sem dependência nova). `MEDIA_ENCRYPTION_KEY` em base64, 32 bytes, validada no
  boot. IV aleatório por objeto, guardado no próprio envelope junto da tag.
- A fábrica **recusa subir** com `MEDIA_ENCRYPTION_KEY` ausente ou de tamanho
  errado. Chave curta que "funciona" é a pior falha possível aqui.

**Verificar**
- ciclo `cifrar → decifrar` devolve os mesmos bytes;
- os bytes cifrados **não contêm** a sequência original — é este teste que prova
  que o arquivo no balde não é o arquivo do pai;
- tag adulterada faz `decifrar` **lançar**, não devolver lixo;
- chave de 31 bytes reprova no boot.

**Aceite** Quem tem acesso ao balde e não tem a chave não abre o exame.

---

### `H1.3` — O tipo do arquivo se decide pelos BYTES

**Depende de** nada.

**Problema medido** Extensão é texto que o cliente escolhe. `web.md` e
`security.md` §3 pedem validação na fronteira, e extensão não é validação.

**Fazer** `modules/Media/detect-content-type.ts` — assinatura no início do
arquivo para JPEG, PNG, WebP, HEIC e PDF. Tipo desconhecido devolve `undefined`,
e a fronteira recusa.

**Verificar** `.exe` renomeado para `.jpg` é recusado; JPEG sem extensão nenhuma
é aceito; `image/svg+xml` é recusado **de propósito** (SVG carrega script).

**Aceite** A recusa acontece antes de qualquer byte chegar ao balde.

---

## Fase 2 — O dado
> 🤖 Modelo: `sonnet`

### `H2.1` — A tabela dos arquivos do filho

**Depende de** `H1.1`.

**Problema medido** Uma coisa só se liga ao filho hoje: `activities.childId`.
Foto e exame não têm onde existir.

**Fazer** `modules/ChildFile/child-file.table.ts` + migration versionada:
`userId` e `childId` com `onDelete: 'cascade'`, `kind` (`foto`|`exame`),
`objectKey` **único e sem PII** (`children/{childId}/{fileId}`), `contentType`,
`byteSize`, `checksum` (sha-256), `isEncrypted`, `caption`, `takenOn`.
**O nome do arquivo enviado não é guardado** (`D4` do GOAL).

**Verificar** migration aplica e reverte; nenhuma coluna guarda nome de arquivo.

**Aceite** `drizzle-kit` gera SQL revisável, não `push` (`database.md`).

---

### `H2.2` — O arquivo do filho de outro pai é `404`

**Depende de** `H2.1`.

**Problema medido** BOLA é o campeão de API REST (`security.md` §2 / OWASP
API1): autorização por rota passa, e o `uuid` do vizinho abre o exame.

**Fazer** `child-file.repository.ts` — toda consulta filtra `userId` **por
construção**, nunca com `if` depois de buscar.

**Verificar** teste negativo: usuário B pede o arquivo do filho de A e recebe
`404`, **não** `403` — `403` confirma que o `uuid` existe.

**Aceite** Não há caminho de leitura que aceite `fileId` sem `userId`.

---

## Fase 3 — As rotas
> 🤖 Modelo: `sonnet` (`H3.3` é 🧠 — é onde a auditoria de dado sensível mora)

- `H3.1` — `POST /v1/children/:childId/files` (multipart; tipo por bytes; teto
  de tamanho; checksum; cifra quando `kind=exame`; trilha de auditoria).
- `H3.2` — `GET /v1/children/:childId/files` (lista sem bytes: metadados e
  `takenOn`).
- `H3.3` — 🧠 `GET /v1/children/:childId/files/:fileId/content` — **foto** sai
  por link assinado de vida curta, a API fora do caminho; **exame** a API
  decifra e serve, **gravando trilha de auditoria em toda leitura**.
- `H3.4` — `DELETE …/:fileId` — apaga **os bytes** e depois a linha (`D5`).
- `H3.5` — Consentimento art. 14 §1: registro próprio, com data, exigido antes
  do primeiro exame; sem ele o `POST` de exame responde `403` com código estável.

---

## Fase 4 — LGPD de verdade
> 🤖 Modelo: `sonnet`

- `H4.1` — Apagar o filho remove os objetos do balde (o `CASCADE` não remove).
- `H4.2` — `DELETE /v1/me` remove os objetos do balde.
- `H4.3` — A exportação do art. 18 inclui os arquivos.
- `H4.4` — **Teste de invariante:** nenhum prompt de IA carrega conteúdo nem
  nome de arquivo (`D2`). É o teste que impede a "melhoria" de dar o exame ao
  mentor.

---

## Fase 5 — A tela
> 🤖 Modelo: `sonnet`

- `H5.1` — Subir foto e exame na ficha do filho: a página desenha, o hook decide
  (`web.md` §4), falha por `describeApiFailure` + `role="alert"`.
- `H5.2` — **A linha do tempo**: atividades, fotos e exames na mesma ordem de
  data, pela `takenOn`.
- `H5.3` — O aviso de consentimento antes do primeiro exame, em
  `*.locale.json` como todo texto.

---

## Fase 6 — O custo, medido
> 🤖 Modelo: `haiku`

- `H6.1` — Teto por arquivo, por filho e por conta, e o quanto já foi usado na
  tela.
- `H6.2` — O relatório de custo passa a dizer balde e saída de rede medidos.
