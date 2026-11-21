<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';

  const KEY = 'com.heunithen.dnd2024-character-builder/character';
  const CHANNEL = 'com.heunithen.dnd2024-character-builder/character-sync';

  type RawStat = { id?: number; name?: string; value?: unknown; [key: string]: unknown };
  type RawSection = { id?: number; name?: string; stats?: RawStat[]; [key: string]: unknown };
  type RawSheet = { id?: number; name?: string; notes?: string; sections?: RawSection[]; [key: string]: unknown };
  type RoomEntry = { playerId: string; playerName: string; sheet: RawSheet };

  let sheet: RawSheet | null = null;
  let roomSheets: RoomEntry[] = [];
  let importOpen = false;
  let notice = '';
  let obrReady = false;
  let obrRole = '';
  let playerName = '';
  let syncStatus = 'Owlbear Rodeo no está conectado.';
  let fileInput: HTMLInputElement;

  function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then((contents) => {
      sheet = JSON.parse(contents) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
      importOpen = false;
      notice = 'Personaje importado. Guarda la ficha para publicarla en la sala.';
      input.value = '';
    }).catch(() => {
      notice = 'No se pudo leer el archivo. Comprueba que sea un JSON válido.';
      input.value = '';
    });
  }

  function sectionPairs(sections: RawSection[] = []) {
    const result: { heading: RawSection; values?: RawSection }[] = [];
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i];
      if (String(current.name || '').toUpperCase() === 'VALORES') continue;
      const next = sections[i + 1];
      result.push({
        heading: current,
        values: next && String(next.name || '').toUpperCase() === 'VALORES' ? next : undefined
      });
      if (result[result.length - 1].values) i++;
    }
    return result;
  }

  function sectionClass(name = '') {
    const n = name.toLocaleLowerCase();
    if (/atribut|característic|ability|ability score/.test(n)) return 'attributes-section';
    if (/combate|ataque|armadura|punto de golpe|defensa/.test(n)) return 'combat-section';
    if (/habilidad|salvaci|competenc/.test(n)) return 'skills-section';
    if (/rasgo|dote|característica de clase|especie|racial/.test(n)) return 'features-section';
    if (/conjuro|magia|hechizo/.test(n)) return 'magic-section';
    if (/equipo|inventario|objeto/.test(n)) return 'equipment-section';
    if (/personalidad|historia|trasfondo|apariencia/.test(n)) return 'story-section';
    return 'general-section';
  }

  function displayValue(value: unknown) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function readPlayers(players: any[]) {
    roomSheets = players.flatMap((p: any) => {
      const payload = p.metadata?.[KEY];
      if (!payload || payload.deleted || !payload.character) return [];
      return [{ playerId: p.id, playerName: p.name || payload.playerName || 'Jugador', sheet: payload.character as RawSheet }];
    });
  }

  async function refreshPlayers() {
    try { readPlayers(await OBR.party.getPlayers()); } catch {}
  }

  async function restoreOwnSheet() {
    if (obrRole !== 'PLAYER') return;
    const metadata: any = await OBR.player.getMetadata();
    const payload = metadata?.[KEY];
    if (payload?.deleted) {
      sheet = null;
      localStorage.removeItem('forja-raw-character');
      return;
    }
    if (payload?.character) {
      sheet = payload.character as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    }
  }

  async function saveSheet() {
    if (!sheet) return;
    localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    if (obrReady && obrRole === 'PLAYER') {
      try {
        const id = await OBR.player.getId();
        const name = await OBR.player.getName();
        await OBR.player.setMetadata({ [KEY]: { character: sheet, playerName: name, updatedAt: new Date().toISOString() } });
        await OBR.broadcast.sendMessage(CHANNEL, {
          type: 'character-updated', playerId: id, playerName: name, character: sheet
        }, { destination: 'ALL' });
        syncStatus = 'Ficha publicada en la sala.';
      } catch {
        syncStatus = 'No se pudo publicar la ficha en la sala.';
      }
    }
    notice = 'Ficha guardada.';
  }

  async function deleteSheet() {
    sheet = null;
    localStorage.removeItem('forja-raw-character');
    if (obrReady && obrRole === 'PLAYER') {
      try {
        const id = await OBR.player.getId();
        await OBR.player.setMetadata({ [KEY]: { deleted: true, updatedAt: new Date().toISOString() } });
        await OBR.broadcast.sendMessage(CHANNEL, { type: 'character-deleted', playerId: id }, { destination: 'ALL' });
      } catch {}
    }
    notice = 'Ficha eliminada.';
  }

  onMount(() => {
    try {
      const stored = localStorage.getItem('forja-raw-character');
      if (stored) sheet = JSON.parse(stored) as RawSheet;
    } catch {
      localStorage.removeItem('forja-raw-character');
    }
    if (OBR.isAvailable) OBR.onReady(async () => {
      obrReady = true;
      try {
        obrRole = await OBR.player.getRole();
        playerName = await OBR.player.getName();
        syncStatus = 'Conectado a Owlbear Rodeo como ' + (obrRole === 'GM' ? 'Director de juego.' : 'Jugador.');
        await restoreOwnSheet();
        await refreshPlayers();
        OBR.party.onChange((players: any[]) => readPlayers(players));
        OBR.broadcast.onMessage(CHANNEL, (event: any) => {
          const d = event.data;
          if (d?.type === 'character-updated' && d.character) {
            roomSheets = [...roomSheets.filter(x => x.playerId !== d.playerId), {
              playerId: d.playerId, playerName: d.playerName || 'Jugador', sheet: d.character
            }];
          }
          if (d?.type === 'character-deleted') roomSheets = roomSheets.filter(x => x.playerId !== d.playerId);
        });
      } catch {
        syncStatus = 'Owlbear está abierto, pero no se pudo leer la sala.';
      }
    });
  });
