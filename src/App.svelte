<script lang="ts">
  import { onMount } from 'svelte';

  type Character = { id:string; name:string; species:string; className:string; level:number; background:string; alignment:string; abilities:Record<string,number>; notes:string };
  type Monster = { id:string; name:string; size:string; type:string; ac:number; hp:number; speed:string; abilities:Record<string,number>; traits:string; actions:string };
  const abilityNames = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
  const abilityKeys = ['str','dex','con','int','wis','cha'];
  const steps = [
    {title:'Identidad',description:'Nombre y datos básicos del aventurero'},
    {title:'Linaje',description:'Especie y rasgos de origen'},
    {title:'Clase',description:'Clase, nivel y capacidades'},
    {title:'Características',description:'Asigna libremente los valores de las seis características'},
    {title:'Trasfondo',description:'Trasfondo, competencias y detalles'},
    {title:'Equipo',description:'Armas, armadura, herramientas y objetos'},
    {title:'Magia',description:'Conjuros y recursos mágicos'},
    {title:'Personalidad',description:'Apariencia, ideales, vínculos y notas'}
  ];
  let view:'player'|'gm' = 'player';
  let page:'builder'|'sheet' = 'builder';
  let step = 0;
  let saved:Character[] = [];
  let monsters:Monster[] = [];
  let selectedCharacter = '';
  let selectedMonster = '';
  let name = '';
  let species = '';
  let className = '';
  let level = 1;
  let background = '';
  let alignment = '';
  let notes = '';
  let abilities:Record<string,number> = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  let monsterName = '';
  let monsterType = 'Humanoide';
  let monsterSize = 'Mediano';
  let monsterAC = 12;
  let monsterHP = 10;
  let monsterSpeed = '9 m';
  let monsterTraits = '';
  let monsterActions = '';
  let notice = '';

  onMount(() => {
    try {
      saved = JSON.parse(localStorage.getItem('forja-characters') || '[]');
      monsters = JSON.parse(localStorage.getItem('forja-monsters') || '[]');
    } catch { saved=[]; monsters=[]; }
  });
  $: current = saved.find(c=>c.id===selectedCharacter);
  $: currentMonster = monsters.find(m=>m.id===selectedMonster);
  function persist(){
    localStorage.setItem('forja-characters',JSON.stringify(saved));
    localStorage.setItem('forja-monsters',JSON.stringify(monsters));
  }
  function next(){ if(step<steps.length-1) step+=1; else saveCharacter(); }
  function previous(){ if(step>0) step-=1; }
  function saveCharacter(){
    const c:Character={id:crypto.randomUUID(),name:name.trim()||'Personaje sin nombre',species,className,level,background,alignment,abilities:{...abilities},notes};
    saved=[...saved,c]; selectedCharacter=c.id; persist(); page='sheet'; notice='Personaje guardado en este dispositivo.';
  }
  function openCharacter(c:Character){selectedCharacter=c.id;page='sheet';view='player';}
  function addMonster(){
    if(!monsterName.trim()) return;
    const m:Monster={id:crypto.randomUUID(),name:monsterName.trim(),size:monsterSize,type:monsterType,ac:Number(monsterAC),hp:Number(monsterHP),speed:monsterSpeed,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},traits:monsterTraits,actions:monsterActions};
    monsters=[...monsters,m]; selectedMonster=m.id; persist(); monsterName='';monsterTraits='';monsterActions='';notice='Bloque de estadísticas guardado.';
  }
  function deleteCharacter(id:string){saved=saved.filter(c=>c.id!==id);if(selectedCharacter===id){selectedCharacter='';page='builder';}persist();}
  function deleteMonster(id:string){monsters=monsters.filter(m=>m.id!==id);if(selectedMonster===id)selectedMonster='';persist();}
</script>

