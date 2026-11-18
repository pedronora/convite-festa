# AGENTS.md

Guia para agentes de IA e contribuidores que alteram este repositório. O [README](./README.md) cobre instalação, deploy, backup e a visão funcional; aqui ficam as regras de trabalho e os detalhes que não podem ser quebrados.

## Contexto

Aplicação Nuxt 4 (Vue 3 + TypeScript estrito) para o aniversário do Luigi e do Marco Antonio. Tem duas faces:

- **Pública**: landing, convite individual por UUID e formulário de RSVP.
- **Administrativa**: login, dashboard, convidados, envios, confirmações e configurações.

Interface, mensagens, commits e documentação em **português do Brasil**. O tema visual é Homem-Aranha (vermelho, azul-marinho, branco e azul-claro), com estética de quadrinhos.

## Comandos

```bash
npm install                 # Node >= 22.22 (o host com Node 20 emite apenas avisos)

docker compose -f docker-compose.dev.yml up -d   # PostgreSQL de dev na porta 5433
npm run db:migrate          # aplica migrations pendentes
npm run db:seed             # admin + configurações + dados de exemplo (só dev)

npm run dev                 # http://localhost:3000
npm run build
npm run preview
npm test                    # Vitest (regras compartilhadas)
npm run typecheck           # vue-tsc / Nuxt
npm run db:generate         # gera migration a partir do schema
npm run db:studio
npm run admin:create -- --name "Ana" --email ana@exemplo.com --password "senha-longa"
```

Antes de abrir PR, rode **`npm test`, `npm run typecheck` e `npm run build`**. Os testes são unitários; fluxos HTTP/banco precisam de verificação manual em dev ou de um teste de integração próprio.

## Mapa do repositório

```text
app/                    # cliente Nuxt
  pages/                # rotas (admin/ e convite/[uuid].vue)
  components/           # componentes autoimportados (pathPrefix: false)
  composables/          # useAuth, useApi, useToast
  layouts/              # admin, auth, public
  middleware/           # guarda de rota admin
  assets/css/main.css   # tokens e utilitários Tailwind v4
server/api/             # endpoints Nitro (admin/, auth/, public/, invite-image/)
server/database/        # schema.ts e client.ts (Drizzle)
server/utils/           # auth, dashboard, queries, settings, uploads, rate limit
server/middleware/      # cabeçalhos de segurança
shared/                 # config, types, utils e validation (isomórfico)
drizzle/                # migrations SQL + snapshot
scripts/                # seed.ts, create-admin.ts, migrate.mjs (produção)
tests/                  # Vitest
docker/                 # entrypoint de produção
```

Alias `#shared` aponta para `shared/`. Código em `shared/` roda no cliente, no servidor e nos testes: **não importe banco, `node:*` ou APIs de servidor ali**.

## Regras que não podem ser quebradas

1. **Link do convite é único.** Use `buildInvitationLink()` de `shared/utils/format.ts`, que já inclui a âncora `#rsvp`. Nunca monte `/convite/${uuid}` à mão — o convidado deve cair direto no formulário.
2. **Dados da festa vêm do banco.** Aniversariantes, idades, data, local, imagem, textos e limite ficam em `party_settings` e são editáveis em `/admin/configuracoes`. Os valores iniciais vivem em `shared/config/party.ts`; não hardcode nomes, endereço ou data em páginas.
3. **WhatsApp é manual.** O sistema só abre `wa.me` com a mensagem pronta. Não simule envio automático nem anexe imagem. O histórico (`invitation_sends`) só é gravado após confirmação explícita do administrador e é append-only (reenvio = novo registro com `attempt` maior).
4. **Convites ≠ pessoas.** Convite é a linha em `invitations`; pessoas são adultos + crianças 8–11 + crianças 0–7 do RSVP. O dashboard calcula tudo do banco e mostra os dois números separadamente.
5. **Autorização no servidor.** Toda API em `server/api/admin/**` chama `requireAdmin(event)`. O middleware `admin` protege apenas a navegação; nunca confie só nele.
6. **Validação compartilhada.** Schemas Zod ficam em `shared/validation`; o servidor sempre revalida. Validação no cliente é só conveniência.
7. **Segurança por padrão.** Nada de `v-html` com dados de usuário; consultas só via Drizzle (parametrizadas); não exponha IDs sequenciais em rotas públicas; não registre telefone, e-mail ou mensagem em logs; erros internos não vão para o cliente. Login, RSVP e troca de senha têm rate limit.
8. **Uploads controlados.** Imagem do convite em `DATA_DIR/uploads`, aceitando PNG/JPG/WebP até 5 MB, servida por `/api/invite-image/[name]`. A arte padrão é `public/images/convite-padrao.svg`.
9. **Sem botão morto nem mock em produção.** Seed é exclusivamente de desenvolvimento. Toda ação visível precisa funcionar de verdade.
10. **Uma instância.** O rate limit é em memória e por processo. Se houver escala horizontal, troque `server/utils/rate-limit.ts` por Redis antes de subir mais réplicas.

