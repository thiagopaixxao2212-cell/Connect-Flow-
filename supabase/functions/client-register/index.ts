import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const jsonHeaders = { ...cors, "Content-Type": "application/json; charset=utf-8" };

async function serviceFetch(url: string, init: RequestInit = {}) {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!service) throw new Error("Configuração do servidor ausente.");
  const headers = new Headers(init.headers || {});
  headers.set("apikey", service);
  headers.set("Authorization", `Bearer ${service}`);
  return fetch(url, { ...init, headers });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido." }), { status: 405, headers: jsonHeaders });

  let createdId: string | null = null;
  try {
    const base = Deno.env.get("SUPABASE_URL");
    if (!base) throw new Error("Configuração do servidor ausente.");
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const code = String(body?.invite_code || "").trim().toUpperCase();
    if (!name || !email || password.length < 8) throw new Error("Preencha nome, e-mail e senha com pelo menos 8 caracteres.");

    let inv: any = null;
    if (code) {
      const invRes = await serviceFetch(`${base}/rest/v1/client_invites?code=eq.${encodeURIComponent(code)}&active=eq.true&select=id,client_id,expires_at,max_uses,uses`);
      const invRows = await invRes.json();
      if (!invRes.ok) throw new Error("Não foi possível validar o convite.");
      inv = invRows?.[0];
      if (!inv || new Date(inv.expires_at).getTime() <= Date.now() || Number(inv.uses) >= Number(inv.max_uses)) throw new Error("Código de convite inválido, expirado ou já utilizado.");
    }

    const userRes = await serviceFetch(`${base}/auth/v1/admin/users`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: name } }),
    });
    const user = await userRes.json();
    if (!userRes.ok) {
      const em = String(user?.msg || user?.message || user?.error || "");
      if (/already|registered|exists|duplicate/i.test(em)) throw new Error("Este e-mail já possui uma conta. Use Entrar ou solicite redefinição de senha.");
      throw new Error(em || "Não foi possível criar a conta.");
    }
    createdId = user.id;

    const common = { "Content-Type": "application/json", "Prefer": "return=minimal" };
    const profRes = await serviceFetch(`${base}/rest/v1/profiles?id=eq.${createdId}`, { method: "PATCH", headers: common, body: JSON.stringify({ full_name: name, role: "client" }) });
    if (!profRes.ok) throw new Error("Não foi possível configurar o perfil do cliente.");

    if (inv) {
      const mapRes = await serviceFetch(`${base}/rest/v1/user_clients`, { method: "POST", headers: common, body: JSON.stringify({ user_id: createdId, client_id: inv.client_id }) });
      if (!mapRes.ok) throw new Error("Não foi possível vincular o acesso à empresa.");
      const uses = Number(inv.uses) + 1;
      await serviceFetch(`${base}/rest/v1/client_invites?id=eq.${inv.id}`, { method: "PATCH", headers: common, body: JSON.stringify({ uses, active: uses < Number(inv.max_uses) }) });
    }

    const message = inv ? "Conta criada e vinculada à empresa. Você já pode entrar." : "Conta criada com sucesso. Aguarde a agência vincular seu acesso à empresa correta.";
    return new Response(JSON.stringify({ ok: true, linked: !!inv, message }), { status: 200, headers: jsonHeaders });
  } catch (e) {
    if (createdId) {
      try { const base = Deno.env.get("SUPABASE_URL"); if (base) await serviceFetch(`${base}/auth/v1/admin/users/${createdId}`, { method: "DELETE" }); } catch (_) {}
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao criar conta." }), { status: 400, headers: jsonHeaders });
  }
});
