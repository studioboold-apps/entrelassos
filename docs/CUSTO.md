# Custo do ambiente — medido em 07/09/2026

Este arquivo existe porque o relatório de custo era **estimativa**. Estimativa
de custo envelhece calada: ninguém percebe que ela ficou errada, porque ela
nunca esteve certa o bastante para divergir de nada.

Tudo abaixo saiu de comando, e o comando está ao lado do número. Onde a
medição **não** foi possível, está escrito que não foi — e não um número
plausível no lugar dela.

Preços da própria Railway, lidos de `docs.railway.com/reference/pricing/plans`
em 07/09/2026:

| recurso | preço |
|---|---|
| Memória | US$ 10 / GB / mês |
| CPU | US$ 20 / vCPU / mês |
| Saída de rede (egress) | US$ 0,05 / GB |
| Volume | US$ 0,15 / GB / mês |
| Assinatura Hobby | US$ 5 / mês, com US$ 5 de crédito de uso |

**O "GB" da Railway é GiB.** A própria tabela dá o preço por KB
(US$ 0,000000047683716), e `0,05 ÷ 0,000000047683716 = 1.048.576 KB`, que é
2³⁰ bytes. Toda conta desta página usa 2³⁰ — usar 10⁹ inflaria o custo em 7%.

---

## 1. O que os três serviços consomem hoje

`railway metrics --all --since 7d`, em 07/09/2026:

| serviço | CPU | memória | saída de rede (7 dias) | volume |
|---|---|---|---|---|
| `web` | < 0,01 vCPU | 23 MB | **2,7 MB** | — |
| `api` | < 0,01 vCPU | 68 MB | **0** | — |
| `postgres` | < 0,01 vCPU | 77 MB | — | 155 MB de 4,88 GB |

O que isso custa, ao preço da tabela:

| linha | conta | por mês |
|---|---|---|
| Memória | 168 MiB = 0,164 GiB × US$ 10 | **US$ 1,64** |
| CPU | teto de 0,03 vCPU × US$ 20 | **≤ US$ 0,60** |
| Saída de rede | 2,7 MB em 7 dias ≈ 11,6 MB × US$ 0,05/GiB | **US$ 0,00** |
| Volume do Postgres | 0,151 GiB × US$ 0,15 | **US$ 0,02** |
| Balde | não existe balde (§3) | **US$ 0,00** |
| | **uso somado** | **≤ US$ 2,26** |

O uso somado fica abaixo do crédito de US$ 5 do plano Hobby, então **a fatura
de hoje é a assinatura: US$ 5/mês.** O uso não aparece nela.

A conta de CPU é **teto**, não medida: a Railway responde `< 0,01 vCPU` por
serviço, que é o piso da resolução dela. O número real é menor que US$ 0,60, e
não há comando que diga quanto menor.

Valor em reais não está aqui de propósito: a Railway cobra em dólar, e a taxa do
dia não é coisa que este repositório meça.

---

## 2. A saída de rede de uma primeira visita

`curl -o /dev/null -w '%{size_download}'` em cada recurso que o `index.html`
publicado referencia, contra `https://web-production-1d6f.up.railway.app`:

| recurso | bytes servidos |
|---|---|
| `/` | 1.039 |
| `assets/index-BQaqrWPk.css` | 74.174 |
| `assets/index-DTEqLmyi.js` | **1.138.972** |
| `manifest.webmanifest` | 505 |
| `registerSW.js` | 134 |
| `icons/icon-192.png` | 27.555 |
| `icons/apple-touch-icon-180.png` | 24.721 |
| **total** | **1.267.100** |

1,21 MiB por primeira visita, US$ 0,000059 cada — **US$ 0,06 por mil primeiras
visitas.** A segunda visita custa quase zero: os `assets` saem com
`cache-control: public, max-age=31536000, immutable`, e o service worker do PWA
já os tem.

### O bundle vai sem compressão, e isso é 71% da conta

O pedido foi feito com `Accept-Encoding: br, gzip`, e a resposta **não trouxe
`content-encoding`**. Então 1.138.972 é byte de JavaScript cru na rede.

`gzip -9` sobre os mesmos dois arquivos baixados:

