const reportPath = process.env.DIAGNOSTICS_OUTPUT || 'test-results/character-matrix.json';
if (!await (await import('node:fs')).existsSync(reportPath)) {
  console.log('No existe un informe de matriz; no hay resultados que persistir.');
  process.exit(0);
}
const key = process.env.DIAGNOSTICS_API_KEY || '';
if (!key) {
  console.log('DIAGNOSTICS_API_KEY no está configurada en GitHub; el informe se conservará como artefacto.');
  process.exit(0);
}
const fs = await import('node:fs');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const baseUrl = (process.env.SUPABASE_URL || 'https://akbvedwkpjokphzridla.supabase.co').replace(/\/$/, '');
const response = await fetch(baseUrl + '/functions/v1/diagnostics?action=persist', {
  method: 'POST',
  headers: {
    apikey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BOiPUrLlhogEadY_phsFMw_s6JrIzcP',
    'x-diagnostics-key': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...report,
    workflow_run_id: Number(process.env.GITHUB_RUN_ID || 0) || null,
    commit_sha: process.env.GITHUB_SHA || ''
  })
});
if (!response.ok) throw new Error('No se pudo persistir el informe (' + response.status + '): ' + (await response.text()).slice(0, 500));
console.log('Resultados guardados en Supabase: ' + JSON.stringify(await response.json()));
