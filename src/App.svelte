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
  let activeTab = 'Datos';
  const tabs = ['Datos', 'Competencias', 'Equipo', 'Combate', 'Conjuros', 'Tiradas'];
  let syncStatus = 'Owlbear Rodeo no está conectado.';
  let fileInput: HTMLInputElement;
  type CustomRoll = { id: string; name: string; die: number; bonus: number };
  let customRolls: CustomRoll[] = [];
  let newRollName = '';
  let newRollDie = 20;
  let newRollBonus = 0;
  const DICE_PLUS_SOURCE = 'com.heunithen.dnd2024-character-builder';

  function persistCustomRolls() {
    localStorage.setItem('forja-custom-rolls', JSON.stringify(customRolls));
  }

  function addCustomRoll() {
    const name = newRollName.trim();
    if (!name) { notice = 'Escribe un nombre para la tirada.'; return; }
    customRolls = [{ id: String(Date.now()) + Math.random().toString(36).slice(2), name, die: newRollDie, bonus: Number(newRollBonus) || 0 }, ...customRolls];
    newRollName = '';
    persistCustomRolls();
  }

  async function checkDicePlusReady(): Promise<boolean> {
    const requestId = String(Date.now()) + Math.random().toString(36).slice(2);
    return new Promise((resolve) => {
      const unsubscribe = OBR.broadcast.onMessage('dice-plus/isReady', (event: any) => {
        if (event.data?.ready === true && event.data.requestId === requestId) {
          unsubscribe();
          resolve(true);
        }
      });
      OBR.broadcast.sendMessage('dice-plus/isReady', { requestId, timestamp: Date.now() }, { destination: 'ALL' });
      setTimeout(() => { unsubscribe(); resolve(false); }, 1200);
    });
  }

  async function performCustomRoll(roll: CustomRoll, mode: 'normal' | 'advantage' | 'disadvantage') {
    if (!obrReady || obrRole !== 'PLAYER') {
      notice = 'Las tiradas solo pueden enviarse desde la ficha de un jugador dentro de Owlbear Rodeo.';
      return;
    }
    try {
      const ready = await checkDicePlusReady();
      if (!ready) {
        notice = 'Dice+ no está disponible en esta sala. Activa la extensión Dice+ para tirar.';
        return;
      }
      const playerId = await OBR.player.getId();
      const currentPlayerName = await OBR.player.getName();
      const dice = mode === 'normal' ? '1d' + roll.die : '2d' + roll.die + (mode === 'advantage' ? 'kh1' : 'kl1');
      const modifier = roll.bonus === 0 ? '' : (roll.bonus > 0 ? '+' : '') + roll.bonus;
      const label = roll.name.replace(/[#\\n]/g, ' ').trim();
      const rollId = 'forja_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId,
        playerId,
        playerName: currentPlayerName,
        rollTarget: 'everyone',
        diceNotation: dice + modifier + ' # ' + label,
        showResults: true,
        timestamp: Date.now(),
        source: DICE_PLUS_SOURCE
      }, { destination: 'ALL' });
      notice = 'Tirada enviada a Dice+.';
    } catch {
      notice = 'No se pudo enviar la tirada a Dice+.';
    }
  }

  function removeCustomRoll(id: string) {
    customRolls = customRolls.filter(roll => roll.id !== id);
    persistCustomRolls();
  }

  function editField(target: Record<string, unknown>, key: string, event: Event) {
    target[key] = (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
    if (sheet) sheet = { ...sheet };
  }

  function editSheetField(key: string, event: Event) {
    if (sheet) editField(sheet, key, event);
  }

  function editStatValue(pair: { heading: RawSection; values?: RawSection }, stat: RawStat, index: number, event: Event) {
    const valueStat = pair.values?.stats?.[index];
    editField(valueStat || stat, 'value', event);
  }

  function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then((contents) => {
      sheet = JSON.parse(contents) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
      importOpen = false;
      notice = 'Ficha importada.';
      input.value = '';
    }).catch(() => {
      notice = 'No se pudo leer el archivo JSON.';
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

  function sectionTab(name = '') {
    const n = name.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/\b19\b.*recurso|recurso/.test(n)) return 'Ocultar';
    if (/conjuro|hechizo|spell|magia/.test(n)) return 'Conjuros';
    if (/tirada|roll|dado/.test(n)) return 'Tiradas';
    if (/equipo|inventario|objeto/.test(n)) return 'Equipo';
    if (/salvacion|habilidad|competencia|skill|saving throw|proficien/.test(n)) return 'Competencias';
    if (/combate|ataque|rasgo|dote|caracteristica de clase|especie|racial|weapon|armor/.test(n)) return 'Combate';
    return 'Datos';
  }

  function visiblePairs(sections: RawSection[] = [], tab = activeTab) {
    return sectionPairs(sections).filter(pair => sectionTab(String(pair.heading.name || '')) === tab);
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
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).trim() === '' ? '' : String(value);
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
      const storedRolls = localStorage.getItem('forja-custom-rolls');
      if (storedRolls) customRolls = JSON.parse(storedRolls) as CustomRoll[];
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
    <a class="brand" href="#inicio"><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>D&D · 2024</small></span></a>
    {#if obrRole === 'GM'}<nav><span>Director de juego</span></nav>{:else}<nav><span>Jugador</span></nav>{/if}
  </header>

  <main class="main">
    {#if obrRole === 'GM'}
      <section class="panel roster-panel">
        <div class="section-heading"><h2>Personajes de la sala</h2><span class="count">{roomSheets.length}</span></div>
        <div class="actions"><button class="secondary" on:click={refreshPlayers}>Actualizar</button></div>
        {#if !roomSheets.length}<p class="muted">No hay personajes publicados.</p>
        {:else}
          {#each roomSheets as entry}
            <article class="character-card">
              <div class="card-symbol">✧</div>
              <div class="card-identity"><h3>{entry.sheet?.name || 'Personaje sin nombre'}</h3><p>{entry.playerName}</p></div>
              <details class="gm-sheet-details">
                <summary>Ver ficha</summary>
                <div class="character-sheet gm-character-sheet">
                  <div class="sheet-banner"><h2>{entry.sheet?.name || 'Personaje'}</h2></div>
                  <div class="sheet-grid">
                    {#each visiblePairs(entry.sheet?.sections || [], 'Datos') as pair}
                      <section class="sheet-section {sectionClass(pair.heading.name)}">
                        <div class="sheet-section-title"><h3>{pair.heading.name || 'Sección'}</h3></div>
                        <div class="stats-list">
                          {#each pair.heading.stats || [] as stat, i}
                            <div class="sheet-stat"><span>{stat.name || '—'}</span><strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value) || '—'}</strong></div>
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
      <section class="panel import-character-panel">
        <div class="import-row">
          <button class="secondary" on:click={() => importOpen = !importOpen}>{sheet ? 'Importar otro JSON' : 'Importar ficha JSON'}</button>
        </div>
        {#if importOpen}
          <div class="import-box">
            <label>Archivo<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
            <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
          </div>
        {/if}
      </section>

      {#if sheet}
        <article class="character-sheet">
          <header class="sheet-banner">
            <h1 class="character-name">{sheet.name || 'Personaje'}</h1>
          </header>
          <nav class="sheet-tabs" role="tablist" aria-label="Pestañas de la ficha">
            {#each tabs as tab}<button class:active={activeTab === tab} role="tab" aria-selected={activeTab === tab} on:click={() => activeTab = tab}>{tab}</button>{/each}
          </nav>
          {#if activeTab === 'Tiradas'}
            <section class="custom-rolls">
              {#if customRolls.length}
                <div class="custom-roll-list">
                  {#each customRolls as roll (roll.id)}
                    <article class="custom-roll-card">
                      <div class="custom-roll-info"><strong>{roll.name}</strong><span>d{roll.die} {roll.bonus >= 0 ? '+' : ''}{roll.bonus}</span></div>
                      <div class="roll-actions">
                        <button type="button" on:click={() => performCustomRoll(roll, 'normal')}>Tirar</button>
                        <button type="button" on:click={() => performCustomRoll(roll, 'advantage')}>Ventaja</button>
                        <button type="button" on:click={() => performCustomRoll(roll, 'disadvantage')}>Desventaja</button>
                        <button class="remove-roll" type="button" aria-label="Eliminar tirada" on:click={() => removeCustomRoll(roll.id)}>×</button>
                      </div>
                    </article>
                  {/each}
                </div>
              {:else}<p class="muted">Todavía no hay tiradas guardadas.</p>{/if}
              <h3>Crear tirada</h3>
              <form class="roll-creator" on:submit|preventDefault={addCustomRoll}>
                <label>Nombre<input bind:value={newRollName} placeholder="Ej. Percepción" /></label>
                <label>Dado<select bind:value={newRollDie}>{#each [4,6,8,10,12,20,100] as die}<option value={die}>d{die}</option>{/each}</select></label>
                <label>Bonificador<input type="number" bind:value={newRollBonus} /></label>
                <button class="primary" type="submit">Añadir tirada</button>
              </form>
            </section>
          {:else}
          <div class="sheet-grid">
            {#each visiblePairs(sheet.sections || [], activeTab) as pair}
              <section class="sheet-section {sectionClass(pair.heading.name)}">
                <div class="sheet-section-title">
                  <input class="section-name editable" aria-label="Nombre de sección" value={pair.heading.name || ''} on:input={(event) => editField(pair.heading, 'name', event)} />
                </div>
                <div class="stats-list">
                  {#each pair.heading.stats || [] as stat, i}
                    <div class="sheet-stat">
                      <input class="stat-label editable" aria-label="Nombre del campo" value={stat.name || ''} on:input={(event) => editField(stat, 'name', event)} />
                      {#if pair.values?.stats?.[i]}
                        <textarea class="stat-value editable" aria-label="Valor" rows="1" value={displayValue(pair.values.stats[i].value)} on:input={(event) => editStatValue(pair, stat, i, event)}></textarea>
                      {:else}
                        <textarea class="stat-value editable" aria-label="Valor" rows="1" value={displayValue(stat.value)} on:input={(event) => editStatValue(pair, stat, i, event)}></textarea>
                      {/if}
                    </div>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
          {/if}
        </article>

        <section class="panel save-panel">
          <button class="primary full" on:click={saveSheet}>Guardar cambios</button>
          <button class="danger-text" on:click={deleteSheet}>Eliminar personaje</button>
        </section>
      {:else}
        <section class="panel empty-state"><p>No hay ninguna ficha cargada.</p></section>
      {/if}
    {/if}
  </main>

  {#if notice}<button class="toast" on:click={() => notice = ''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS</span></footer>
</div>

<style>
  :global(:root){--paper:#f3eee2;--paper-deep:#e8dfce;--ink:#24231f;--ink-soft:#5e594f;--rule:#c9bea9;--red:#8f3028;--gold:#b18a45}
  .character-sheet{background:var(--paper);color:var(--ink);border:1px solid #c8bda8;border-radius:10px;padding:clamp(.65rem,2vw,1.25rem);box-shadow:0 12px 32px rgba(0,0,0,.22);font-family:Georgia,'Times New Roman',serif}
  .character-sheet > .sheet-banner{display:block;min-height:0;height:auto;padding:0!important;margin:0 0 .5rem!important;border:0!important;outline:0!important;background:none!important;box-shadow:none!important;text-align:center}
  .character-sheet > .sheet-banner .character-name{display:block;width:100%;min-height:0;margin:0!important;padding:0!important;border:0!important;outline:0!important;background:none!important;color:#000!important;font:700 1.25rem/1.2 Georgia,serif;text-align:center}
  .sheet-notes{display:block;width:100%;margin-top:.35rem;font:.78rem/1.4 system-ui,sans-serif;text-align:center;color:var(--ink-soft)}
  .editable{box-sizing:border-box;border:1px solid transparent;border-radius:3px;background:transparent;color:inherit;min-width:0;padding:.16rem .22rem;resize:vertical}
  .editable:hover{border-color:rgba(143,48,40,.35);background:rgba(255,255,255,.22)}
  .editable:focus{outline:1px solid var(--red);border-color:var(--red);background:#fffdf8}
  .sheet-tabs{display:flex;gap:.35rem;overflow-x:auto;padding:.15rem 0 .65rem;margin-bottom:.7rem;border-bottom:1px solid var(--rule)}
  .sheet-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.48rem .68rem;background:#e8dfce;color:var(--ink-soft);font:600 .72rem system-ui,sans-serif;cursor:pointer}
  .sheet-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .custom-rolls{padding:.8rem;border:1px solid var(--rule);border-top:3px solid var(--gold);border-radius:5px;background:rgba(255,255,255,.43);color:var(--ink)}
  .custom-rolls h3{margin:0 0 .75rem;color:var(--red);font:700 .9rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}
  .roll-creator{display:grid;grid-template-columns:minmax(0,2fr) minmax(5rem,1fr) minmax(5rem,1fr) auto;gap:.55rem;align-items:end}
  .roll-creator label{display:grid;gap:.25rem;color:var(--ink-soft);font:600 .7rem system-ui,sans-serif}
  .roll-creator input,.roll-creator select{width:100%;min-width:0;box-sizing:border-box;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#fffdf8;color:var(--ink);font:.85rem system-ui,sans-serif}
  .roll-creator button,.roll-actions button{min-height:36px;padding:.45rem .65rem;border:1px solid var(--rule);border-radius:4px;background:#e8dfce;color:var(--ink);font:600 .72rem system-ui,sans-serif;cursor:pointer}
  .roll-creator button{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .custom-roll-list{display:grid;gap:.55rem;margin-top:.9rem}
  .custom-roll-card{padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:rgba(255,255,255,.45)}
  .custom-roll-info{display:flex;justify-content:space-between;gap:.5rem;align-items:center;margin-bottom:.45rem;color:var(--ink)}
  .custom-roll-info span{color:var(--ink-soft);font:.75rem system-ui,sans-serif}
  .roll-actions{display:flex;flex-wrap:wrap;gap:.35rem}
  .roll-actions button{flex:1 1 auto}
  .roll-actions .remove-roll{flex:0 0 36px;font-size:1rem;color:var(--red)}
  .roll-result{display:block;margin-top:.5rem;padding:.45rem .55rem;border-radius:4px;background:#e8dfce;color:var(--ink);font:700 .82rem system-ui,sans-serif}
  .sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}
  .sheet-section{min-width:0;padding:.7rem .8rem .65rem;border:1px solid var(--rule);border-top:3px solid var(--red);border-radius:5px;background:rgba(255,255,255,.43);break-inside:avoid}
  .sheet-section-title{display:flex;align-items:center;padding-bottom:.4rem;margin-bottom:.25rem;border-bottom:1px solid var(--rule)}
  .section-name{width:100%;color:var(--red);font:700 .88rem/1.2 system-ui,sans-serif;letter-spacing:.045em;text-transform:uppercase}
  .stats-list{display:grid;grid-template-columns:1fr}
  .sheet-stat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:.45rem;align-items:center;padding:.35rem .02rem;border-bottom:1px solid rgba(130,112,83,.24)}
  .sheet-stat:last-child{border-bottom:0}
  .stat-label{width:100%;color:var(--ink-soft);font:.73rem/1.35 system-ui,sans-serif}
  .stat-value{width:100%;min-height:1.55rem;color:var(--ink);text-align:right;font:700 .76rem/1.35 system-ui,sans-serif;overflow-wrap:anywhere}
  .combat-section{border-top-color:#292722;background:#ebe5d8}
  .combat-section .section-name{color:#292722}
  .attributes-section{grid-column:1/-1;border-top-color:var(--gold);background:#eee7d8}
  .attributes-section .section-name{color:#765a27}
  .attributes-section .stats-list{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:.65rem}
  .attributes-section .sheet-stat{grid-template-columns:1fr;gap:.1rem;text-align:center;padding:.4rem .15rem;border:1px solid rgba(130,112,83,.25);margin:.12rem;border-radius:4px;background:rgba(255,255,255,.38)}
  .attributes-section .stat-label{text-align:center;text-transform:uppercase;font-size:.64rem;letter-spacing:.05em}
  .attributes-section .stat-value{text-align:center;font:700 1rem/1.3 Georgia,serif}
  .skills-section{border-top-color:#75664c}
  .features-section{border-top-color:#56705c}
  .features-section .section-name{color:#405a46}
  .magic-section{border-top-color:#526b8c}
  .magic-section .section-name{color:#405a78}
  .equipment-section{border-top-color:#987343}
  .story-section{border-top-color:#7b5d70}
  .general-section{border-top-color:#8b8171}
  .import-character-panel{margin-bottom:.8rem}
  .gm-sheet-details{flex-basis:100%;margin-top:.7rem}.gm-sheet-details summary{cursor:pointer;color:var(--accent,#d6b66d);padding:.5rem 0}
  .gm-character-sheet{margin-top:.8rem}.gm-character-sheet .sheet-grid{grid-template-columns:1fr}
  .empty-state{text-align:center;padding:2rem}.save-panel{display:flex;flex-direction:column;gap:.8rem;margin-top:1rem}
  .save-panel .danger-text{align-self:center}
  .roster-panel{margin-top:1rem}.card-identity{min-width:0}
  @media(max-width:650px){.roll-creator{grid-template-columns:1fr 1fr}.roll-creator label:first-child{grid-column:1/-1}.roll-creator button{grid-column:1/-1}}
  @media(max-width:560px){.sheet-grid{grid-template-columns:1fr}.attributes-section{grid-column:auto}.attributes-section .stats-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(min-width:900px){.sheet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attributes-section{grid-column:1/-1}}
</style>
