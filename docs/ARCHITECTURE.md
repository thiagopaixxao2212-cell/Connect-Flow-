# Arquitetura

## Frontend
Vercel hospeda o painel web da ConnectFlow.

## Backend
Supabase fornece:
- Auth
- Postgres
- RLS
- Edge Functions
- Vault/Secrets para integrações

## Integrações
- Meta Ads: conexão, descoberta de contas e sincronização.
- OpenAI: geração de relatórios mensais.
- SMTP/Gmail: planejado/necessário para e-mails transacionais de recuperação de senha.

## Perfis
- Owner
- Admin
- Analyst
- Client

Usuários `client` devem acessar somente clientes vinculados em `user_clients`.
