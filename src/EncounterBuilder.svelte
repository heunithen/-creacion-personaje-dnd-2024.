<script lang="ts">
  import './styles/encounter-builder.css';
  import MONSTERS from './monsters.json';
  import { ENCOUNTER_BUDGETS, ENCOUNTER_TEMPLATES, crValue, numericCr, monsterXp, createEncounterFromTemplate, encounterSignature, canPurchase, withinBudget } from './encounterRules.mjs';
  const BUDGETS: Record<number, Record<'easy'|'normal'|'hard', number>> = ENCOUNTER_BUDGETS;

  type Monster = {
    name: string;
    cr: string;
    group?: string;
    statBlock?: string;
    pdfPage?: number;
    [key: string]: any;
  };
  type Selection = { monster: Monster; quantity: number };
  type TemplateId = 'solo'|'boss_minions'|'duo'|'trio'|'horde';
  type GeneratedEncounter = { items: Selection[]; spent: number; creatures: number; key: string; template: TemplateId; budgetUse?: number; targetReached?: boolean; budgetTolerance?: number };

  export let onAddToCombat: (selection: Selection[]) => void = () => {};

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
  let selectedTemplate: 'any'|TemplateId = 'any';
  let search = '';
  let crFilter = '';
  let selected: Selection[] = [];
  let warnings: string[] = [];
  let budgetMessage = '';
  let generatedEncounters: GeneratedEncounter[] = [];
  let generationMessage = '';
  let generationRunning = false;
  let liveGeneration: { index: number; target: number|string; items: Selection[]; spent: number; creatures: number } | null = null;

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
    if (!canPurchase(spent, cost, budget)) {
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
    if (!withinBudget(nextSpent, budget)) {
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
    if (!withinBudget(spent, nextBudget)) { budgetMessage = 'No se puede reducir el nivel: el encuentro actual supera el nuevo presupuesto.'; return; }
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
  function pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async function buildRandomEncounter(index: number, generationBudget: number, template: TemplateId): Promise<GeneratedEncounter | null> {
    const available = allMonsters.filter(item => item.xp > 0 && item.xp <= generationBudget);
    if (!available.length) return null;
    const generated = createEncounterFromTemplate(available, generationBudget, template);
    const encounter = generated.encounter as GeneratedEncounter | null;
    if (!encounter) return null;
    for (const step of generated.steps) {
      liveGeneration = { index, target: step.target, items: step.items, spent: step.spent, creatures: step.creatures };
      await pause(300);
    }
    return encounter;
  }
  async function generateThreeEncounters() {
    if (generationRunning) return;
    generationRunning = true;
    generatedEncounters = [];
    liveGeneration = null;
    generationMessage = 'Preparando la compra aleatoria...';
    const generationBudget = budget;
    let results: GeneratedEncounter[] = [];
    const seen = new Set<string>();
    let attempts = 0;
    try {
      const templateIds: TemplateId[] = ['solo','boss_minions','duo','trio','horde'];
      while (results.length < 3 && attempts < 60) {
        const template = selectedTemplate === 'any'
          ? templateIds[attempts % templateIds.length]
          : selectedTemplate;
        attempts += 1;
        const encounter = await buildRandomEncounter(results.length + 1, generationBudget, template);
        if (encounter && !seen.has(encounter.key)) {
          seen.add(encounter.key);
          results = [...results, encounter];
          generatedEncounters = [...results];
          liveGeneration = null;
          generationMessage = 'Alternativa ' + results.length + ' de 3: ' + ENCOUNTER_TEMPLATES[template].label + '.';
          await pause(450);
        } else {
          liveGeneration = null;
        }
      }
      generationMessage = results.length
        ? 'Se generaron ' + results.length + ' alternativas con plantillas de composición y dentro del presupuesto.'
        : 'No se encontraron composiciones válidas para estas plantillas con el presupuesto actual.';
    } finally {
      liveGeneration = null;
      generationRunning = false;
    }
  }
  function useGeneratedEncounter(encounter: GeneratedEncounter) {
    const cost = encounter.items.reduce((sum, item) => sum + monsterXp(item.monster) * item.quantity, 0);
    if (cost > budget * 1.03) {
      generationMessage = 'La alternativa supera la tolerancia del 3 % respecto al presupuesto actual. Vuelve a generarla.';
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
      <p>Construye encuentros con el presupuesto de PX del DMG 2024. La generación automática busca quedar lo más cerca posible del 100 % (±3 %); la compra manual no permite exceder el límite.</p>
    </div>
    <span class="source-tag">DMG 2024</span>
  </header>

  <section class="encounter-config">
    <div class="config-field">
      <label for="enc-level">Nivel del grupo</label>
      <select id="enc-level" disabled={generationRunning} value={groupLevel} on:change={(event)=>changeGroupLevel(Number(event.currentTarget.value))}>
        {#each Array.from({length:20},(_,i)=>i+1) as level}<option value={level}>Nivel {level}</option>{/each}
      </select>
    </div>
    <div class="config-field">
      <label for="enc-party">Cantidad de personajes</label>
      <input id="enc-party" type="number" min="1" step="1" disabled={generationRunning} value={partySize} on:change={(event)=>changePartySize(Number(event.currentTarget.value))} />
    </div>
    <div class="config-field">
      <label for="enc-difficulty">Dificultad objetivo</label>
      <select id="enc-difficulty" disabled={generationRunning} value={difficulty} on:change={(event)=>changeDifficultyFromInput(event.currentTarget.value)}>
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
      <p class="budget-note">Quedan {formatXp(remaining)} disponibles. La generación automática busca aproximarse al 100 % del presupuesto, con una tolerancia de ±3 puntos porcentuales.</p>
    {:else}
      <p class="budget-note">El presupuesto está completo o superado.</p>
    {/if}
    {#if budgetMessage}<p class="budget-note over-note" role="status">{budgetMessage}</p>{/if}
  </section>

<section class="random-generator">
    <div class="random-generator-copy">
      <div><span class="eyebrow">COMPRA AUTOMÁTICA</span><h3>Generación aleatoria</h3></div>
      <p>Genera tres alternativas aleatorias siguiendo una plantilla de composición. Cada alternativa intenta quedar entre el 97 % y el 103 % del presupuesto, priorizando el 100 % y respetando la estructura de la plantilla.</p>
    </div>
    <div class="template-controls">
      <label for="enc-template">Plantilla de composición</label>
      <select id="enc-template" bind:value={selectedTemplate} disabled={generationRunning}>
        <option value="any">Aleatorio: combinar plantillas</option>
        <option value="solo">Jefe individual</option>
        <option value="boss_minions">Jefe con secuaces</option>
        <option value="duo">Dúo</option>
        <option value="trio">Trío</option>
        <option value="horde">Horda</option>
      </select>
      <small>{selectedTemplate === 'any' ? 'Las tres alternativas probarán diferentes estructuras.' : ENCOUNTER_TEMPLATES[selectedTemplate].description}</small>
    </div>
    <button type="button" class="generate-random" disabled={generationRunning} on:click={generateThreeEncounters}>{generationRunning ? "Construyendo encuentros..." : "Generar 3 encuentros"}</button>
    {#if generationMessage}<p class="generation-message" role="status">{generationMessage}</p>{/if}
    {#if generatedEncounters.length}
      <div class="generated-grid">
        {#each generatedEncounters as encounter, index}
          <article class="generated-card">
            <div class="generated-card-heading"><strong>Alternativa {index + 1}</strong><span>{ENCOUNTER_TEMPLATES[encounter.template].label}</span></div>
            <p class="generated-template-description">{ENCOUNTER_TEMPLATES[encounter.template].description}</p>
            <div class="generated-creature-count">{encounter.creatures} {encounter.creatures === 1 ? 'criatura' : 'criaturas'}</div>
            <div class="generated-monsters">
              {#each encounter.items as item}
                <div><span>{item.monster.name}{#if item.quantity > 1} × {item.quantity}{/if}</span><small>VD {crValue(item.monster)} · {formatXp(monsterXp(item.monster) * item.quantity)}</small></div>
              {/each}
            </div>
            <div class="generated-total"><span>{formatXp(encounter.spent)} / {formatXp(budget)}</span><strong>{(encounter.spent / budget * 100).toFixed(1)} %</strong></div>
            {#if encounter.spent / budget < 0.97 || encounter.spent / budget > 1.03}
              <p class="generated-template-description">No fue posible acercarse más al 100 % manteniendo esta plantilla. Se muestra la composición más próxima encontrada.</p>
            {:else}
              <p class="generated-template-description budget-target-met">Objetivo de gasto alcanzado: dentro de ±3 % del presupuesto.</p>
            {/if}
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