| arquivo | como é servido | com gzip -9 |
|---|---|---|
| `index-DTEqLmyi.js` | 1.138.972 | 335.835 |
| `index-BQaqrWPk.css` | 74.174 | 12.524 |
| **soma** | **1.213.146** | **348.359** |

**864.787 bytes jogados fora por primeira visita, 71%.** Em custo é pouco hoje
(US$ 0,04 por mil visitas), porque hoje quase ninguém visita; em tempo de
carregamento no celular do pai é 1,1 MB contra 340 KB, e isso não depende de
haver muitos usuários.

O servidor estático é nosso (`apps/frontend-pai-presente/server/`), e `grep` por
`gzip`, `compress` e `Content-Encoding` não acha nada nele. Está anotado em
`DEBITO.md`: é uma correção de uma dependência, não desta task.

---

## 3. O balde: o custo é zero porque o balde não existe

Três medições, nesta ordem:

1. `railway variables --service api` (só os nomes) tem 16 variáveis, e
   **nenhuma** é `MEDIA_DESTINATION`, `MEDIA_S3_BUCKET` ou
   `MEDIA_ENCRYPTION_KEY`.
2. `railway bucket list` responde `No buckets found in environment production`.
3. `railway volume list` mostra **um** volume, `postgres-volume`, montado em
   `postgres`. O serviço `api` **não tem volume**.

O que isso significa, lido em `config/environment.ts`:

- `MEDIA_DESTINATION` cai no padrão `filesystem`, e `MEDIA_DIRECTORY` no padrão
  `.media` — dentro do contêiner.
- O sistema de arquivos do contêiner da Railway é efêmero e o `api` não tem
  volume. **Foto guardada em produção não sobrevive ao próximo deploy.** O custo
  de balde ser US$ 0,00 é exatamente por isso: não há álbum durável para cobrar.
- `MEDIA_ENCRYPTION_KEY` cai no padrão `''`, e guardar exame sem ela responde
  **503 `MEDIA_KEY_INVALID`**. Hoje **nenhum exame pode ser guardado em
  produção.**

A saída de rede do `api` medida em 7 dias — **0** — é a mesma evidência vista
de outro lado: byte de arquivo de filho não passou por lá nenhuma vez.

### O que vai custar quando o álbum for durável

Os tetos estão em `modules/shared/shared.constant.ts` e valem hoje:

| teto | valor |
|---|---|
| por arquivo | 15 MB |
| por filho | 500 MB |
| por conta | 2 GB |

| cenário | conta | custo |
|---|---|---|
| Volume para uma conta cheia | 2 GiB × US$ 0,15 | US$ 0,30 / mês |
| Volume para dez contas cheias | 20 GiB × US$ 0,15 | US$ 3,00 / mês |
| Ver uma foto de 15 MB (teto) | 0,0146 GiB × US$ 0,05 | US$ 0,00073 |
| Mil vistas dessa mesma foto | | US$ 0,73 |
| Baixar uma conta cheia uma vez | 2 GiB × US$ 0,05 | US$ 0,10 |

**Quem paga a saída depende do caminho de entrega**, e os dois já existem em
`child-file.constant.ts`:

- `LINK` (302 para o balde): o balde entrega, e a saída de rede é dele, não da
  Railway. É o caminho da **foto**.
- `BYTES` (a API decifra e entrega): a saída de rede é da Railway, e é a linha de
  cima da tabela. É o caminho **obrigatório do exame**, porque link assinado
  deixa de ser auditável no instante em que é emitido (`security.md` §10).

Ou seja: com balde configurado, mil vistas de foto **não** são US$ 0,73 de
Railway — são US$ 0,73 de quem hospeda o balde. Sem balde, tudo passa pelo `api`,
e a fatura da saída de rede é inteira nossa.

---

## 4. O que não foi medido

- **CPU real dos três serviços.** A Railway responde `< 0,01 vCPU`, que é o piso
  da resolução dela. O que está na tabela é teto.
- **Custo com usuário de verdade.** Não há usuário de verdade: a saída de rede de
  7 dias é 2,7 MB, e uma primeira visita é 1,27 MB — foram duas visitas na
  semana, e as duas fui eu medindo.
- **Backup.** O módulo `Backup` existe no código, nenhuma variável de backup está
  no serviço `api`, e não há serviço de cron no projeto. Backup **não está
  agendado em produção**, então também não custa nada — pelo pior motivo
  possível.
