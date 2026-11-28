import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-diagnostics-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });

  const expectedKey = Deno.env.get("DIAGNOSTICS_API_KEY") || "";
  const suppliedKey = request.headers.get("x-diagnostics-key") || "";
  if (!expectedKey || suppliedKey !== expectedKey) return json({ error: "No autorizado." }, 401);

  const token = Deno.env.get("GITHUB_TOKEN") || "";
  const owner = Deno.env.get("GITHUB_OWNER") || "heunithen";
  const repo = Deno.env.get("GITHUB_REPO") || "-creacion-personaje-dnd-2024.";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const githubHeaders = {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || (request.method === "POST" ? "dispatch" : "status");

    if (action === "dispatch") {
      if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
      if (!token) return json({ error: "Falta configurar GITHUB_TOKEN en los secretos de Supabase." }, 503);
      const payload = await request.json().catch(() => ({}));
      const allowed = new Set(["all","characters","encounters","shop","audit","types","browser"]);
      const suite = allowed.has(payload.suite) ? payload.suite : "all";
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/diagnostics.yml/dispatches`, {
        method: "POST",
        headers: { ...githubHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "main", inputs: { suite } })
      });
      if (!response.ok) return json({ error: "GitHub rechazó la ejecución.", detail: await response.text() }, response.status);
      return json({ accepted: true, suite, message: "Batería enviada a GitHub Actions." }, 202);
    }

    if (!token) return json({ error: "Falta configurar GITHUB_TOKEN en los secretos de Supabase." }, 503);
    if (action === "status") {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/diagnostics.yml/runs?per_page=8`, { headers: githubHeaders });
      if (!response.ok) return json({ error: "No se pudo consultar GitHub Actions." }, response.status);
      const data = await response.json();
      const runs = (data.workflow_runs || []).map((run: any) => ({
        id: run.id, run_number: run.run_number, status: run.status, conclusion: run.conclusion,
        suite: run.display_title, commit_sha: run.head_sha, created_at: run.created_at,
        updated_at: run.updated_at, url: run.html_url
      }));
      return json({ runs });
    }

    if (action === "events" || action === "results") {
      if (!supabaseUrl || !serviceKey) return json({ error: "Falta configurar el acceso administrativo de Supabase." }, 503);
      const table = action === "events" ? "diagnostic_events" : "diagnostic_test_runs";
      const query = action === "events"
        ? "select=id,created_at,event_type,module,error_code,severity,message,context,app_version,commit_sha,test_case_id&order=created_at.desc&limit=100"
        : "select=*&order=created_at.desc&limit=20";
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey }
      });
      if (!response.ok) return json({ error: "No se pudieron consultar los diagnósticos." }, response.status);
      return json({ [action]: await response.json() });
    }

    return json({ error: "Acción desconocida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error interno." }, 500);
  }
});
