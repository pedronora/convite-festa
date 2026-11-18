# Convite Festa — Luigi & Marco Antonio

Aplicação web completa para gerenciar convidados, enviar convites pelo WhatsApp e acompanhar as confirmações de presença do aniversário do **Luigi (3 anos)** e do **Marco Antonio (1 ano)**.

O projeto tem duas áreas:

- **Página pública** (`/` e `/convite/[uuid]`): convite temático do Homem-Aranha, detalhes da festa, contagem regressiva, confirmação de presença e ações de calendário/mapa.
- **Painel administrativo** (`/admin`): dashboard, cadastro de convidados, link individual por UUID, registro de envios, confirmações, exportação CSV e configurações da festa.

## Stack

- [Nuxt 4](https://nuxt.com/) + Vue 3 (Composition API) + TypeScript estrito
- Tailwind CSS v4
- PostgreSQL 17 + [Drizzle ORM](https://orm.drizzle.team/)
- Zod para validação compartilhada entre cliente e servidor
- Sessões próprias no banco, senha com `scrypt` e cookie `httpOnly`
- Vitest para testes das regras compartilhadas
- Docker e Docker Compose para desenvolvimento e produção

## Requisitos

- Node.js **22.22+** (recomendado 22 LTS)
- npm
- Docker + Docker Compose (para o banco local ou para produção)

## Desenvolvimento

```bash
# 1. Instale as dependências
npm install

# 2. Suba o PostgreSQL de desenvolvimento (porta 5433)
docker compose -f docker-compose.dev.yml up -d

# 3. Crie o .env a partir do exemplo
cp .env.example .env
# Edite ADMIN_PASSWORD (mínimo de 10 caracteres) antes de rodar o seed.

# 4. Aplique as migrations e popule os dados de demonstração
npm run db:migrate
npm run db:seed

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse:

- Página pública: <http://localhost:3000>
- Painel: <http://localhost:3000/admin>
- Convite de teste do seed: <http://localhost:3000/convite/11111111-1111-4111-8111-111111111111>

### Administrador do seed

O seed usa as variáveis `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env` (a senha precisa ter ao menos 10 caracteres). Defina os valores antes de rodar `npm run db:seed`, por exemplo:

```text
E-mail: admin@festa.local
Senha:  a que você definiu em ADMIN_PASSWORD
```

> Essas credenciais são **apenas para desenvolvimento**. Troque a senha em `/admin/configuracoes` ou defina outras variáveis antes do seed.

Para criar ou redefinir um administrador sem rodar o seed:

```bash
npm run admin:create -- --name "Ana" --email ana@exemplo.com --password "uma-senha-longa"
```

O comando também aceita `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` vindos do ambiente. Se o e-mail já existir, a senha é atualizada.

### Seed de demonstração

`npm run db:seed` cria:

- o administrador definido no `.env`;
- as configurações padrão da festa;
- 8 convidados de exemplo, com envios, confirmações e recusas.

Defina `SEED_SAMPLE=false` para criar apenas o administrador e as configurações. O seed não é executado automaticamente em produção.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | — | String de conexão do PostgreSQL. Obrigatória. |
| `NUXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL pública usada nos links de convite. Sem barra no final. |
| `DATA_DIR` | `./.data` | Pasta persistente das imagens enviadas. Em produção: `/app/data`. |
| `ADMIN_NAME` | `Administrador` | Nome usado pelos scripts de seed/create-admin. |
| `ADMIN_EMAIL` | `admin@festa.local` | E-mail usado pelos scripts. |
| `ADMIN_PASSWORD` | — | Senha inicial (mínimo de 10 caracteres). |
| `SEED_SAMPLE` | `true` | Cria os convidados de exemplo no seed. Use `false` em produção. |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Porta e interface do servidor Nitro. |

`NUXT_DATABASE_URL` e `NUXT_DATA_DIR` também são aceitos e têm prioridade em runtime; são úteis quando a imagem é construída sem `.env`.

## Banco de dados

```bash
npm run db:generate   # gera uma migration a partir do schema Drizzle
npm run db:migrate    # aplica as migrations pendentes
npm run db:seed       # popula administrador, configurações e dados de exemplo
npm run db:studio     # abre o Drizzle Studio
```

O schema fica em `server/database/schema.ts` e as migrations em `drizzle/`.

O PostgreSQL de desenvolvimento usa a porta **5433** para não conflitar com instâncias locais na 5432:

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down       # mantém os dados
docker compose -f docker-compose.dev.yml down -v    # apaga os dados
```

## Como funciona o convite

1. O administrador cadastra o convidado em `/admin/convidados`.
2. Cada convidado recebe uma **invitation** com UUID próprio, usado no link `/convite/[uuid]`.
3. O administrador abre o modal de envio, revisa a mensagem, baixa/anexa a arte do convite e abre o WhatsApp.
4. Depois de enviar de fato, o administrador marca a confirmação. Só então o envio é registrado no histórico, com telefone, mensagem, método, status e número da tentativa.
5. O convidado abre o link, vê os dados da festa e confirma ou recusa a presença.
6. A resposta pode ser editada pelo mesmo link. O dashboard e as páginas de confirmações são atualizados a partir do banco.

### Limitações do WhatsApp

Este projeto **não envia mensagens automaticamente** e não usa a API oficial do WhatsApp. Ele monta um link `https://wa.me/...` e abre o WhatsApp Web/app com a mensagem pronta.

- O envio real depende do administrador tocar em “enviar” no WhatsApp.
- O link `wa.me` **não anexa imagens**. A arte precisa ser baixada/anexada manualmente.
- O histórico só é gravado após a confirmação explícita na interface.
- Reenvios geram novos registros com `attempt` incrementado.
- Para automação real seria necessário integrar a WhatsApp Business Platform (API oficial), o que está fora do escopo atual.

## Rotas

### Públicas

| Rota | Descrição |
| --- | --- |
| `/` | Landing pública com detalhes da festa e contagem regressiva. |
| `/convite/[uuid]` | Convite individual e formulário de RSVP. |
| `/api/public/party` | Configurações públicas da festa. |
| `/api/public/invitations/[uuid]` | Dados do convite individual. |
| `/api/public/invitations/[uuid]` (PUT) | Cria ou atualiza o RSVP. |
| `/api/public/invitations/[uuid]/calendar` | Arquivo `.ics` para o calendário. |
| `/api/invite-image/[name]` | Serve a arte enviada pelo painel. |

### Administrativas

Todas exigem sessão válida e são bloqueadas no servidor por `requireAdmin`.

| Rota | Descrição |
| --- | --- |
| `/admin/login` | Login do painel. |
| `/admin` | Dashboard com métricas e gráficos. |
| `/admin/convidados` | Lista, busca, filtros, ordenação, ações em lote e CSV. |
| `/admin/convidados/[id]` | Detalhe, edição, reenvio, regeneração de link e exclusão. |
| `/admin/envios` | Histórico de envios e reenvios. |
| `/admin/confirmacoes` | Respostas, faixas etárias e recados. |
| `/admin/configuracoes` | Dados da festa, imagem, template, limite e senha. |

## Regras de negócio

- **Convites e pessoas são contagens diferentes.** O dashboard mostra convites enviados/confirmados separadamente do total de pessoas (adultos + crianças 8–11 + crianças 0–7).
- **RSVP único por convite.** A resposta é editável; o histórico de envios permanece.
- **Faixas etárias separadas:** adultos, crianças de 8 a 11 anos e crianças de 0 a 7 anos.
- **Recusa não exige pessoas.** Em uma confirmação positiva, é obrigatório informar ao menos uma pessoa.
- **Limite de pessoas:** o limite individual do convidado tem prioridade sobre o limite padrão das configurações.
- **Telefones** são normalizados para E.164 brasileiro (`55` + DDD + número) e validados no cliente e no servidor.
- **Links de convite** usam UUID v4 e não permitem enumerar convidados.
- **Mensagem e configurações** são persistidas no banco e aplicadas imediatamente na página pública.

## Configurações da festa

Em `/admin/configuracoes` é possível alterar:

- aniversariantes e idades;
- data/hora e rótulos exibidos;
- local, endereço, bairro, cidade, UF e consulta do mapa;
- imagem do convite (PNG, JPG ou WebP, até 5 MB);
- template da mensagem de WhatsApp (precisa conter `[LINK]`);
- texto de introdução do RSVP;
- mensagens de sucesso e de recusa;
- limite padrão de pessoas por convite;
- senha do administrador.

Marcadores disponíveis no template: `[Nome]`, `[LINK]`, `[FESTA]`, `[DATA]`, `[HORARIO]`, `[LOCAL]`, `[ENDERECO]` e `[CIDADE]`.

A imagem enviada fica em `DATA_DIR/uploads` (volume persistente em produção) e é servida por `/api/invite-image/...`. A arte padrão é `public/images/convite-padrao.svg`.

## Testes e verificação

```bash
npm test          # Vitest: telefone, mensagens, RSVP, limites e configurações
npm run typecheck # vue-tsc / Nuxt typecheck
npm run build     # build de produção
npm run preview   # pré-visualização do build
```

Os testes cobrem as regras puras compartilhadas. Fluxos HTTP e de banco devem ser verificados no ambiente de desenvolvimento ou em um teste de integração próprio.

## Deploy com Docker (produção)

1. Copie o exemplo e ajuste os valores:

   ```bash
   cp .env.production.example .env
   ```

   Use uma senha longa para `POSTGRES_PASSWORD` (evite caracteres que precisem de escape em URL, como `@`, `:`, `/`, `#` e `%`) e defina `APP_URL` com a URL pública real, por exemplo `https://convite.seudominio.com`.

2. Suba os containers:

   ```bash
   docker compose up -d --build
   ```

3. Acompanhe a inicialização:

   ```bash
   docker compose logs -f app
   ```

O container da aplicação aplica as migrations automaticamente (`RUN_MIGRATIONS=true`) e depois inicia o Nitro na porta 3000. O Compose publica a porta definida em `APP_PORT`.

4. Crie o primeiro administrador:

   ```bash
   docker compose exec app node scripts/create-admin.mjs \
     --name "Administrador" \
     --email admin@seudominio.com \
     --password "uma-senha-longa-e-unica"
   ```

5. Acesse `https://seu-dominio/admin` e faça login.

> Em produção, coloque a aplicação atrás de um proxy reverso com HTTPS (Caddy, Nginx, Traefik ou o proxy da plataforma). O cookie de sessão passa a usar `Secure` automaticamente quando a requisição chega via HTTPS. O proxy reverso não faz parte deste Compose; use o de sua preferência.

Para desativar as migrations automáticas, defina `RUN_MIGRATIONS=false`. Nesse caso, rode `docker compose exec app node scripts/migrate.mjs` no momento desejado.

### Persistência

- `convite_pgdata`: dados do PostgreSQL.
- `convite_uploads`: imagens enviadas em `/app/data`.

Faça backup dos dois volumes. Recriar containers sem remover volumes preserva os dados; `docker compose down -v` apaga tudo.

## Backup e restauração

### Banco

```bash
# Backup comprimido
docker compose exec -T db pg_dump -U convite -d convite_festa -Fc > backup-$(date +%F).dump

# Restauração (sobrescreve os objetos existentes)
cat backup-2026-11-18.dump | docker compose exec -T db pg_restore \
  -U convite -d convite_festa --clean --if-exists --no-owner
```

Se as credenciais do banco forem diferentes, ajuste `-U` e `-d` ou use as variáveis do `.env`.

### Imagens enviadas

```bash
docker run --rm \
  -v convite-festa_convite_uploads:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Para restaurar, troque `:ro` por `:rw` e execute `tar xzf /backup/uploads-....tar.gz -C /data`.

> O nome do volume pode variar se você alterou o campo `name` do Compose. Confira com `docker volume ls`.

## Segurança

- Senhas são armazenadas com `scrypt` e salt aleatório; nunca em texto puro.
- Sessões duram 7 dias, são armazenadas por hash SHA-256 e usam cookie `httpOnly`, `SameSite=Lax` e `Secure` sob HTTPS.
- Todas as APIs administrativas validam a sessão no servidor, independentemente do middleware de rota.
- Escritas administrativas verificam a origem (`Origin`) contra o host da requisição.
- Entradas são validadas com Zod no servidor; o banco usa consultas parametrizadas via Drizzle.
- A interface Vue escapa o conteúdo por padrão; não há uso de `v-html` com dados de convidados.
- Rotas de convite, APIs e painel enviam `X-Robots-Tag: noindex, nofollow`; o painel também tem cabeçalhos de segurança globais.
- Login, leitura de convites, RSVP e troca de senha têm rate limiting.
- O RSVP é limitado por IP e por convite, e não revela se um UUID existe além do necessário.
- Erros internos não retornam stack traces ao cliente.
- O CSV neutraliza fórmulas de planilha e usa BOM/UTF-8 com delimitador `;`.

### Rate limiting

O rate limiter é **em memória e por processo**. Isso é suficiente para uma instância única, que é o cenário previsto para esta festa. Se a aplicação for escalada horizontalmente (vários containers/processos), troque `server/utils/rate-limit.ts` por um armazenamento compartilhado, como Redis.

## Estrutura do projeto

```text
app/                  # páginas, layouts, componentes e composables
  pages/
    convite/[uuid].vue
    admin/...
  components/
  composables/
server/
  api/                # endpoints Nitro
  database/           # schema e cliente Drizzle
  middleware/         # cabeçalhos de segurança
  plugins/            # log global de erros
  utils/              # auth, dashboard, queries, uploads, rate limit
shared/               # validação, tipos, configurações e utilitários
drizzle/              # migrations SQL
scripts/              # seed, create-admin e migrate
tests/                # Vitest
docker/               # entrypoint de produção
```

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Build de produção. |
| `npm run preview` | Pré-visualiza o build. |
| `npm run typecheck` | Checagem de tipos do app e do servidor. |
| `npm test` | Testes com Vitest. |
| `npm run db:generate` | Gera migration do schema. |
| `npm run db:migrate` | Aplica migrations. |
| `npm run db:push` | Sincroniza o schema diretamente (apenas prototipagem). |
| `npm run db:seed` | Popula dados de desenvolvimento. |
| `npm run admin:create` | Cria/redefine um administrador. |
| `npm run db:studio` | Abre o Drizzle Studio. |

## Decisões e escopo

- Não há dados mockados na aplicação: tudo é lido do PostgreSQL. O seed é apenas uma conveniência de desenvolvimento.
- Não há envio automático de WhatsApp, nem botões sem ação.
- Os gráficos são componentes SVG próprios (donut, barras e progresso), sem dependência pesada de charts.
- O evento padrão está configurado para **23 de janeiro de 2027, às 15h**, no Recanto Família Fernandes, em Cascavel/PR. A data pode ser alterada no painel.
- O projeto não inclui upload de múltiplas imagens, segmentação de convidados por grupos ou integração com e-mail. Esses itens podem ser adicionados sem mudar o modelo principal.
