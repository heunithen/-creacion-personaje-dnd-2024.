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

    if (action === "persist") {
      if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
      if (!supabaseUrl || !serviceKey) return json({ error: "Falta el acceso administrativo de Supabase." }, 503);
      const report = await request.json().catch(() => ({}));
      if (report.suite !== "characters" || !Array.isArray(report.results) || report.results.length > 1920) {
        return json({ error: "Informe de matriz no válido." }, 400);
      }
      const runResponse = await fetch(`${supabaseUrl}/rest/v1/diagnostic_test_runs`, {
        method: "POST",
        headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({
          workflow_run_id: Number(report.workflow_run_id) || null,
          suite: "characters-matrix",
          status: Number(report.failed) > 0 ? "failure" : "success",
          commit_sha: String(report.commit_sha || "").slice(0, 64),
          summary: { total: Number(report.total) || 0, passed: Number(report.passed) || 0, warnings: Number(report.warnings) || 0, failed: Number(report.failed) || 0 }
        })
      });
      if (!runResponse.ok) return json({ error: "No se pudo guardar la ejecución.", detail: await runResponse.text() }, 500);
      const [run] = await runResponse.json();
      for (let offset = 0; offset < report.results.length; offset += 200) {
        const batch = report.results.slice(offset, offset + 200).map((item: any) => ({
          run_id: run.id,
          case_key: String(item.case_key || "").slice(0, 240),
          class_name: String(item.class_name || "").slice(0, 80),
          background_name: String(item.background_name || "").slice(0, 80),
          species_name: String(item.species_name || "").slice(0, 80),
          status: ["passed","failed","warning"].includes(item.status) ? item.status : "failed",
          errors: Array.isArray(item.errors) ? item.errors.slice(0, 20) : [],
          warnings: Array.isArray(item.warnings) ? item.warnings.slice(0, 20) : []
        }));
        const resultResponse = await fetch(`${supabaseUrl}/rest/v1/diagnostic_test_results`, {
          method: "POST",
          headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify(batch)
        });
        if (!resultResponse.ok) return json({ error: "No se pudieron guardar los resultados de auditoría.", detail: await resultResponse.text() }, 500);
      }
      return json({ saved: report.results.length, run_id: run.id });
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
