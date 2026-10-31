# Anúncios (Google AdSense)

O Entrelaços é uma web app (PWA), então o caminho é o **AdSense**. AdMob só
serve para app nativo de loja, que ainda não existe.

## Como liga

Duas variáveis no serviço `web` do Railway (`.railway/railway.ts`):

| variável | exemplo | onde achar |
|---|---|---|
| `ADSENSE_CLIENT_ID` | `ca-pub-1234567890123456` | AdSense → Conta → Informações da conta (ID de editor, com `ca-` na frente) |
| `ADSENSE_SLOT_ID` | `9876543210` | AdSense → Anúncios → Por bloco de anúncios → criar bloco "Display" → `data-ad-slot` |

Vazias, nada muda: nenhum bloco, CSP fechada, `/ads.txt` em 404.

Preenchidas:

- um bloco discreto, rotulado "Publicidade", no fim da **Início** e do feed da **Comunidade**;
- a CSP abre só as origens do Google que o anúncio usa (`script-src` continua sem `'unsafe-inline'`);
- `/ads.txt` responde `google.com, pub-…, DIRECT, f08c47fec0942fa0`;
- fora de produção (`APP_ENV` ≠ `production`) o bloco vai com `data-adtest="on"`, para clique de teste não contar como clique inválido.

O id do cliente é lido no **boot** (CSP e `ads.txt`) e gravado no **build**
(o bloco na tela): mudar a variável pede um novo deploy, não só restart.

## Passo a passo da conta

1. Criar a conta em <https://adsense.google.com> com o domínio público do app.
2. Adicionar o site e preencher os ids acima no Railway → deploy.
3. Pedir a revisão no painel. O robô do Google precisa achar conteúdo e o `/ads.txt` no domínio.
4. Configurar pagamento (dados fiscais, conta bancária). O Google paga a partir de US$ 100 acumulados.

## Cuidados

- **Domínio próprio**: o AdSense costuma recusar `*.up.railway.app`. Um domínio próprio ajuda na aprovação.
- **Conteúdo atrás de login**: a revisão olha o que é público. Uma página inicial pública com conteúdo ajuda.
- **Nunca clicar no próprio anúncio** em produção: isso suspende a conta.
- **LGPD/consentimento**: a política de privacidade precisa citar cookies de publicidade do Google.
