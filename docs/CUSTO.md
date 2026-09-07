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

## 1. O que o projeto custa, pela projeção de faturamento

**Fonte: `railway usage` e o campo `estimatedUsage` da API GraphQL da Railway.**
É o que a Railway vai cobrar; é ela que decide, não o instante.

`railway usage`, em 07/09/2026, para a workspace inteira (que tem **seis**
projetos — `pai-presente`, `quickcart`, `ada-technology`, `transportada-ops`,
`transportada` e `financiamento-imobiliario-bot`):

| campo | valor |
|---|---|
| ciclo de cobrança | 19/08/2026 a 19/09/2026 |
| uso até agora | US$ 51,54 |
| projeção do ciclo | **US$ 96,24** |

O `pai-presente` é **uma fatia** disso, e a fatia se mede por projeto:

```
railway api 'query { estimatedUsage(projectId: "…", measurements: [
  MEMORY_USAGE_GB, CPU_USAGE, NETWORK_TX_GB, DISK_USAGE_GB, BACKUP_USAGE_GB
]) { measurement estimatedValue } }'
```

| recurso | uso projetado no ciclo | média | tarifa por minuto | US$ no ciclo |
|---|---|---|---|---|
| Memória | 995,83 GB·h | 1,338 GB | US$ 0,000231 / GB | **US$ 13,80** |
| CPU | 12,54 vCPU·h | 0,017 vCPU | US$ 0,000463 / vCPU | **US$ 0,35** |
| Disco | 1.622,83 GB·h | 2,181 GB | US$ 0,000003472 / GB | **US$ 0,34** |
| Saída de rede | 0,0170 GB | — | US$ 0,05 / GB | **US$ 0,00** |
| Backup | 0,0060 GB·h | — | US$ 0,000003472 / GB | **US$ 0,00** |
| Balde | não existe balde (§3) | — | — | **US$ 0,00** |
| | | | **total** | **US$ 14,49** |

**A memória é 95% da conta.** Não é o tráfego, não é o banco: é memória de pé.

### O snapshot NÃO é a fatura — e a primeira versão desta página errou nisso

A primeira versão deste relatório leu `railway metrics --all --since 7d`, que
responde o **instante**:

| serviço | CPU | memória | saída de rede (7 dias) | volume |
|---|---|---|---|---|
| `web` | < 0,01 vCPU | 24 MB | **2,7 MB** | — |
| `api` | < 0,01 vCPU | 68 MB | **0** | — |
| `postgres` | < 0,01 vCPU | 77 MB | — | 155 MB de 4,88 GB |

Somei os 169 MB e usei aquilo como média do mês. Deu US$ 1,64 de memória e a
conclusão confortável de que o uso caberia no crédito de US$ 5. **A projeção de
faturamento diz outra coisa:**

| medida | snapshot | fatura | erro |
|---|---|---|---|
| memória | 0,169 GB | 1,338 GB | **7,9x** |
| disco | 0,155 GB de volume | 2,181 GB | **14,1x** |

A diferença são os **contêineres de build** e o **disco efêmero**: a Railway
cobra por eles, e `railway metrics` não os mostra porque no instante da consulta
nenhum build está rodando. Cada deploy desta feature — e foram muitos — pagou
memória de builder que o snapshot nunca viu.

O erro não foi de conta, foi de **fonte**: instante usado como média. E ele era
confortável, o que é o que o torna perigoso — ninguém confere um número que diz
que está tudo barato. Está preso em `docs/custo.test.js`.

A CPU segue sem medida fina por serviço: `< 0,01 vCPU` é o piso da resolução do
`railway metrics`. O valor da tabela acima, esse sim, é de faturamento.

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

- **CPU por serviço.** O total do projeto é de faturamento (12,54 vCPU·h), mas
  a divisão entre `web`, `api` e `postgres` não sai: `estimatedUsage` não aceita
  serviço, e `railway metrics` responde `< 0,01 vCPU` para os três, que é o piso
  da resolução dele.
- **Quanto da memória é build e quanto é app.** A diferença de 7,9x entre
  snapshot e fatura aponta o build como causa, e a causa é coerente com o número
  de deploys — mas não há comando que separe as duas parcelas.
- **Custo com usuário de verdade.** Não há usuário de verdade: a saída de rede de
  7 dias é 2,7 MB, e uma primeira visita é 1,27 MB — foram duas visitas na
  semana, e as duas fui eu medindo.
- **Backup.** O módulo `Backup` existe no código, nenhuma variável de backup está
  no serviço `api`, e não há serviço de cron no projeto. Backup **não está
  agendado em produção**, então também não custa nada — pelo pior motivo
  possível.
