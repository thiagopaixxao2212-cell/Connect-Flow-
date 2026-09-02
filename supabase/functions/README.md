# Edge Functions — snapshot

## Fonte incluída neste pacote

- meta-connect (JWT)
- meta-discover (JWT)
- meta-sync (JWT)
- client-register (pública; autenticação/validação feita pela própria função)
- team-admin (JWT)
- request-password-reset (pública)
- change-my-password (JWT)

## Funções ativas no Supabase que continuam no ambiente vivo e devem ser exportadas antes de uma migração completa

- client-invite-create
- ai-config
- ai-monthly-report
- client-access-admin
- client-password-reset
- client-password-reset-page

## Infraestrutura temporária/legada não versionada como código principal

- connectflow-web
- app-bundle
- app-html

> O GitHub passa a ser a fonte de verdade do frontend a partir deste snapshot. Para transformar também o backend em GitOps, exporte as funções restantes e o SQL integral das migrations antes de automatizar deploy de produção.
