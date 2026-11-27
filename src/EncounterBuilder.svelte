<script lang="ts">
  import MONSTERS from './monsters.json';

  type Monster = {
    name: string;
    cr: string;
    group?: string;
    statBlock?: string;
    pdfPage?: number;
    [key: string]: any;
  };
  type Selection = { monster: Monster; quantity: number };
  type GeneratedEncounter = { items: Selection[]; spent: number; creatures: number; key: string };

  export let onAddToCombat: (selection: Selection[]) => void = () => {};

  const BUDGETS: Record<number, Record<string, number>> = {
    1:{easy:50,normal:75,hard:100}, 2:{easy:100,normal:150,hard:200},
    3:{easy:150,normal:225,hard:400}, 4:{easy:250,normal:375,hard:500},
    5:{easy:500,normal:750,hard:1100}, 6:{easy:600,normal:1000,hard:1400},
    7:{easy:750,normal:1300,hard:1700}, 8:{easy:1000,normal:1700,hard:2100},
    9:{easy:1300,normal:2000,hard:2600}, 10:{easy:1600,normal:2300,hard:3100},
    11:{easy:1900,normal:2900,hard:4100}, 12:{easy:2200,normal:3700,hard:4700},
    13:{easy:2600,normal:4200,hard:5400}, 14:{easy:2900,normal:4900,hard:6200},
    15:{easy:3300,normal:5400,hard:7800}, 16:{easy:3800,normal:6100,hard:9800},
    17:{easy:4500,normal:7200,hard:11700}, 18:{easy:5000,normal:8700,hard:14200},
    19:{easy:5500,normal:10700,hard:17200}, 20:{easy:6400,normal:13200,hard:22000}
  };

  const XP_BY_CR: Record<string, number> = {
    '0':10,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,
    '5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900,'11':7200,
    '12':8400,'13':10000,'14':11500,'15':13000,'16':15000,'17':18000,
    '18':20000,'19':22000,'20':25000,'21':33000,'22':41000,'23':50000,
    '24':62000,'25':75000,'26':90000,'27':105000,'28':120000,'29':135000,'30':155000
  };

  function crValue(monster: Monster): string {
    return String(monster.cr || '').trim().split(/\s+/)[0] || '';
  }
  function numericCr(cr: string): number {
    const parts = cr.split('/').map(Number);
    return parts.length === 2 ? parts[0] / parts[1] : Number(parts[0]);
  }
  function monsterXp(monster: Monster): number {
    const raw = String(monster.cr || '');
    const before = raw.match(/XP\s*([\d,]+)/i);
    const after = raw.match(/([\d,]+)\s*XP/i);
    const explicit = before?.[1] || after?.[1];
    if (explicit) return Number(explicit.replace(/,/g, ''));
    return XP_BY_CR[crValue(monster)] || 0;
  }
  function formatXp(value: number): string {
    return Math.round(value).toLocaleString('es-CL') + ' PX';
  }

  const allMonsters = (MONSTERS as Monster[])
    .map(monster => ({ monster, cr: crValue(monster), xp: monsterXp(monster) }))
    .sort((a,b) => numericCr(a.cr) - numericCr(b.cr) || a.monster.name.localeCompare(b.monster.name, 'es'));
  const crOptions = [...new Set(allMonsters.map(item => item.cr).filter(Boolean))]
    .sort((a,b) => numericCr(a) - numericCr(b));

  let groupLevel = 1;
  let partySize = 4;
  let difficulty: 'easy'|'normal'|'hard' = 'normal';
  let search = '';
  let crFilter = '';
  let selected: Selection[] = [];
  let warnings: string[] = [];
  let budgetMessage = '';
  let generatedEncounters: GeneratedEncounter[] = [];
  let generationMessage = '';

  $: budgetPerCharacter = BUDGETS[groupLevel][difficulty];
  $: budget = budgetPerCharacter * partySize;
  $: spent = selected.reduce((sum,item) => sum + monsterXp(item.monster) * item.quantity, 0);
  $: remaining = budget - spent;
  $: usedPercent = budget > 0 ? spent / budget * 100 : 0;
  $: totalCreatures = selected.reduce((sum,item) => sum + item.quantity, 0);
  $: filtered = allMonsters.filter(item =>
    (!search.trim() || item.monster.name.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))) &&
    (!crFilter || item.cr === crFilter)
  );
  $: budgetState = spent === budget ? 'exact' : 'below';
  $: { selected; totalCreatures; warnings = buildWarnings(); }

  function addMonster(monster: Monster) {
    const cost = monsterXp(monster);
    if (!cost) return;
    if (spent + cost > budget) {
      budgetMessage = 'No se puede añadir '+monster.name+': supera el presupuesto. Quedan '+formatXp(Math.max(0, remaining))+'.';
      return;
    }
    budgetMessage = '';
    const found = selected.find(item => item.monster.name === monster.name);
    selected = found
      ? selected.map(item => item.monster.name === monster.name ? {...item, quantity:item.quantity+1} : item)
      : [...selected, {monster, quantity:1}];
  }
  function changeQuantity(name: string, delta: number) {
    const current = selected.find(item => item.monster.name === name);
    if (!current) return;
    const quantity = Math.max(1, current.quantity + delta);
    const nextSpent = spent + (quantity - current.quantity) * monsterXp(current.monster);
    if (nextSpent > budget) {
      budgetMessage = 'No se puede aumentar la cantidad: supera el presupuesto. Quedan '+formatXp(Math.max(0, remaining))+'.';
      return;
    }
    budgetMessage = '';
    selected = selected.map(item => item.monster.name === name ? {...item, quantity} : item);
  }
  function setQuantity(name: string, value: string) {
    const current = selected.find(item => item.monster.name === name);
    if (!current) return;
    const quantity = Math.max(1, Math.floor(Number(value) || 1));
    const nextSpent = spent + (quantity - current.quantity) * monsterXp(current.monster);
    if (nextSpent > budget) {
      budgetMessage = 'Esa cantidad supera el presupuesto. Se mantiene la cantidad anterior.';
      return;
    }
    budgetMessage = '';
    selected = selected.map(item => item.monster.name === name ? {...item, quantity} : item);
  }
  function changeGroupLevel(value: number) {
    const nextBudget = BUDGETS[value][difficulty] * partySize;
    if (spent > nextBudget) { budgetMessage = 'No se puede reducir el nivel: el encuentro actual supera el nuevo presupuesto.'; return; }
    groupLevel = value; budgetMessage = '';
  }
  function changePartySize(value: number) {
    const nextSize = Math.max(1, Math.floor(Number(value) || 1));
    const nextBudget = BUDGETS[groupLevel][difficulty] * nextSize;
    if (spent > nextBudget) { budgetMessage = 'No se puede reducir el grupo: el encuentro actual supera el nuevo presupuesto.'; return; }
    partySize = nextSize; budgetMessage = '';
  }
  function changeDifficulty(value: 'easy'|'normal'|'hard') {
    const nextBudget = BUDGETS[groupLevel][value] * partySize;
    if (spent > nextBudget) { budgetMessage = 'No se puede bajar la dificultad objetivo: el encuentro actual supera ese presupuesto.'; return; }
    difficulty = value; budgetMessage = '';
  }
  function changeDifficultyFromInput(value: string) {
    if (value === 'easy' || value === 'normal' || value === 'hard') changeDifficulty(value);
  }
  function removeMonster(name: string) {
    selected = selected.filter(item => item.monster.name !== name);
  }
  function buildWarnings(): string[] {
    const warnings: string[] = [];
    if (!totalCreatures) return warnings;
    if (totalCreatures === 1) {
      const monster = selected[0].monster;
      const hasLegendary = /legendary action|acciones legendarias|mythic action|acciones míticas/i.test(String(monster.statBlock || ''));
      warnings.push(hasLegendary
        ? 'Encuentro de jefe individual: el perfil incluye acciones especiales que pueden ayudar a compensar la economía de acciones.'
        : 'Un único monstruo puede quedar en desventaja por economía de acciones frente a cuatro personajes. Comprueba si dispone de acciones legendarias, acciones adicionales, fases u otros recursos.');
    } else if (totalCreatures === 2) {
      warnings.push('Dos enemigos pueden ofrecer pocas acciones frente a cuatro personajes, especialmente si uno cae pronto.');
    } else if (totalCreatures >= 9) {
      warnings.push('La cantidad de enemigos puede generar muchos turnos y ralentizar el combate.');
    } else if (totalCreatures >= 6) {
      warnings.push('Hay bastantes enemigos. Considera el tiempo de resolución y la cantidad de turnos que tendrá el grupo enemigo.');
    }
    const weakCount = selected.filter(item => monsterXp(item.monster) <= 100).reduce((sum,item) => sum + item.quantity, 0);
    if (weakCount >= 4) warnings.push('Varios enemigos de bajo coste pueden ser peligrosos por su número y por la presión que ejercen con acciones separadas.');
    const costs = selected.map(item => monsterXp(item.monster)).filter(Boolean);
    if (costs.length >= 2 && Math.max(...costs) >= Math.min(...costs) * 6) {
      warnings.push('La composición mezcla criaturas de costes muy distintos. Los enemigos débiles pueden añadir acciones, pero también caer rápidamente.');
    }
    return warnings;
  }
  function randomEncounter(): GeneratedEncounter | null {
    const available = allMonsters.filter(item => item.xp > 0 && item.xp <= budget);
    if (!available.length) return null;
    const targetCount = 3 + Math.floor(Math.random() * 3);
    const items: Selection[] = [];
    let total = 0;
    let creatures = 0;
    while (creatures < targetCount) {
      const affordable = available.filter(item => item.xp <= budget - total);
      if (!affordable.length) break;
      const remainingSlots = targetCount - creatures;
      const candidates = affordable.filter(item => item.xp <= Math.max(1, (budget - total) / Math.max(1, remainingSlots - 0.35)));
      const pool = candidates.length ? candidates : affordable;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const existing = items.find(entry => entry.monster.name === chosen.monster.name);
      if (existing) existing.quantity += 1;
      else items.push({ monster: chosen.monster, quantity: 1 });
      total += chosen.xp;
      creatures += 1;
      if (creatures >= 3 && Math.random() < 0.22) break;
    }
    if (creatures < 3) return null;
    const normalized = items.map(item => ({...item})).sort((a,b) => a.monster.name.localeCompare(b.monster.name, 'es'));
    return {
      items: normalized,
      spent: total,
      creatures,
      key: normalized.map(item => item.monster.name + ':' + item.quantity).join('|')
    };
  }
  function generateThreeEncounters() {
    const results: GeneratedEncounter[] = [];
    const seen = new Set<string>();
    for (let attempt = 0; attempt < 300 && results.length < 3; attempt += 1) {
      const encounter = randomEncounter();
      if (encounter && !seen.has(encounter.key)) {
        seen.add(encounter.key);
        results.push(encounter);
      }
    }
    generatedEncounters = results;
    generationMessage = results.length
      ? 'Se generaron ' + results.length + ' alternativas aleatorias dentro del presupuesto.'
      : 'No se encontraron combinaciones válidas con al menos 3 monstruos para este presupuesto.';
  }
  function useGeneratedEncounter(encounter: GeneratedEncounter) {
    const cost = encounter.items.reduce((sum, item) => sum + monsterXp(item.monster) * item.quantity, 0);
    if (cost > budget) {
      generationMessage = 'La alternativa ya no cabe en el presupuesto actual. Vuelve a generarla.';
      return;
    }
    selected = encounter.items.map(item => ({...item}));
    budgetMessage = '';
    generationMessage = 'Encuentro seleccionado. Puedes ajustarlo manualmente o enviarlo a Combate.';
  }
  function sendToCombat() {
    if (selected.length) onAddToCombat(selected.map(item => ({...item})));
  }
