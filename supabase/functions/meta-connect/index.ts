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
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } });
  if (!u.ok) throw new Error("Sessão inválida");
  return await u.json();
}

async function roleFor(userId: string, auth: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, { headers: { apikey: ANON, Authorization: auth } });
  if (!r.ok) throw new Error("Não foi possível validar o perfil");
  const rows = await r.json();
  return rows?.[0]?.role;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const user = await currentUser(auth);
    const role = await roleFor(user.id, auth);
    if (!['owner','admin'].includes(role)) return new Response(JSON.stringify({ error: "Apenas administradores podem conectar a Meta." }), { status: 403, headers: cors });

    const body = await req.json();
    const token = String(body.token || "").trim();
    const label = String(body.label || "Meta Ads").trim();
    const client_id = body.client_id || null;
    const external_business_id = body.external_business_id || null;
    if (token.length < 20) return new Response(JSON.stringify({ error: "Token Meta inválido." }), { status: 400, headers: cors });

    const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/store_meta_token_service`, {
      method: "POST",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_client_id: client_id, p_label: label, p_token: token, p_external_business_id: external_business_id }),
    });
    const data = await rpc.json().catch(() => null);
    if (!rpc.ok) throw new Error(data?.message || data?.error || "Falha ao guardar conexão Meta");

    return new Response(JSON.stringify({ ok: true, integration_id: data }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Erro inesperado" }), { status: 400, headers: cors });
  }
});