<svelte:head><title>Forja de Aventureros — D&D 2024</title></svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#inicio" on:click|preventDefault={()=>{view='player';page='builder';}}>
      <span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024</small></span>
    </a>
    <nav>
      <button class:active={view==='player'} on:click={()=>{view='player';page='builder';}}>Jugador</button>
      <button class:active={view==='gm'} on:click={()=>view='gm'}>Director de juego</button>
    </nav>
  </header>

  {#if view==='player'}
    {#if page==='builder'}
      <main class="main">
        <div class="eyebrow">TALLER DE PERSONAJES <span>01 / CREACIÓN</span></div>
        <h1>Forja tu <em>aventurero.</em></h1>
        <p class="intro">Completa tu hoja paso a paso. Puedes avanzar y retroceder entre secciones antes de guardar el personaje.</p>
        <div class="builder-layout">
          <aside class="step-list">
            {#each steps as s,i}
              <button class:chosen={step===i} class:done={step>i} on:click={()=>step=i}>
                <span class="step-number">{step>i?'✓':String(i+1).padStart(2,'0')}</span>
                <span><b>{s.title}</b><small>{s.description}</small></span>
              </button>
            {/each}
          </aside>
          <section class="panel">
            <div class="panel-top"><span>SECCIÓN {String(step+1).padStart(2,'0')} DE {steps.length}</span><span>{Math.round((step+1)/steps.length*100)}%</span></div>
            <div class="progress"><span style="width:{(step+1)/steps.length*100}%"></span></div>
            <h2>{steps[step].title}</h2><p class="muted">{steps[step].description}</p>
            {#if step===0}
              <label>Nombre del personaje<input bind:value={name} placeholder="Ej. Arannis Valebris" /></label>
              <div class="two"><label>Nivel<input type="number" min="1" max="20" bind:value={level} /></label><label>Alineamiento (opcional)<input bind:value={alignment} placeholder="Ej. Neutral bueno" /></label></div>
            {:else if step===1}
              <label>Especie<input bind:value={species} placeholder="Ej. Elfo, enano, humano..." /></label>
              <p class="hint">Escribe la especie y luego podremos incorporar sus opciones y rasgos oficiales del Manual del Jugador 2024.</p>
            {:else if step===2}
              <label>Clase<input bind:value={className} placeholder="Ej. Guerrero, mago, pícaro..." /></label>
              <p class="hint">La clase definirá posteriormente los rasgos, competencias, recursos y progresión del personaje.</p>
            {:else if step===3}
              <div class="free-note"><b>Distribución libre de características</b><span>No hay compra por puntos, presupuesto ni límite total impuesto por esta herramienta. Asigna cualquier valor a cada característica.</span></div>
              <div class="ability-grid">
                {#each abilityNames as label,i}
                  <label class="ability"><span>{label}</span><input type="number" bind:value={abilities[abilityKeys[i]]} /></label>
                {/each}
              </div>
            {:else if step===4}
              <label>Trasfondo<input bind:value={background} placeholder="Ej. Acólito, criminal, sabio..." /></label>
              <label>Competencias y rasgos adicionales<textarea bind:value={notes} rows="4" placeholder="Anota competencias, idiomas, rasgos y otros detalles..."></textarea></label>
            {:else if step===5}
              <label>Equipo y objetos<textarea bind:value={notes} rows="6" placeholder="Armas, armadura, escudo, herramientas, equipo..."></textarea></label>
            {:else if step===6}
              <label>Conjuros y recursos mágicos<textarea bind:value={notes} rows="6" placeholder="Trucos, conjuros preparados, espacios y otros recursos..."></textarea></label>
            {:else}
              <label>Notas del personaje<textarea bind:value={notes} rows="6" placeholder="Apariencia, personalidad, ideales, vínculos, defectos e historia..."></textarea></label>
            {/if}
            <div class="actions"><button class="secondary" on:click={previous} disabled={step===0}>Anterior</button><button class="primary" on:click={next}>{step===steps.length-1?'Guardar personaje':'Continuar'} <span>→</span></button></div>
          </section>
        </div>
        <section class="saved">
          <div class="section-heading"><div><div class="eyebrow">TU COLECCIÓN</div><h2>Personajes guardados</h2></div><span class="count">{saved.length}</span></div>
          {#if saved.length===0}<p class="muted">Todavía no has guardado personajes.</p>{:else}
            <div class="character-grid">{#each saved as c}
              <article class="character-card"><div class="card-symbol">✧</div><div><h3>{c.name}</h3><p>{c.species||'Sin especie'} · {c.className||'Sin clase'} · Nivel {c.level}</p></div><div class="card-actions"><button on:click={()=>openCharacter(c)}>Abrir hoja</button><button class="danger-text" on:click={()=>deleteCharacter(c.id)}>Eliminar</button></div></article>
            {/each}</div>
          {/if}
        </section>
      </main>
    {:else if current}
      <main class="main">
        <button class="back-link" on:click={()=>page='builder'}>← Volver al taller</button>
        <div class="eyebrow">HOJA DE PERSONAJE</div><h1>{current.name}</h1>
        <p class="intro">{current.species||'Especie pendiente'} · {current.className||'Clase pendiente'} · Nivel {current.level}</p>
        <section class="panel sheet-panel">
          <div class="sheet-head"><div><span class="eyebrow">CARACTERÍSTICAS</span><h2>Valores del personaje</h2></div><span class="free-tag">Distribución libre</span></div>
          <div class="ability-grid sheet-abilities">{#each abilityNames as label,i}<div class="ability-score"><small>{label}</small><b>{current.abilities[abilityKeys[i]]}</b><span>{Math.floor((current.abilities[abilityKeys[i]]-10)/2)>=0?'+':''}{Math.floor((current.abilities[abilityKeys[i]]-10)/2)}</span></div>{/each}</div>
          <div class="sheet-details"><div><small>TRASFONDO</small><b>{current.background||'—'}</b></div><div><small>ALINEAMIENTO</small><b>{current.alignment||'—'}</b></div></div>
          <div class="sheet-notes"><small>NOTAS Y DETALLES</small><p>{current.notes||'Sin notas todavía.'}</p></div>
        </section>
      </main>
    {/if}
  {:else}
    <main class="main">
      <div class="eyebrow">ESPACIO DEL DIRECTOR DE JUEGO <span>02 / CAMPAÑA</span></div>
      <h1>Panel del <em>director.</em></h1>
      <p class="intro">Consulta las hojas de los jugadores y crea una biblioteca de bloques de estadísticas para tus monstruos.</p>
      <div class="gm-columns">
        <section class="panel">
          <div class="section-heading"><div><div class="eyebrow">GRUPO DE JUGADORES</div><h2>Hojas de personaje</h2></div><span class="count">{saved.length}</span></div>
          {#if saved.length===0}<p class="muted">Las hojas creadas en este dispositivo aparecerán aquí.</p>{:else}
            {#each saved as c}<button class="gm-row" on:click={()=>{selectedCharacter=c.id;view='player';page='sheet';}}><span class="avatar">✧</span><span><b>{c.name}</b><small>{c.species} · {c.className} · Nivel {c.level}</small></span><span class="arrow">↗</span></button>{/each}
          {/if}
        </section>
        <section class="panel">
          <div class="section-heading"><div><div class="eyebrow">BESTIARIO PERSONAL</div><h2>Crear monstruo</h2></div><span class="count">{monsters.length}</span></div>
          <label>Nombre<input bind:value={monsterName} placeholder="Nombre de la criatura" /></label>
          <div class="two"><label>Tamaño<select bind:value={monsterSize}><option>Menudo</option><option>Pequeño</option><option>Mediano</option><option>Grande</option><option>Enorme</option><option>Gargantuesco</option></select></label><label>Tipo<input bind:value={monsterType} /></label></div>
          <div class="three"><label>CA<input type="number" bind:value={monsterAC}/></label><label>PG<input type="number" bind:value={monsterHP}/></label><label>Velocidad<input bind:value={monsterSpeed}/></label></div>
          <label>Rasgos<textarea rows="3" bind:value={monsterTraits} placeholder="Rasgos especiales..."></textarea></label>
          <label>Acciones<textarea rows="3" bind:value={monsterActions} placeholder="Ataques y acciones..."></textarea></label>
          <button class="primary full" on:click={addMonster} disabled={!monsterName.trim()}>Guardar bloque de estadísticas</button>
        </section>
      </div>
      <section class="saved">
        <div class="section-heading"><div><div class="eyebrow">BESTIARIO</div><h2>Monstruos guardados</h2></div><span class="count">{monsters.length}</span></div>
        {#if monsters.length===0}<p class="muted">Aún no hay monstruos creados.</p>{:else}
          <div class="monster-grid">{#each monsters as m}
            <article class="monster-card"><div class="monster-top"><span class="eyebrow">{m.size} · {m.type}</span><button class="danger-text" on:click={()=>deleteMonster(m.id)}>Eliminar</button></div><h3>{m.name}</h3><div class="monster-stats"><span>CA <b>{m.ac}</b></span><span>PG <b>{m.hp}</b></span><span>Vel. <b>{m.speed}</b></span></div>{#if m.traits}<p><b>Rasgos.</b> {m.traits}</p>{/if}{#if m.actions}<p><b>Acciones.</b> {m.actions}</p>{/if}</article>
          {/each}</div>
        {/if}
      </section>
    </main>
  {/if}
  {#if notice}<div class="toast" on:click={()=>notice=''}>{notice} <span>×</span></div>{/if}
  <footer><span>FORJA DE AVENTUREROS</span><span>Herramienta de creación · D&D 2024</span></footer>
</div>