</script>

<svelte:head><title>Forja de Aventureros — D&D 2024</title></svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#inicio"><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024 · v1.0.0</small></span></a>
    {#if obrRole === 'GM'}<nav><span>Director de juego</span></nav>{:else}<nav><span>Jugador</span></nav>{/if}
  </header>

  <main class="main">
    <div class="connection"><span class:connected={obrReady}></span>{syncStatus}</div>

    {#if obrRole === 'GM'}
      <div class="page-heading"><div class="eyebrow">SALA ACTUAL</div><h1>Personajes de <em>la sala.</em></h1></div>
      <section class="panel roster-panel">
        <div class="section-heading"><div><div class="eyebrow">FICHAS PUBLICADAS</div><h2>Personajes de los jugadores</h2></div><span class="count">{roomSheets.length}</span></div>
        <div class="actions"><button class="secondary" on:click={refreshPlayers}>Actualizar jugadores</button></div>
        {#if !roomSheets.length}<p class="muted">Todavía no hay personajes publicados.</p>
        {:else}
          {#each roomSheets as entry}
            <article class="character-card">
              <div class="card-symbol">✧</div>
              <div class="card-identity"><h3>{entry.sheet?.name || 'Personaje sin nombre'}</h3><p>{entry.playerName}</p></div>
              <details class="gm-sheet-details">
                <summary>Ver ficha completa</summary>
                <div class="character-sheet gm-character-sheet">
                  <div class="sheet-banner"><span class="sheet-kicker">HOJA DE PERSONAJE · D&D 2024</span><h2>{entry.sheet?.name || 'Personaje'}</h2>{#if entry.sheet?.notes}<p>{entry.sheet.notes}</p>{/if}</div>
                  <div class="sheet-grid">
                    {#each sectionPairs(entry.sheet?.sections || []) as pair}
                      <section class="sheet-section {sectionClass(pair.heading.name)}">
                        <div class="sheet-section-title"><span>{pair.heading.id ?? ''}</span><h3>{pair.heading.name || 'Sección'}</h3></div>
                        <div class="stats-list">
                          {#each pair.heading.stats || [] as stat, i}
                            <div class="sheet-stat"><span>{stat.name || '—'}</span><strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value)}</strong></div>
                          {/each}
                        </div>
                      </section>
                    {/each}
                  </div>
                </div>
              </details>
            </article>
          {/each}
        {/if}
      </section>
    {:else}
      <div class="page-heading"><div class="eyebrow">HOJA DE PERSONAJE <span>IMPORTACIÓN JSON</span></div><h1>Tu <em>aventurero.</em></h1><p class="intro">Importa la ficha JSON de DummySheet para verla con una presentación inspirada en la hoja oficial de D&D 2024.</p></div>

      <section class="panel import-character-panel">
        <div class="import-row">
          <button class="secondary" on:click={() => importOpen = !importOpen}>{sheet ? 'Importar otro personaje' : 'Importar personaje JSON'}</button>
          <span class="hint">{sheet ? 'Hay un personaje cargado.' : 'Selecciona el archivo JSON de la ficha.'}</span>
        </div>
        {#if importOpen}
          <div class="import-box">
            <label>Archivo JSON<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
            <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
          </div>
        {/if}
      </section>

      {#if sheet}
        <article class="character-sheet">
          <header class="sheet-banner">
            <span class="sheet-kicker">HOJA DE PERSONAJE · D&D 2024</span>
            <h2>{sheet.name || 'Personaje'}</h2>
            {#if sheet.notes}<p>{sheet.notes}</p>{/if}
          </header>
          <div class="sheet-grid">
            {#each sectionPairs(sheet.sections || []) as pair}
              <section class="sheet-section {sectionClass(pair.heading.name)}">
                <div class="sheet-section-title"><span>{pair.heading.id ?? ''}</span><h3>{pair.heading.name || 'Sección'}</h3></div>
                <div class="stats-list">
                  {#each pair.heading.stats || [] as stat, i}
                    <div class="sheet-stat">
                      <span>{stat.name || '—'}</span>
                      <strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value)}</strong>
                    </div>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        </article>

        <section class="panel save-panel">
          <button class="primary full" on:click={saveSheet}>Guardar ficha</button>
          <button class="danger-text" on:click={deleteSheet}>Eliminar personaje</button>
        </section>
      {:else}
        <section class="panel empty-state"><p>No hay ningún personaje cargado.</p><p class="hint">Importa el JSON exportado o preparado con el formato de DummySheet.</p></section>
      {/if}
    {/if}
  </main>

  {#if notice}<button class="toast" on:click={() => notice = ''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS</span><span>Ficha JSON · D&D 2024</span></footer>
</div>

<style>
  :global(:root){--paper:#f3eee2;--paper-deep:#e8dfce;--ink:#24231f;--ink-soft:#5e594f;--rule:#c9bea9;--red:#8f3028;--gold:#b18a45}
  .page-heading{margin:1.2rem 0 1rem}.page-heading h1{margin:.2rem 0}.page-heading .intro{max-width:48rem}
  .character-sheet{background:var(--paper);color:var(--ink);border:1px solid #c8bda8;border-radius:10px;padding:clamp(.65rem,2vw,1.25rem);box-shadow:0 12px 32px rgba(0,0,0,.22);font-family:Georgia,'Times New Roman',serif}
  .sheet-banner{position:relative;padding:1.1rem 1.2rem 1rem;margin-bottom:.9rem;border:2px solid var(--ink);outline:1px solid var(--ink);outline-offset:4px;background:linear-gradient(135deg,#f8f4eb,#e9e0d0);text-align:center}
  .sheet-kicker{font:700 .62rem/1.2 system-ui,sans-serif;letter-spacing:.19em;color:var(--red)}
  .sheet-banner h2{font:700 clamp(1.55rem,4vw,2.5rem)/1.1 Georgia,serif;letter-spacing:.025em;margin:.35rem 0;color:var(--ink)}
  .sheet-banner p{font: .85rem/1.45 system-ui,sans-serif;color:var(--ink-soft);margin:.35rem auto 0;max-width:50rem}
  .sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}
  .sheet-section{min-width:0;padding:.7rem .8rem .65rem;border:1px solid var(--rule);border-top:3px solid var(--red);border-radius:5px;background:rgba(255,255,255,.43);break-inside:avoid}
  .sheet-section-title{display:flex;align-items:center;gap:.5rem;padding-bottom:.45rem;margin-bottom:.25rem;border-bottom:1px solid var(--rule)}
  .sheet-section-title>span{display:grid;place-items:center;min-width:1.45rem;height:1.45rem;border-radius:50%;background:var(--red);color:#fff;font:700 .68rem system-ui,sans-serif}
  .sheet-section-title h3{margin:0;color:var(--red);font:700 .9rem/1.2 system-ui,sans-serif;letter-spacing:.055em;text-transform:uppercase}
  .stats-list{display:grid;grid-template-columns:1fr}
  .sheet-stat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:.55rem;align-items:start;padding:.42rem .05rem;border-bottom:1px solid rgba(130,112,83,.24)}
  .sheet-stat:last-child{border-bottom:0}
  .sheet-stat span{color:var(--ink-soft);font: .75rem/1.35 system-ui,sans-serif;overflow-wrap:anywhere}
  .sheet-stat strong{color:var(--ink);text-align:right;white-space:pre-wrap;overflow-wrap:anywhere;font:700 .78rem/1.35 system-ui,sans-serif}
  .combat-section{border-top-color:#292722;background:#ebe5d8}
  .combat-section .sheet-section-title h3{color:#292722}
  .attributes-section{grid-column:1/-1;border-top-color:var(--gold);background:#eee7d8}
  .attributes-section .sheet-section-title h3{color:#765a27}
  .attributes-section .stats-list{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:.8rem}
  .attributes-section .sheet-stat{grid-template-columns:1fr;gap:.15rem;text-align:center;padding:.55rem .2rem;border:1px solid rgba(130,112,83,.25);margin:.15rem;border-radius:4px;background:rgba(255,255,255,.38)}
  .attributes-section .sheet-stat span{text-transform:uppercase;font-size:.66rem;letter-spacing:.06em}
  .attributes-section .sheet-stat strong{text-align:center;font:700 1.05rem/1.3 Georgia,serif}
  .skills-section{border-top-color:#75664c}
  .features-section{border-top-color:#56705c}
  .features-section .sheet-section-title h3{color:#405a46}
  .magic-section{border-top-color:#526b8c}
  .magic-section .sheet-section-title h3{color:#405a78}
  .equipment-section{border-top-color:#987343}
  .story-section{border-top-color:#7b5d70}
  .general-section{border-top-color:#8b8171}
  .import-character-panel{margin-bottom:1rem}
  .sheet-title{margin:1.25rem 0}.sheet-title h2{font-size:1.8rem;margin:.25rem 0}
  .gm-sheet-details{flex-basis:100%;margin-top:.7rem}.gm-sheet-details summary{cursor:pointer;color:var(--accent,#d6b66d);padding:.5rem 0}
  .gm-character-sheet{margin-top:.8rem}.gm-character-sheet .sheet-grid{grid-template-columns:1fr}
  .empty-state{text-align:center;padding:2rem}.save-panel{display:flex;flex-direction:column;gap:.8rem;margin-top:1rem}
  .save-panel .danger-text{align-self:center}
  .roster-panel{margin-top:1rem}.card-identity{min-width:0}
  @media(max-width:560px){.sheet-grid{grid-template-columns:1fr}.attributes-section{grid-column:auto}.attributes-section .stats-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(min-width:900px){.sheet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attributes-section{grid-column:1/-1}}
</style>