</script>

<section class="encounter-builder">
  <header class="encounter-intro">
    <div>
      <span class="eyebrow">HERRAMIENTA DEL MASTER</span>
      <h2>Generador de encuentros</h2>
      <p>Construye encuentros comprando monstruos con el presupuesto de PX del DMG 2024. No es posible superar el límite establecido.</p>
    </div>
    <span class="source-tag">DMG 2024</span>
  </header>

  <section class="encounter-config">
    <div class="config-field">
      <label for="enc-level">Nivel del grupo</label>
      <select id="enc-level" value={groupLevel} on:change={(event)=>changeGroupLevel(Number(event.currentTarget.value))}>
        {#each Array.from({length:20},(_,i)=>i+1) as level}<option value={level}>Nivel {level}</option>{/each}
      </select>
    </div>
    <div class="config-field">
      <label for="enc-party">Cantidad de personajes</label>
      <input id="enc-party" type="number" min="1" step="1" value={partySize} on:change={(event)=>changePartySize(Number(event.currentTarget.value))} />
    </div>
    <div class="config-field">
      <label for="enc-difficulty">Dificultad objetivo</label>
      <select id="enc-difficulty" value={difficulty} on:change={(event)=>changeDifficultyFromInput(event.currentTarget.value)}>
        <option value="easy">Fácil</option><option value="normal">Normal</option><option value="hard">Difícil</option>
      </select>
      <small>{difficulty==='easy'?'Hipótesis experimental: 85 %':difficulty==='normal'?'Hipótesis experimental: 70 %':'Hipótesis experimental: 50 %'} de probabilidad de victoria.</small>
    </div>
  </section>

  <section class="budget-panel">
    <div class="budget-heading">
      <div><span class="eyebrow">PRESUPUESTO DEL ENCUENTRO</span><strong>{formatXp(budget)}</strong><small>{formatXp(budgetPerCharacter)} por personaje × {partySize}</small></div>
      <span class:status-below={budgetState==='below'} class:status-exact={budgetState==='exact'} class:status-above={budgetState==='above'} class="budget-status">
        {budgetState==='below'?'Por debajo':budgetState==='exact'?'Presupuesto exacto':'Sobre presupuesto'}
      </span>
    </div>
    <div class="budget-progress"><span style={'width:'+Math.min(100,Math.max(0,usedPercent))+'%'} class:over={spent>budget}></span></div>
    <div class="budget-metrics">
      <div><small>Gastados</small><strong>{formatXp(spent)}</strong></div>
      <div><small>Restantes</small><strong class:negative={remaining<0}>{remaining<0?'−':''}{formatXp(Math.abs(remaining))}</strong></div>
      <div><small>Utilizado</small><strong>{usedPercent.toFixed(1)} %</strong></div>
      <div><small>Criaturas</small><strong>{totalCreatures}</strong></div>
    </div>
    {#if remaining>0}
      <p class="budget-note">Quedan {formatXp(remaining)} disponibles. No es necesario gastar cada punto.</p>
    {:else}
      <p class="budget-note">Has utilizado exactamente el presupuesto disponible.</p>
    {/if}
    {#if budgetMessage}<p class="budget-note over-note" role="status">{budgetMessage}</p>{/if}
  </section>

<section class="random-generator">
    <div class="random-generator-copy">
      <div><span class="eyebrow">COMPRA AUTOMÁTICA</span><h3>Generación aleatoria</h3></div>
      <p>Genera tres alternativas de 3 a 5 monstruos. La selección es aleatoria, permite repeticiones y nunca supera el presupuesto disponible.</p>
    </div>
    <button type="button" class="generate-random" on:click={generateThreeEncounters}>Generar 3 encuentros aleatorios</button>
    {#if generationMessage}<p class="generation-message" role="status">{generationMessage}</p>{/if}
    {#if generatedEncounters.length}
      <div class="generated-grid">
        {#each generatedEncounters as encounter, index}
          <article class="generated-card">
            <div class="generated-card-heading"><strong>Alternativa {index + 1}</strong><span>{encounter.creatures} monstruos</span></div>
            <div class="generated-monsters">
              {#each encounter.items as item}
                <div><span>{item.monster.name}{#if item.quantity > 1} × {item.quantity}{/if}</span><small>VD {crValue(item.monster)} · {formatXp(monsterXp(item.monster) * item.quantity)}</small></div>
              {/each}
            </div>
            <div class="generated-total"><span>{formatXp(encounter.spent)} / {formatXp(budget)}</span><strong>{(encounter.spent / budget * 100).toFixed(1)} %</strong></div>
            <button type="button" class="use-generated" on:click={()=>useGeneratedEncounter(encounter)}>Usar este encuentro</button>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <div class="encounter-columns">
    <section class="catalog-panel">
      <div class="panel-heading"><h3>Catálogo de monstruos</h3><span>{filtered.length} / {allMonsters.length}</span></div>
      <label class="catalog-search">Buscar por nombre<input type="search" bind:value={search} placeholder="Nombre del monstruo..." /></label>
      <label class="catalog-filter">Filtrar por VD<select bind:value={crFilter}><option value="">Todos los VD</option>{#each crOptions as cr}<option value={cr}>VD {cr}</option>{/each}</select></label>
      <div class="monster-results">
        {#each filtered as item (item.monster.name)}
          <article class="monster-option">
            <div class="monster-option-info">
              <strong>{item.monster.name}</strong>
              <small>VD {item.cr || 'Sin VD'} · {item.xp ? formatXp(item.xp) : 'PX no disponibles'}</small>
            </div>
            <button type="button" class="add-monster" disabled={!item.xp} on:click={()=>addMonster(item.monster)} aria-label={'Añadir '+item.monster.name}>＋</button>
          </article>
        {:else}
          <p class="empty-state">No hay monstruos que coincidan con la búsqueda.</p>
        {/each}
      </div>
    </section>

    <section class="selection-panel">
      <div class="panel-heading"><h3>Encuentro construido</h3><button type="button" class="text-button" on:click={()=>selected=[]} disabled={!selected.length}>Vaciar</button></div>
      {#if selected.length}
        <div class="selected-list">
          {#each selected as item (item.monster.name)}
            <article class="selected-monster">
              <div class="selected-identity"><strong>{item.monster.name}</strong><small>VD {crValue(item.monster)} · {formatXp(monsterXp(item.monster))} c/u</small></div>
              <div class="quantity-control">
                <button type="button" on:click={()=>changeQuantity(item.monster.name,-1)} aria-label="Reducir cantidad">−</button>
                <input type="number" min="1" step="1" value={item.quantity} aria-label={'Cantidad de '+item.monster.name} on:change={(event)=>setQuantity(item.monster.name,event.currentTarget.value)} />
                <button type="button" on:click={()=>changeQuantity(item.monster.name,1)} aria-label="Aumentar cantidad">＋</button>
              </div>
              <strong class="line-total">{formatXp(monsterXp(item.monster)*item.quantity)}</strong>
              <button type="button" class="remove-monster" on:click={()=>removeMonster(item.monster.name)} aria-label={'Eliminar '+item.monster.name}>×</button>
            </article>
          {/each}
        </div>
        <div class="selection-total"><span>Total del encuentro</span><strong>{formatXp(spent)}</strong></div>
        <button type="button" class="send-combat" on:click={sendToCombat}>Enviar composición a Combate</button>
      {:else}
        <div class="empty-selection"><strong>El encuentro está vacío</strong><p>Agrega monstruos desde el catálogo sin superar el presupuesto disponible.</p></div>
      {/if}
    </section>
  </div>

  {#if warnings.length}
    <section class="composition-warnings">
      <h3>Advertencias de composición</h3>
      {#each warnings as warning}<p>{warning}</p>{/each}
      <small>Son observaciones orientativas; no modifican el coste ni el límite de compra.</small>
    </section>
  {/if}

  <footer class="encounter-footnote">
    <strong>Sobre el modelo</strong>
    <p>Los presupuestos Fácil, Normal y Difícil corresponden respectivamente a las categorías de dificultad baja, moderada y alta del DMG 2024. Las probabilidades mostradas son hipótesis de trabajo del proyecto; no son probabilidades oficiales ni una predicción matemática del resultado.</p>
  </footer>
</section>

<style>
  .encounter-builder{display:grid;gap:1rem;color:var(--ink,#fff);font-family:system-ui,sans-serif}
  .encounter-intro{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:.25rem 0 .8rem;border-bottom:1px solid var(--rule,#3a4a52)}
  .encounter-intro h2{margin:.25rem 0;color:var(--gold,#5fe6e0);font:700 clamp(1.5rem,3vw,2rem) Georgia,serif}
  .encounter-intro p{max-width:760px;margin:.3rem 0;color:var(--ink-soft,#b5bec3);font-size:.82rem;line-height:1.5}
  .eyebrow{display:block;color:var(--gold,#5fe6e0);font-size:.65rem;font-weight:800;letter-spacing:.12em}
  .source-tag{flex:0 0 auto;padding:.35rem .55rem;border:1px solid var(--rule,#3a4a52);border-radius:4px;color:var(--ink-soft,#b5bec3);font-size:.68rem;font-weight:700}
  .encounter-config{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}
  .config-field{display:grid;align-content:start;gap:.35rem;padding:.75rem;border:1px solid var(--rule,#3a4a52);border-radius:6px;background:var(--paper-deep,#1b2a33)}
  .config-field label,.catalog-search,.catalog-filter{color:var(--ink-soft,#b5bec3);font-size:.73rem;font-weight:700}
  .config-field select,.config-field input,.catalog-search input,.catalog-filter select{box-sizing:border-box;width:100%;min-width:0;padding:.55rem;border:1px solid var(--rule,#3a4a52);border-radius:4px;background:#1b2a33;color:var(--ink,#fff);font:inherit}
  .config-field small{color:var(--gold,#5fe6e0);font-size:.66rem;line-height:1.4}
  .budget-panel,.catalog-panel,.selection-panel,.composition-warnings,.encounter-footnote{padding:.9rem;border:1px solid var(--rule,#3a4a52);border-radius:6px;background:var(--paper-deep,#1b2a33)}
  .budget-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}
  .budget-heading>div{display:grid;gap:.15rem}
  .budget-heading>div>strong{font:700 1.65rem Georgia,serif;color:var(--ink,#fff);font-variant-numeric:tabular-nums}
  .budget-heading small{color:var(--ink-soft,#b5bec3);font-size:.7rem}
  .budget-status{padding:.35rem .55rem;border-radius:4px;font-size:.68rem;font-weight:800}
  .status-below{background:rgba(95,230,224,.12);color:var(--gold,#5fe6e0)}
  .status-exact{background:rgba(91,190,130,.15);color:#83d6a3}
  .status-above{background:rgba(220,90,90,.15);color:#ff9292}
  .budget-progress{height:8px;margin:.8rem 0 .65rem;overflow:hidden;border-radius:8px;background:#0d1b21}
  .budget-progress span{display:block;height:100%;border-radius:inherit;background:var(--gold,#5fe6e0);transition:width .15s}
  .budget-progress span.over{background:#e17b70}
  .budget-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem}
  .budget-metrics>div{display:grid;gap:.2rem;padding:.5rem;border-left:2px solid var(--rule,#3a4a52)}
  .budget-metrics small{color:var(--ink-soft,#b5bec3);font-size:.65rem}
  .budget-metrics strong{font-size:.9rem;font-variant-numeric:tabular-nums}
  .budget-metrics .negative{color:#ff9292}
  .budget-note{margin:.7rem 0 0;color:var(--ink-soft,#b5bec3);font-size:.72rem}
  .over-note{color:#ff9292}
  .random-generator{display:grid;gap:.7rem;padding:.9rem;border:1px solid var(--gold,#5fe6e0);border-radius:6px;background:var(--paper-deep,#1b2a33)}
  .random-generator-copy{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
  .random-generator-copy h3{margin:.2rem 0 0;color:var(--ink,#fff);font:700 1.05rem Georgia,serif}
  .random-generator-copy p{max-width:560px;margin:0;color:var(--ink-soft,#b5bec3);font-size:.72rem;line-height:1.5}
  .generate-random,.use-generated{padding:.65rem .8rem;border:1px solid var(--gold,#5fe6e0);border-radius:5px;background:var(--gold,#5fe6e0);color:#13262e;font-weight:800;cursor:pointer}
  .generate-random{justify-self:start}
  .generation-message{margin:0;color:var(--ink-soft,#b5bec3);font-size:.72rem}
  .generated-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}
  .generated-card{display:grid;align-content:start;gap:.55rem;padding:.7rem;border:1px solid var(--rule,#3a4a52);border-radius:5px;background:#13262e;min-width:0}
  .generated-card-heading,.generated-total{display:flex;justify-content:space-between;align-items:center;gap:.4rem}
  .generated-card-heading strong{color:var(--gold,#5fe6e0);font:700 .9rem Georgia,serif}
  .generated-card-heading span,.generated-total{font-size:.68rem;color:var(--ink-soft,#b5bec3)}
  .generated-monsters{display:grid;gap:.35rem}
  .generated-monsters>div{display:grid;gap:.12rem;padding-bottom:.3rem;border-bottom:1px solid var(--rule,#3a4a52)}
  .generated-monsters span{font-size:.72rem;font-weight:700}
  .generated-monsters small{font-size:.62rem;color:var(--ink-soft,#b5bec3)}
  .generated-total strong{color:var(--ink,#fff)}
  .use-generated{width:100%;font-size:.7rem}
  .encounter-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.8rem;align-items:start}
  .catalog-panel,.selection-panel{min-width:0;display:grid;gap:.65rem}
  .panel-heading{display:flex;justify-content:space-between;align-items:center;gap:.5rem}
  .panel-heading h3,.composition-warnings h3{margin:0;color:var(--gold,#5fe6e0);font:700 1.05rem Georgia,serif}
  .panel-heading>span{color:var(--ink-soft,#b5bec3);font-size:.68rem}
  .text-button{border:0;background:transparent;color:var(--gold,#5fe6e0);font-size:.7rem;cursor:pointer}
  .text-button:disabled{opacity:.35;cursor:not-allowed}
  .catalog-search,.catalog-filter{display:grid;gap:.3rem}
  .monster-results{display:grid;max-height:490px;overflow:auto;padding-right:.2rem}
  .monster-option{display:flex;justify-content:space-between;align-items:center;gap:.6rem;padding:.5rem .1rem;border-bottom:1px solid var(--rule,#3a4a52)}
  .monster-option-info,.selected-identity{display:grid;gap:.15rem;min-width:0}
  .monster-option-info strong,.selected-identity strong{font-size:.76rem}
  .monster-option-info small,.selected-identity small{color:var(--ink-soft,#b5bec3);font-size:.65rem}
  .add-monster{flex:0 0 auto;width:2rem;height:2rem;border:1px solid var(--gold,#5fe6e0);border-radius:4px;background:transparent;color:var(--gold,#5fe6e0);font-size:1.2rem;cursor:pointer}
  .add-monster:disabled{opacity:.3;cursor:not-allowed}
  .selected-list{display:grid}
  .selected-monster{display:grid;grid-template-columns:minmax(0,1fr) auto auto 1.7rem;align-items:center;gap:.45rem;padding:.55rem 0;border-bottom:1px solid var(--rule,#3a4a52)}
  .quantity-control{display:flex;align-items:center;gap:.2rem}
  .quantity-control button,.remove-monster{width:1.7rem;height:1.7rem;border:1px solid var(--rule,#3a4a52);border-radius:4px;background:#13262e;color:var(--gold,#5fe6e0);font-weight:800;cursor:pointer}
  .quantity-control input{box-sizing:border-box;width:3rem;padding:.3rem .1rem;border:1px solid var(--rule,#3a4a52);border-radius:4px;background:#13262e;color:var(--ink,#fff);text-align:center;font:inherit;font-size:.72rem}
  .line-total{min-width:4.8rem;text-align:right;font-size:.7rem;font-variant-numeric:tabular-nums}
  .remove-monster{color:#ff9292;font-size:1rem}
  .selection-total{display:flex;justify-content:space-between;gap:.5rem;padding:.65rem 0;color:var(--ink-soft,#b5bec3);font-size:.76rem}
  .selection-total strong{color:var(--ink,#fff);font-size:.9rem}
  .send-combat{width:100%;padding:.7rem;border:1px solid var(--gold,#5fe6e0);border-radius:5px;background:var(--gold,#5fe6e0);color:#13262e;font-weight:800;cursor:pointer}
  .empty-selection,.empty-state{padding:1.5rem .6rem;text-align:center;color:var(--ink-soft,#b5bec3);font-size:.75rem}
  .empty-selection strong{color:var(--ink,#fff)}
  .empty-selection p{line-height:1.5}
  .composition-warnings{border-left:3px solid #d5ae5b}
  .composition-warnings h3{margin-bottom:.5rem}
  .composition-warnings p{margin:.4rem 0;color:var(--ink-soft,#b5bec3);font-size:.74rem;line-height:1.5}
  .composition-warnings small,.encounter-footnote p{color:var(--ink-soft,#b5bec3);font-size:.68rem;line-height:1.5}
  .encounter-footnote strong{color:var(--gold,#5fe6e0);font:700 .85rem Georgia,serif}
  .encounter-footnote p{margin:.35rem 0 0}
  @media(max-width:760px){.generated-grid{grid-template-columns:1fr}.random-generator-copy{display:grid}.encounter-config{grid-template-columns:1fr 1fr}.encounter-config .config-field:last-child{grid-column:1/-1}.encounter-columns{grid-template-columns:1fr}}
  @media(max-width:480px){.encounter-config{grid-template-columns:1fr}.encounter-config .config-field:last-child{grid-column:auto}.budget-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.selected-monster{grid-template-columns:minmax(0,1fr) auto 1.7rem}.line-total{grid-column:1;text-align:left}.remove-monster{grid-column:3;grid-row:1}.encounter-intro{flex-direction:column}}
</style>
