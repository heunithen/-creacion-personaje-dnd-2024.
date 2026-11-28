import fs from 'node:fs';

const reportPath = process.env.DIAGNOSTICS_OUTPUT || 'test-results/character-matrix.json';
if (!fs.existsSync(reportPath)) {
  console.log('No existe un informe de matriz; no hay resultados que persistir.');
  process.exit(0);
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!serviceKey) {
  console.log('SUPABASE_SERVICE_ROLE_KEY no está configurada; el informe se conservará como artefacto de GitHub Actions.');
  process.exit(0);
}

const baseUrl = (process.env.SUPABASE_URL || 'https://akbvedwkpjokphzridla.supabase.co').replace(/\/$/, '');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const workflowRunId = Number(process.env.GITHUB_RUN_ID || 0) || null;
const runPayload = {
  workflow_run_id: workflowRunId,
  suite: report.suite || 'characters',
  status: report.failed ? 'failure' : 'success',
  commit_sha: process.env.GITHUB_SHA || '',
  summary: { total: report.total, passed: report.passed, warnings: report.warnings, failed: report.failed }
};

const headers = {
  apikey: serviceKey,
  Authorization: 'Bearer ' + serviceKey,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};
async function post(table, rows) {
  const response = await fetch(baseUrl + '/rest/v1/' + table, {
    method: 'POST', headers, body: JSON.stringify(rows)
  });
  if (!response.ok) throw new Error('Supabase ' + table + ' (' + response.status + '): ' + (await response.text()).slice(0, 500));
  return response.json();
}

const [run] = await post('diagnostic_test_runs', runPayload);
for (let offset = 0; offset < report.results.length; offset += 200) {
  const batch = report.results.slice(offset, offset + 200).map(result => ({
    run_id: run.id,
    case_key: result.case_key,
    class_name: result.class_name,
    background_name: result.background_name,
    species_name: result.species_name,
    status: result.status,
    errors: result.errors,
    warnings: result.warnings
  }));
  await post('diagnostic_test_results', batch);
}
console.log('Persistidos ' + report.results.length + ' resultados de auditoría en Supabase. Run: ' + run.id);
