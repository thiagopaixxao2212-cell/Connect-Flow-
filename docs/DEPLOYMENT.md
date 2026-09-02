# Deploy

## Vercel
Conecte o repositório GitHub ao projeto Vercel da ConnectFlow. O `index.html` é o frontend principal.

## Supabase Edge Functions
As funções em `supabase/functions` são snapshots de código. Para automatizar deploy, use Supabase CLI em CI depois de configurar secrets de GitHub.

## Recomendação de fluxo
- `main`: produção
- `develop`: testes

Valide mudanças em preview antes de promover para produção.
