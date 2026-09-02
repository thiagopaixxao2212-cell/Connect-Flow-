# ConnectFlow Digital

Painel interno da ConnectFlow Digital para gestão de clientes, acessos, equipe, campanhas, conteúdo, CRM, metas, diagnósticos, relatórios e integrações.

## Estrutura

- `index.html` — snapshot atual do frontend em produção.
- `public/` — logo e favicon.
- `supabase/functions/` — snapshot das funções centrais do backend.
- `supabase/migrations/README.md` — histórico conhecido das migrations aplicadas no projeto Supabase.
- `docs/` — arquitetura, deploy e segurança.
- `.env.example` — nomes de variáveis; **sem valores secretos**.

## Segurança

Este repositório deve permanecer **PRIVADO**. Nunca versionar:

- `SUPABASE_SERVICE_ROLE_KEY`
- senha de app do Gmail/SMTP
- token da Meta Ads
- OpenAI API key
- qualquer arquivo `.env` real

A chave publishable/anon do Supabase é própria para uso no frontend; chaves administrativas devem existir apenas no backend/Secrets.

## Frontend / Vercel

O frontend atual é estático. Para publicar manualmente:

1. Importe este repositório na Vercel.
2. Framework preset: `Other`.
3. Build command: deixe vazio.
4. Output directory: deixe vazio/raiz.
5. Deploy.

Depois de conectar o GitHub à Vercel, commits na branch configurada podem gerar deploy automaticamente.

## Supabase

As Edge Functions não são publicadas pela Vercel. Elas continuam no Supabase e devem ser implantadas separadamente via Supabase CLI/CI.

Antes de automatizar deploy de banco/funções pelo GitHub, crie um ambiente de desenvolvimento/preview para evitar alterações diretas em produção.

## Status do snapshot

Este pacote foi preparado a partir do estado atual do projeto ConnectFlow em setembro de 2026. Ele é um ponto de partida para versionamento no GitHub; o banco de dados vivo continua hospedado no Supabase.
