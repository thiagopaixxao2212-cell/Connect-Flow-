# Política de segurança

## Nunca commitar

- senhas
- tokens de acesso
- service role keys
- SMTP App Password
- chaves OpenAI
- tokens Meta Ads
- dumps de banco com dados de clientes

## Se um segredo for commitado por acidente

1. Revogue/rotacione o segredo imediatamente.
2. Gere um novo segredo no provedor correspondente.
3. Atualize Supabase/Vercel Secrets.
4. Remova o segredo do histórico Git antes de tornar o repositório acessível a terceiros.

## Contas de clientes

O isolamento de dados deve continuar sendo garantido por RLS no Supabase, não apenas pela interface do navegador.
