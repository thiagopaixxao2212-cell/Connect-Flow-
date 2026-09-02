import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function currentUser(auth: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } });
  if (!r.ok) throw new Error("Sessão inválida");
  return r.json();
}
async function roleFor(userId: string, auth: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, { headers: { apikey: ANON, Authorization: auth } });
  if (!r.ok) throw new Error("Perfil inválido");
  const rows = await r.json();
  return rows?.[0]?.role;
}
async function getToken(integrationId: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_meta_token_service`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_integration_id: integrationId }),
  });
  if (!r.ok) throw new Error("Conexão Meta não encontrada");
  const rows = await r.json();
  if (!rows?.[0]?.token) throw new Error("Token Meta indisponível");
  return rows[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const user = await currentUser(auth);
    const role = await roleFor(user.id, auth);
    if (!['owner','admin'].includes(role)) return new Response(JSON.stringify({ error: "Apenas administradores podem descobrir contas." }), { status: 403, headers: cors });
    const { integration_id } = await req.json();
    if (!integration_id) throw new Error("integration_id é obrigatório");
    const secret = await getToken(integration_id);

    let next = `https://graph.facebook.com/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status,business&limit=100&access_token=${encodeURIComponent(secret.token)}`;
    const accounts: any[] = [];
    let pages = 0;
    while (next && pages < 10) {
      const r = await fetch(next);
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d?.error?.message || "Meta recusou o token");
      for (const a of (d.data || [])) accounts.push({
        id: a.id, account_id: a.account_id, name: a.name, currency: a.currency || 'BRL',
        timezone_name: a.timezone_name || 'America/Fortaleza', account_status: a.account_status, business: a.business || null,
      });
      next = d.paging?.next || null;
      pages++;
    }
    return new Response(JSON.stringify({ ok: true, accounts }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Erro ao consultar Meta" }), { status: 400, headers: cors });
  }
});
