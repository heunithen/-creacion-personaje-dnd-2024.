<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';

  type Character = {
    id: string; name: string; playerName: string; species: string; speciesTraits: string;
    className: string; classTraits: string; level: string; ac: string; hp: string; speed: string;
    abilities: Record<string,string>; background: string; proficiencies: string; equipment: string;
    spells: string; features: string; personality: string; notes: string; updatedAt: string;
  };
  type Monster = { id:string; name:string; size:string; type:string; ac:string; hp:string; speed:string; traits:string; actions:string; notes:string };
  type RoomCharacter = { playerId:string; playerName:string; character:Character };
  const KEY = 'com.heunithen.dnd2024-character-builder/character';
  const CHANNEL = 'com.heunithen.dnd2024-character-builder/character-sync';
  const stats = [{key:'str',label:'Fuerza'},{key:'dex',label:'Destreza'},{key:'con',label:'Constitución'},{key:'int',label:'Inteligencia'},{key:'wis',label:'Sabiduría'},{key:'cha',label:'Carisma'}];

  function blankCharacter(): Character {
    return {id:crypto.randomUUID(),name:'',playerName:'',species:'',speciesTraits:'',className:'',classTraits:'',level:'',ac:'',hp:'',speed:'',
      abilities:{str:'',dex:'',con:'',int:'',wis:'',cha:''},background:'',proficiencies:'',equipment:'',spells:'',features:'',personality:'',notes:'',updatedAt:''};
  }
  let view:'player'|'gm' = 'player';
  let character = blankCharacter();
  let saved:Character[] = [];
  let monsters:Monster[] = [];
  let roomCharacters:RoomCharacter[] = [];
  let editingId = '';
  let notice = '';
  let obrReady = false;
  let obrRole = '';
  let playerName = '';
  let syncStatus = 'Owlbear Rodeo no está conectado.';

  function persistLocal() {
    localStorage.setItem('forja-characters', JSON.stringify(saved));
    localStorage.setItem('forja-monsters', JSON.stringify(monsters));
  }
  function readRoomPlayers(players:any[]) {
    roomCharacters = players.flatMap((p:any) => {
      const payload = p.metadata?.[KEY];
      if (!payload || payload.deleted || !payload.character) return [];
      return [{playerId:p.id, playerName:p.name || payload.playerName || 'Jugador', character:payload.character}];
    });
  }
  async function refreshRoomPlayers() {
    try { readRoomPlayers(await OBR.party.getPlayers()); } catch { /* sala todavía no disponible */ }
  }
  async function publishCharacter(c:Character) {
    if (!obrReady || obrRole !== 'PLAYER') return;
    try {
      const playerId = await OBR.player.getId();
      const currentPlayerName = await OBR.player.getName();
      const payload = {...c, playerName:currentPlayerName};
      await OBR.player.setMetadata({[KEY]:{character:payload, playerName:currentPlayerName, updatedAt:payload.updatedAt}});
      await OBR.broadcast.sendMessage(CHANNEL,{type:'character-updated',playerId,playerName:currentPlayerName,character:payload});
      syncStatus = 'Ficha sincronizada con la sala.';
    } catch {
      syncStatus = 'No se pudo sincronizar. Comprueba que la extensión esté habilitada en la sala.';
    }
  }
  async function removeRoomCharacter(id:string) {
    if (!obrReady || obrRole !== 'PLAYER') return;
    try {
      const playerId = await OBR.player.getId();
      const currentPlayerName = await OBR.player.getName();
      await OBR.player.setMetadata({[KEY]:{deleted:true,playerName:currentPlayerName,deletedId:id}});
      await OBR.broadcast.sendMessage(CHANNEL,{type:'character-deleted',playerId,playerName:currentPlayerName});
    } catch { syncStatus = 'No se pudo retirar la ficha de la sala.'; }
  }
  onMount(() => {
    try {
      saved = JSON.parse(localStorage.getItem('forja-characters') || '[]');
      monsters = JSON.parse(localStorage.getItem('forja-monsters') || '[]');
    } catch { saved=[]; monsters=[]; }
    if (OBR.isAvailable) {
      OBR.onReady(async () => {
        obrReady = true;
        try {
          obrRole = await OBR.player.getRole();
          playerName = await OBR.player.getName();
          syncStatus = 'Conectado a Owlbear Rodeo como ' + (obrRole === 'GM' ? 'Director de juego.' : 'Jugador.');
          await refreshRoomPlayers();
          OBR.party.onChange((players:any[]) => readRoomPlayers(players));
          OBR.broadcast.onMessage(CHANNEL,(event:any) => {
            const data = event.data;
            if (data?.type === 'character-updated' && data.character) {
              roomCharacters = [...roomCharacters.filter(c=>c.playerId!==data.playerId),{playerId:data.playerId,playerName:data.playerName||'Jugador',character:data.character}];
            } else if (data?.type === 'character-deleted') {
              roomCharacters = roomCharacters.filter(c=>c.playerId!==data.playerId);
            }
          });
        } catch { syncStatus = 'Owlbear está abierto, pero no se pudo leer la sala.'; }
      });
    }
  });
  function saveCharacter() {
    character = {...character, name:character.name.trim(), playerName:playerName || character.playerName, updatedAt:new Date().toISOString()};
    if (!character.name) { notice='Escribe el nombre del personaje.'; return; }
    if (editingId) saved = saved.map(c=>c.id===editingId?{...character,id:editingId}:c);
    else { character={...character,id:crypto.randomUUID()}; saved=[...saved,character]; }
    editingId=character.id;
    persistLocal();
    publishCharacter(character);
    notice='Ficha guardada.';
  }
  function newCharacter() { character=blankCharacter(); editingId=''; view='player'; }
  function editCharacter(c:Character) { character={...blankCharacter(),...c,abilities:{...blankCharacter().abilities,...c.abilities}}; editingId=c.id; view='player'; }
  function deleteCharacter(c:Character) {
    saved=saved.filter(x=>x.id!==c.id);
    if(editingId===c.id){editingId='';character=blankCharacter();}
    persistLocal(); removeRoomCharacter(c.id); notice='Ficha eliminada.';
  }
  function addMonster() {
    if(!monster.name.trim()){notice='Escribe el nombre del monstruo.';return;}
    monsters=[...monsters,{...monster,id:crypto.randomUUID()}];
    persistLocal(); monster={name:'',size:'',type:'',ac:'',hp:'',speed:'',traits:'',actions:'',notes:''}; notice='Bloque de estadísticas guardado.';
  }
  let monster:Omit<Monster,'id'>={name:'',size:'',type:'',ac:'',hp:'',speed:'',traits:'',actions:'',notes:''};
  function deleteMonster(id:string){monsters=monsters.filter(m=>m.id!==id);persistLocal();}
  function showRoomCharacter(c:RoomCharacter){character=c.character;editingId='';view='player';}
