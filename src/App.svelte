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
      // Se conserva el objeto JSON completo, sin validar ni transformar sus campos.
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
    <a class="brand" href="#inicio"><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024 · v0.9.9</small></span></a>
    {#if obrRole === 'GM'}<nav><span>Director de juego</span></nav>{:else}<nav><span>Jugador</span></nav>{/if}
  </header>

  <main class="main">
    <div class="connection"><span class:connected={obrReady}></span>{syncStatus}</div>

    {#if obrRole === 'GM'}
      <div class="eyebrow">SALA ACTUAL</div>
      <h1>Personajes de <em>la sala.</em></h1>
      <section class="panel">
        <div class="section-heading"><div><div class="eyebrow">FICHAS PUBLICADAS</div><h2>Personajes de los jugadores</h2></div><span class="count">{roomSheets.length}</span></div>
        <div class="actions"><button class="secondary" on:click={refreshPlayers}>Actualizar jugadores</button></div>
        {#if !roomSheets.length}<p class="muted">Todavía no hay personajes publicados.</p>
        {:else}
          {#each roomSheets as entry}
            <article class="character-card">
              <div class="card-symbol">✧</div>
              <div><h3>{entry.sheet?.name || 'Personaje sin nombre'}</h3><p>{entry.playerName}</p></div>
              <details class="gm-sheet-details">
                <summary>Ver ficha</summary>
                {#each sectionPairs(entry.sheet?.sections || []) as pair}
                  <section class="sheet-section"><h3>{pair.heading.name}</h3>
                    {#each pair.heading.stats || [] as stat, i}
                      <div class="sheet-stat"><span>{stat.name || '—'}</span><strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value)}</strong></div>
                    {/each}
                  </section>
                {/each}
              </details>
            </article>
          {/each}
        {/if}
      </section>
    {:else}
      <div class="eyebrow">HOJA DE PERSONAJE <span>IMPORTACIÓN JSON</span></div>
      <h1>Tu <em>aventurero.</em></h1>
      <p class="intro">Importa la ficha JSON de DummySheet. La aplicación conserva sus datos y los muestra siguiendo el orden de sus secciones.</p>

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
        <div class="sheet-title">
          <div class="eyebrow">FICHA IMPORTADA</div>
          <h2>{sheet.name || 'Personaje'}</h2>
          {#if sheet.notes}<p>{sheet.notes}</p>{/if}
        </div>

        <div class="sheet-grid">
          {#each sectionPairs(sheet.sections || []) as pair}
            <section class="panel sheet-section">
              <div class="section-heading"><div><div class="eyebrow">SECCIÓN {pair.heading.id ?? ''}</div><h2>{pair.heading.name || 'Sección'}</h2></div></div>
              {#each pair.heading.stats || [] as stat, i}
                <div class="sheet-stat">
                  <span>{stat.name || '—'}</span>
                  <strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value)}</strong>
                </div>
              {/each}
            </section>
          {/each}
        </div>

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
  .sheet-title{margin:1.25rem 0}.sheet-title h2{font-size:1.8rem;margin:.25rem 0}.sheet-title p{color:var(--muted,#aeb5c2);line-height:1.5}
  .sheet-grid{display:grid;grid-template-columns:1fr;gap:.8rem}.sheet-section{min-width:0}
  .sheet-stat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:.8rem;padding:.65rem 0;border-bottom:1px solid var(--line,rgba(255,255,255,.1));align-items:start}
  .sheet-stat:last-child{border-bottom:0}.sheet-stat span{color:var(--muted,#aeb5c2);font-size:.9rem}.sheet-stat strong{text-align:right;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.92rem;font-weight:600}
  .gm-sheet-details{flex-basis:100%;margin-top:.7rem}.gm-sheet-details summary{cursor:pointer;color:var(--accent,#d6b66d);padding:.5rem 0}
  .gm-sheet-details .sheet-section{margin:.7rem 0;padding:.8rem;background:rgba(0,0,0,.12);border-radius:.5rem}
  .empty-state{text-align:center;padding:2rem}.save-panel{display:flex;flex-direction:column;gap:.8rem}
  .save-panel .danger-text{align-self:center}
  @media(min-width:700px){.sheet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