## Banco e migrations

- Schema em `server/database/schema.ts`; migrations geradas em `drizzle/`.
- Alterou o schema? Edite o schema, rode `npm run db:generate`, **revise o SQL gerado** e aplique com `npm run db:migrate`.
- Nunca edite uma migration já aplicada; crie outra.
- Em produção o container roda `scripts/migrate.mjs` no entrypoint (`RUN_MIGRATIONS=true`); o seed nunca roda automaticamente.
- Env de runtime: `DATABASE_URL` e `DATA_DIR` (ou `NUXT_DATABASE_URL` / `NUXT_DATA_DIR`). O código tem fallback para `runtimeConfig`.

## Convenções de código

- TypeScript estrito, Vue 3 com `<script setup lang="ts">` e Composition API. Sem `any` gratuito.
- Estilo do código existente: 2 espaços, aspas simples, sem ponto e vírgula.
- Componentes reutilizáveis em `app/components`; evite criar variações quando `AppButton`, `AppModal`, `FormField`, `StatusBadge`, `EmptyState` etc. já resolvem.
- Estilo com utilitários Tailwind e tokens do tema (`spider-*`, `comic`, sombras). Se precisar de uma cor ou animação nova, adicione ao `main.css` em vez de espalhar valores arbitrários.
- Gráficos são componentes SVG próprios (`app/components/charts`); não adicione biblioteca de charts sem necessidade real.
- Datas exibidas usam os utilitários de `shared/utils/format.ts`; telefones passam por `shared/utils/phone.ts` (E.164 brasileiro).
- Textos de interface em pt-BR, com tom acolhedor e direto.

## Testes

- `tests/` cobre telefone, mensagens, RSVP, limites e configurações.
- Ao mudar uma regra compartilhada, atualize/adicione o teste correspondente no mesmo PR.
- Prefira testar funções puras; para banco, valide no ambiente de dev.

## Git e GitHub Flow

`main` está sempre pronta para deploy. Nenhum trabalho entra direto nela.

1. Crie uma branch a partir de `main`: `feat/…`, `fix/…`, `docs/…` ou `chore/…`.
2. Faça commits pequenos e coesos no formato `tipo: resumo no imperativo` (ex.: `fix: ancora o link do convite no RSVP`).
3. Push cedo para a branch remota e abra um PR descrevendo o problema, a solução e como verificar.
4. Responda à revisão com novos commits na mesma branch.
5. Com testes/CI verdes, faça merge (squash) e apague a branch.
6. Deploy sai de `main`.

Nunca commite `.env`, `.data/`, `node_modules`, `.nuxt`, `.output` ou artefatos de build — o `.gitignore` já cobre esses casos.

## Ambiente

- Banco de dev: `postgres://convite:convite@localhost:5433/convite_festa`.
- Admin do seed: definido por `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env` (senha mínima de 10 caracteres).
- Convite de teste do seed: `/convite/11111111-1111-4111-8111-111111111111`.
- A imagem de produção usa `node:22-bookworm-slim`. **Não volte para Alpine** sem retestar o build do cliente (o Rollup falha com `Code is nested too deeply`).
- Compose de produção usa o projeto `convite-festa`, com os volumes `convite-festa_convite_pgdata` e `convite-festa_convite_uploads`.
- Atrás de HTTPS, o cookie de sessão vira `Secure` automaticamente; o proxy reverso não faz parte do Compose.