</script>

<svelte:head><title>Forja de Aventureros — D&D 2024</title></svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#inicio" on:click|preventDefault={()=>{view='player';newCharacter();}}>
      <span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024</small></span>
    </a>
    <nav>
      <button class:active={view==='player'} on:click={()=>view='player'}>Jugador</button>
      <button class:active={view==='gm'} on:click={()=>view='gm'}>Director de juego</button>
    </nav>
  </header>

  <main class="main">
    <div class="connection"><span class:connected={obrReady}></span>{syncStatus}</div>
    {#if view==='player'}
      <div class="eyebrow">HOJA DE PERSONAJE <span>ENTRADA MANUAL</span></div>
      <h1>Forja tu <em>aventurero.</em></h1>
      <p class="intro">Introduce cada dato manualmente. No hay listas de opciones, valores predeterminados ni cálculos automáticos.</p>
      <section class="panel form-panel">
        <div class="section-heading"><div><div class="eyebrow">IDENTIDAD</div><h2>Datos generales</h2></div><span class="free-tag">Todo editable</span></div>
        <label>Nombre del personaje<input bind:value={character.name} placeholder="Escribe el nombre" /></label>
        <div class="two">
          <label>Jugador<input bind:value={character.playerName} placeholder="Nombre del jugador" /></label>
          <label>Nivel<input bind:value={character.level} placeholder="Escribe el nivel" /></label>
        </div>
        <label>Especie<textarea rows="2" bind:value={character.species} placeholder="Escribe el nombre de la especie"></textarea></label>
        <label>Rasgos de especie<textarea rows="4" bind:value={character.speciesTraits} placeholder="Escribe aquí todos los rasgos y capacidades de la especie"></textarea></label>
        <label>Clase<textarea rows="2" bind:value={character.className} placeholder="Escribe el nombre de la clase"></textarea></label>
        <label>Rasgos y capacidades de clase<textarea rows="5" bind:value={character.classTraits} placeholder="Escribe los rasgos, capacidades, recursos y características de la clase"></textarea></label>
        <div class="two">
          <label>Clase de Armadura (CA)<input bind:value={character.ac} placeholder="Introduce la CA" /></label>
          <label>Puntos de Golpe (PG)<input bind:value={character.hp} placeholder="Introduce los PG actuales y/o máximos" /></label>
        </div>
        <label>Velocidad<input bind:value={character.speed} placeholder="Introduce la velocidad" /></label>

        <div class="section-heading subheading"><div><div class="eyebrow">CARACTERÍSTICAS</div><h2>Valores manuales</h2></div></div>
        <p class="hint">Escribe cada valor directamente. La aplicación no calcula modificadores ni aplica bonificadores.</p>
        <div class="ability-grid">
          {#each stats as stat}
            <label class="ability"><span>{stat.label}</span><input bind:value={character.abilities[stat.key]} placeholder="Valor" /></label>
          {/each}
        </div>

        <div class="section-heading subheading"><div><div class="eyebrow">OTROS DATOS</div><h2>Información adicional</h2></div></div>
        <label>Trasfondo<textarea rows="3" bind:value={character.background} placeholder="Escribe el trasfondo y sus detalles"></textarea></label>
        <label>Competencias e idiomas<textarea rows="4" bind:value={character.proficiencies} placeholder="Escribe competencias, habilidades, herramientas e idiomas"></textarea></label>
        <label>Equipo y objetos<textarea rows="5" bind:value={character.equipment} placeholder="Escribe armas, armaduras, herramientas y objetos"></textarea></label>
        <label>Conjuros y recursos mágicos<textarea rows="5" bind:value={character.spells} placeholder="Escribe conjuros, espacios y recursos mágicos"></textarea></label>
        <label>Otros rasgos y capacidades<textarea rows="5" bind:value={character.features} placeholder="Escribe cualquier otro rasgo, capacidad o regla del personaje"></textarea></label>
        <label>Personalidad, apariencia e historia<textarea rows="4" bind:value={character.personality} placeholder="Escribe la personalidad, apariencia, ideales, vínculos e historia"></textarea></label>
        <label>Notas<textarea rows="4" bind:value={character.notes} placeholder="Cualquier información adicional"></textarea></label>
        <div class="actions">
          <button class="secondary" on:click={newCharacter}>Nueva ficha</button>
          <button class="primary" on:click={saveCharacter}>Guardar ficha</button>
        </div>
      </section>
      <section class="saved">
        <div class="section-heading"><div><div class="eyebrow">ALMACENAMIENTO LOCAL</div><h2>Mis fichas</h2></div><span class="count">{saved.length}</span></div>
        {#if saved.length===0}<p class="muted">Todavía no hay fichas guardadas en este dispositivo.</p>{:else}
          <div class="character-grid">{#each saved as c}
            <article class="character-card"><div class="card-symbol">✧</div><div><h3>{c.name}</h3><p>{c.species||'Especie sin indicar'} · {c.className||'Clase sin indicar'}</p></div><div class="card-actions"><button on:click={()=>editCharacter(c)}>Editar</button><button class="danger-text" on:click={()=>deleteCharacter(c)}>Eliminar</button></div></article>
          {/each}</div>
        {/if}
      </section>
    {:else}
      <div class="eyebrow">ESPACIO DEL DIRECTOR DE JUEGO <span>SINCRONIZACIÓN DE SALA</span></div>
      <h1>Panel del <em>director.</em></h1>
      <p class="intro">Las fichas que los jugadores publiquen desde la extensión de Owlbear Rodeo aparecerán aquí y se actualizarán al recibir cambios.</p>
      <section class="panel">
        <div class="section-heading"><div><div class="eyebrow">SALA ACTUAL</div><h2>Personajes de los jugadores</h2></div><span class="count">{roomCharacters.length}</span></div>
        {#if !obrReady}
          <p class="muted">Abre esta aplicación desde la extensión dentro de una sala de Owlbear Rodeo para recibir las fichas de los jugadores.</p>
        {:else if roomCharacters.length===0}
          <p class="muted">Todavía no se ha recibido ninguna ficha de jugador en esta sala.</p>
        {:else}
          <div class="character-grid">{#each roomCharacters as item}
            <article class="character-card"><div class="card-symbol">✧</div><div><h3>{item.character.name}</h3><p>Jugador: {item.playerName} · {item.character.species} · {item.character.className}</p><p>CA: {item.character.ac||'—'} · PG: {item.character.hp||'—'} · Nivel: {item.character.level||'—'}</p></div><div class="card-actions"><button on:click={()=>showRoomCharacter(item)}>Ver ficha</button></div></article>
          {/each}</div>
        {/if}
      </section>
      <section class="panel monster-panel">
        <div class="section-heading"><div><div class="eyebrow">BESTIARIO PERSONAL</div><h2>Crear bloque de estadísticas</h2></div><span class="count">{monsters.length}</span></div>
        <p class="hint">Todos los datos del monstruo también se introducen manualmente.</p>
        <label>Nombre<input bind:value={monster.name} placeholder="Escribe el nombre" /></label>
        <div class="two"><label>Tamaño<input bind:value={monster.size} placeholder="Escribe el tamaño" /></label><label>Tipo<input bind:value={monster.type} placeholder="Escribe el tipo" /></label></div>
        <div class="two"><label>Clase de Armadura (CA)<input bind:value={monster.ac} placeholder="Introduce la CA" /></label><label>Puntos de Golpe (PG)<input bind:value={monster.hp} placeholder="Introduce los PG" /></label></div>
        <label>Velocidad<input bind:value={monster.speed} placeholder="Introduce la velocidad" /></label>
        <label>Rasgos<textarea rows="4" bind:value={monster.traits} placeholder="Escribe los rasgos especiales"></textarea></label>
        <label>Acciones<textarea rows="4" bind:value={monster.actions} placeholder="Escribe las acciones y ataques"></textarea></label>
        <label>Notas<textarea rows="3" bind:value={monster.notes} placeholder="Información adicional"></textarea></label>
        <button class="primary full" on:click={addMonster}>Guardar bloque</button>
      </section>
      <section class="saved">
        <div class="section-heading"><div><div class="eyebrow">BESTIARIO</div><h2>Monstruos guardados</h2></div><span class="count">{monsters.length}</span></div>
        {#if monsters.length===0}<p class="muted">Aún no hay monstruos guardados.</p>{:else}
          <div class="monster-grid">{#each monsters as m}
            <article class="monster-card"><div class="monster-top"><span class="eyebrow">{m.size} · {m.type}</span><button class="danger-text" on:click={()=>deleteMonster(m.id)}>Eliminar</button></div><h3>{m.name}</h3><div class="monster-stats"><span>CA <b>{m.ac||'—'}</b></span><span>PG <b>{m.hp||'—'}</b></span><span>Vel. <b>{m.speed||'—'}</b></span></div>{#if m.traits}<p><b>Rasgos.</b> {m.traits}</p>{/if}{#if m.actions}<p><b>Acciones.</b> {m.actions}</p>{/if}{#if m.notes}<p>{m.notes}</p>{/if}</article>
          {/each}</div>
        {/if}
      </section>
    {/if}
  </main>
  {#if notice}<button class="toast" on:click={()=>notice=''}>{notice} <span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS</span><span>Herramienta manual · D&D 2024</span></footer>
</div>