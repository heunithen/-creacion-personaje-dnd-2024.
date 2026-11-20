<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';

  type Character = {
    id:string; name:string; playerName:string; species:string; speciesTraits:string;
    className:string; classTraits:string; level:string; ac:string; hp:string; speed:string;
    abilities:Record<string,string>; abilityChecks:string; background:string; proficiencies:string; savingThrows:string;
    skills:string; attacks:string; initiative:string; passivePerception:string; spellAttack:string;
    spellSaveDc:string; equipment:string; spells:string; features:string; personality:string;
    alignment:string; experience:string; notes:string; updatedAt:string;
  };
  type Monster = {id:string;name:string;size:string;type:string;ac:string;hp:string;speed:string;traits:string;actions:string;notes:string;rawBlock?:string};
  type RoomCharacter = {playerId:string;playerName:string;character:Character};
  type RollChoice = {label:string;category:string;notation:string;detail:string};
  type RollEntry = {id:string;playerName:string;characterName:string;label:string;notation:string;total?:number;summary?:string;status:string;timestamp:number};
  const KEY='com.heunithen.dnd2024-character-builder/character';
  const CHANNEL='com.heunithen.dnd2024-character-builder/character-sync';
  const ROLL_CHANNEL='com.heunithen.dnd2024-character-builder/roll-log';
  const DICE_SOURCE='com.heunithen.dnd2024-character-builder';
  const DICE_RESULT=DICE_SOURCE+'/roll-result';
  const DICE_ERROR=DICE_SOURCE+'/roll-error';
  const DICE_READY='dice-plus/isReady';
  const stats=[{key:'str',label:'Fuerza'},{key:'dex',label:'Destreza'},{key:'con',label:'Constitución'},{key:'int',label:'Inteligencia'},{key:'wis',label:'Sabiduría'},{key:'cha',label:'Carisma'}];
  const abilityNames:Record<string,string>={Fuerza:'str',Destreza:'dex',Constitución:'con',Inteligencia:'int',Sabiduría:'wis',Carisma:'cha'};
  function blankCharacter():Character {
    return {id:crypto.randomUUID(),name:'',playerName:'',species:'',speciesTraits:'',className:'',classTraits:'',level:'',ac:'',hp:'',speed:'',
      abilities:{str:'',dex:'',con:'',int:'',wis:'',cha:''},abilityChecks:'',background:'',proficiencies:'',savingThrows:'',skills:'',attacks:'',
      initiative:'',passivePerception:'',spellAttack:'',spellSaveDc:'',equipment:'',spells:'',features:'',personality:'',
      alignment:'',experience:'',notes:'',updatedAt:''};
  }
  let view:'player'|'gm'='player';
  let playerTab:'character'|'rolls'='character';
  let gmTab:'characters'|'bestiary'='characters';
  let character=blankCharacter();
  let saved:Character[]=[];
  let monsters:Monster[]=[];
  let roomCharacters:RoomCharacter[]=[];
  let editingId='';
  let editingRoomPlayerId='';
  let notice='';
  let obrReady=false;
  let obrRole='';
  let playerName='';
  let syncStatus='Owlbear Rodeo no está conectado.';
  let importOpen=false;
  let importText='';
  let rollCategory='Habilidad';
  let selectedRoll='';
  let customNotation='1d20';
  let diceReady=false;
  let rollBusy=false;
  let rollLog:RollEntry[]=[];
  let pendingRolls:Record<string,{label:string;notation:string;characterName:string}>={};
  let skillChoices:RollChoice[]=[];
  let saveChoices:RollChoice[]=[];
  let abilityChoices:RollChoice[]=[];
  let attackChoices:RollChoice[]=[];
  let spellChoices:RollChoice[]=[];
  let initiativeChoices:RollChoice[]=[];
  let rollChoices:RollChoice[]=[];
  let categoryChoices:RollChoice[]=[];
  let monster:Omit<Monster,'id'>={name:'',size:'',type:'',ac:'',hp:'',speed:'',traits:'',actions:'',notes:''};
  let monsterImportOpen=false;
  let monsterImportText='';

  $: skillChoices=parseNamedModifiers(character.skills,'Habilidad');
  $: saveChoices=parseNamedModifiers(character.savingThrows,'Salvación');
  $: abilityChoices=parseNamedModifiers(character.abilityChecks,'Característica');
  $: attackChoices=parseAttacks(character.attacks);
  $: spellChoices=character.spells.trim() && character.spellAttack!=='' ? [{label:'Ataque de conjuro',category:'Conjuro',notation:'1d20'+signedModifier(character.spellAttack),detail:'Bonificador '+character.spellAttack }]:[];
  $: initiativeChoices=character.initiative!==''?[{label:'Iniciativa',category:'Iniciativa',notation:'1d20'+signedModifier(character.initiative),detail:'Modificador '+character.initiative}]:[];
  $: rollChoices=[...skillChoices,...saveChoices,...abilityChoices,...attackChoices,...spellChoices,...initiativeChoices].filter(x=>x.notation);
  $: categoryChoices=rollChoices.filter(x=>x.category===rollCategory);
  $: if(!categoryChoices.some(x=>x.label===selectedRoll)) selectedRoll=categoryChoices[0]?.label||'';

  function signedModifier(value:string){const n=Number(String(value).replace(/[^+\-\d.]/g,''));return Number.isFinite(n)?(n>=0?'+':'')+n:'';}
  function parseNamedModifiers(source:string,category:string):RollChoice[]{
    return source.split(/\n|;/).map(line=>{
      const m=line.match(/^\s*(.+?)\s*[:—-]\s*([+-]?\d+)\s*$/);
      if(!m)return null;
      return {label:m[1].trim(),category,notation:'1d20'+(Number(m[2])>=0?'+':'')+Number(m[2]),detail:m[1].trim()+' '+m[2]};
    }).filter(Boolean) as RollChoice[];
  }
  function parseAttacks(source:string):RollChoice[]{
    return source.split(/\n(?=[^\n])/).map(line=>{
      const name=line.match(/^\s*([^.:\n]+)[.:]/)?.[1]?.trim();
      const bonus=line.match(/([+-]\d+)\s+to hit/i)?.[1];
      const damage=line.match(/Hit:\s*((?:\d+)?d\d+(?:[+-]\d+)?)/i)?.[1];
      if(!name||!bonus)return null;
      const notation=damage?'1d20'+bonus+', '+damage:'1d20'+bonus;
      return {label:name,category:'Ataque',notation,detail:'Ataque '+bonus+(damage?' · Daño '+damage:'')};
    }).filter(Boolean) as RollChoice[];
  }
  function persistLocal(){localStorage.setItem('forja-characters',JSON.stringify(saved));localStorage.setItem('forja-monsters',JSON.stringify(monsters));}
  function readRoomPlayers(players:any[]){
    roomCharacters=players.flatMap((p:any)=>{const payload=p.metadata?.[KEY];if(!payload||payload.deleted||!payload.character)return[];return[{playerId:p.id,playerName:p.name||payload.playerName||'Jugador',character:payload.character}];});
  }
  async function refreshRoomPlayers(){try{readRoomPlayers(await OBR.party.getPlayers());}catch{}}
  async function publishCharacter(c:Character){
    if(!obrReady||obrRole!=='PLAYER')return;
    try{const id=await OBR.player.getId();const name=await OBR.player.getName();const payload={...c,playerName:name};
      await OBR.player.setMetadata({[KEY]:{character:payload,playerName:name,updatedAt:payload.updatedAt}});
      await OBR.broadcast.sendMessage(CHANNEL,{type:'character-updated',playerId:id,playerName:name,character:payload},{destination:'ALL'});
      syncStatus='Ficha sincronizada con la sala.';
    }catch{syncStatus='No se pudo sincronizar la ficha.';}
  }
  async function requestDiceReady():Promise<boolean>{
    if(!obrReady)return false;
    const requestId=crypto.randomUUID();
    return new Promise(resolve=>{
      const off=OBR.broadcast.onMessage(DICE_READY,(event:any)=>{if(event.data?.ready&&event.data.requestId===requestId){off();diceReady=true;resolve(true);}});
      OBR.broadcast.sendMessage(DICE_READY,{requestId,timestamp:Date.now()},{destination:'ALL'});
      setTimeout(()=>{off();resolve(false);},1200);
    });
  }
  onMount(()=>{
    try{saved=JSON.parse(localStorage.getItem('forja-characters')||'[]');monsters=JSON.parse(localStorage.getItem('forja-monsters')||'[]');rollLog=JSON.parse(localStorage.getItem('forja-roll-history')||'[]');}
    catch{saved=[];monsters=[];rollLog=[];}
    if(OBR.isAvailable)OBR.onReady(async()=>{
      obrReady=true;
      try{
        obrRole=await OBR.player.getRole();playerName=await OBR.player.getName();
        syncStatus='Conectado a Owlbear Rodeo como '+(obrRole==='GM'?'Director de juego.':'Jugador.');
        await refreshRoomPlayers();
        OBR.party.onChange((players:any[])=>readRoomPlayers(players));
        OBR.broadcast.onMessage(CHANNEL,async(event:any)=>{
          const d=event.data;
          if(d?.type==='character-updated'&&d.character)roomCharacters=[...roomCharacters.filter(c=>c.playerId!==d.playerId),{playerId:d.playerId,playerName:d.playerName||'Jugador',character:d.character}];
          if(d?.type==='character-deleted')roomCharacters=roomCharacters.filter(c=>c.playerId!==d.playerId);
          if(d?.type==='character-edited'&&d.character){
            roomCharacters=[...roomCharacters.filter(c=>c.playerId!==d.playerId),{playerId:d.playerId,playerName:d.playerName||'Jugador',character:d.character}];
            if(obrRole==='PLAYER'&&d.playerId===await OBR.player.getId()){
              character=d.character;editingId=character.id;saved=saved.map(c=>c.id===character.id?character:c);persistLocal();
              await OBR.player.setMetadata({[KEY]:{character,playerName,updatedAt:character.updatedAt}});
            }
          }
        });
        OBR.broadcast.onMessage(ROLL_CHANNEL,(event:any)=>{const d=event.data;if(d?.entry&& !rollLog.some(x=>x.id===d.entry.id)){rollLog=[d.entry,...rollLog].slice(0,100);localStorage.setItem('forja-roll-history',JSON.stringify(rollLog));}});
        OBR.broadcast.onMessage(DICE_RESULT,(event:any)=>handleDiceResult(event.data));
        OBR.broadcast.onMessage(DICE_ERROR,(event:any)=>handleDiceError(event.data));
        diceReady=await requestDiceReady();
      }catch{syncStatus='Owlbear está abierto, pero no se pudo leer la sala.';}
    });
  });
  function saveCharacter(){
    character={...character,name:character.name.trim(),playerName:editingRoomPlayerId?(roomCharacters.find(x=>x.playerId===editingRoomPlayerId)?.playerName||character.playerName):(playerName||character.playerName),updatedAt:new Date().toISOString()};
    if(!character.name){notice='Escribe el nombre del personaje.';return;}
    if(editingRoomPlayerId){
      const updated={...character};
      roomCharacters=roomCharacters.map(x=>x.playerId===editingRoomPlayerId?{...x,character:updated}:x);
      OBR.broadcast.sendMessage(CHANNEL,{type:'character-edited',playerId:editingRoomPlayerId,playerName:roomCharacters.find(x=>x.playerId===editingRoomPlayerId)?.playerName||'Jugador',character:updated},{destination:'ALL'});
      notice='Cambios enviados al jugador y a la sala.';return;
    }
    if(editingId)saved=saved.map(c=>c.id===editingId?{...character,id:editingId}:c);
    else{character={...character,id:crypto.randomUUID()};saved=[...saved,character];}
    editingId=character.id;persistLocal();publishCharacter(character);notice='Ficha guardada.';
  }
  function newCharacter(){character=blankCharacter();editingId='';editingRoomPlayerId='';view='player';playerTab='character';}
  function editCharacter(c:Character){character={...blankCharacter(),...c,abilities:{...blankCharacter().abilities,...c.abilities}};editingId=c.id;editingRoomPlayerId='';view='player';playerTab='character';}
  function editRoomCharacter(c:RoomCharacter){character={...blankCharacter(),...c.character,abilities:{...blankCharacter().abilities,...c.character.abilities}};editingId=c.character.id;editingRoomPlayerId=c.playerId;view='player';playerTab='character';}
  function deleteCharacter(c:Character){saved=saved.filter(x=>x.id!==c.id);if(editingId===c.id){editingId='';character=blankCharacter();}persistLocal();notice='Ficha eliminada.';}
  function addMonster(){if(!monster.name.trim()){notice='Escribe el nombre del monstruo.';return;}monsters=[...monsters,{...monster,id:crypto.randomUUID()}];persistLocal();monster={name:'',size:'',type:'',ac:'',hp:'',speed:'',traits:'',actions:'',notes:''};notice='Bloque de estadísticas guardado.';}
  function deleteMonster(id:string){monsters=monsters.filter(m=>m.id!==id);persistLocal();}
  function importMonster(){
    const t=monsterImportText.replace(/\r/g,'').trim();
    if(!t){notice='Pega el bloque de estadísticas del monstruo.';return;}
    const lines=t.split('\n').map(x=>x.trim()).filter(Boolean);
    const m:Omit<Monster,'id'>={name:lines[0]||'',size:'',type:'',ac:'',hp:'',speed:'',traits:'',actions:'',notes:''};
    const sizeType=lines.find(x=>/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+/.test(x));
    if(sizeType){const match=sizeType.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(.+?)(?:,|$)/);if(match){m.size=match[1];m.type=match[2];}}
    m.ac=t.match(/Armor Class\s+(\d+)/i)?.[1]||'';
    m.hp=t.match(/Hit Points\s+(\d+)/i)?.[1]||'';
    m.speed=t.match(/Speed\s+([^\n]+)/i)?.[1]||'';
    const sections=t.split(/\n(?=Traits\b|Actions\b|Bonus Actions\b|Reactions\b|Legendary Actions\b)/i);
    const traitSection=sections.find(x=>/^Traits\b/i.test(x.trim()))||'';
    const actionSections=sections.filter(x=>/^(?:Actions|Bonus Actions|Reactions|Legendary Actions)\b/i.test(x.trim()));
    m.traits=traitSection.replace(/^Traits\s*/i,'').trim();
    m.actions=actionSections.map(x=>x.replace(/^(?:Actions|Bonus Actions|Reactions|Legendary Actions)\s*/i,'').trim()).filter(Boolean).join('\n\n');
    m.notes=lines.filter(line=>line!==m.name&&line!==sizeType&&!/^(Armor Class|Hit Points|Speed|STR|DEX|CON|INT|WIS|CHA|Saving Throws|Skills|Senses|Languages|Challenge|Traits|Actions|Bonus Actions|Reactions|Legendary Actions)\b/i.test(line)).join('\n');
    m.rawBlock=t;
    monsters=[...monsters,{...m,id:crypto.randomUUID()}];persistLocal();monsterImportText='';monsterImportOpen=false;notice='Monstruo importado. Revisa el bloque antes de usarlo.';
  }
  function showRoomCharacter(c:RoomCharacter){editRoomCharacter(c);}
  function section(text:string,start:string,end:string){const a=text.indexOf(start);if(a<0)return'';const from=a+start.length;const b=end?text.indexOf(end,from):-1;return text.slice(from,b<0?undefined:b).trim();}
  function importCharacter(){
    const t=importText.replace(/\r/g,'');
    if(!t.trim()){notice='Pega el texto del personaje.';return;}
    const c=blankCharacter();
    c.name=t.match(/^Name:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.species=t.match(/^Race\/Ancestry\/Heritage:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.className=t.match(/^Class\s*&\s*Level:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.level=c.className.match(/\b(\d+)\s*$/)?.[1]||'';
    c.background=t.match(/^Background:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.alignment=t.match(/^Alignment:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.experience=t.match(/^Experience:\s*(.+)$/mi)?.[1]?.trim()||'';
    c.ac=t.match(/Armor Class\s+(\d+)/i)?.[1]||'';
    c.hp=t.match(/(\d+)\s+hit points/i)?.[1]||'';
    c.speed=t.match(/(\d+\s*ft\.?\s*Speed)/i)?.[1]?.replace(/\s*Speed/i,'')||'';
    c.initiative=t.match(/([+-]\d+)\s+Initiative Modifier/i)?.[1]||'';
    c.passivePerception=t.match(/(\d+)\s+Passive Perception/i)?.[1]||'';
    c.spellAttack=t.match(/spell attack bonus is\s*([+-]?\d+)/i)?.[1]||'';
    c.spellSaveDc=t.match(/Spell Save is DC\s*(\d+)/i)?.[1]||'';
    for(const [name,key] of Object.entries(abilityNames)){const score=t.match(new RegExp('^'+name+'\\s+(\\d+)','mi'))?.[1];if(score)c.abilities[key]=score;}
    const speciesHeading=t.match(/^(.+ Traits) \[PHB/gmi)?.[1];
    const classHeading=t.match(/^(.+ Class Features) \[PHB/gmi)?.[1];
    c.speciesTraits=speciesHeading?section(t,speciesHeading,classHeading||'EQUIPMENT & TREASURE'):section(t,'Species Traits','COMBAT');
    c.classTraits=classHeading?section(t,classHeading,'EQUIPMENT & TREASURE'):section(t,'Class Features','EQUIPMENT & TREASURE');
    c.abilityChecks=[...t.matchAll(/^\s*([+-]\d+)\s+\.\.\.\s+(.+?)\s+Ability Checks\s*\*?\*?/gmi)].map(m=>m[2].trim()+': '+m[1]).join('\n');
    c.savingThrows=[...t.matchAll(/^\s*([+-]\d+)\s+\.\.\.\s+(.+?)\s+Saving Throws\s*\*?\*?/gmi)].map(m=>m[2].replace(/\s+\*+$/,'').trim()+': '+m[1]).join('\n');
    c.skills=[...t.matchAll(/^\s*([+-]\d+)\s+\.\.\.\s+(.+?)\s+Skill\s*\*?\*?/gmi)].map(m=>m[2].replace(/\s+\*+$/,'').trim()+': '+m[1]).join('\n');
    const combat=section(t,'COMBAT','FEATURES, TRAITS, SPECIAL ABILITIES');
    c.attacks=combat.split('\n').filter(line=>/Weapon Attack:/i.test(line)).join('\n');
    c.proficiencies=section(t,'Proficiencies & Languages','Magic Initiate')||section(t,'Proficiencies & Languages','Halfling Traits');
    c.spells=section(t,'Magic Initiate','Halfling Traits');
    c.equipment=section(t,'Carried Gear','');
    c.personality=section(t,'Guide Background','Proficiencies & Languages');
    c.features=section(t,'FEATURES, TRAITS, SPECIAL ABILITIES','EQUIPMENT & TREASURE').replace(/Proficiencies & Languages[\s\S]*/,'').trim();
    c.notes='';
    character=c;editingId='';editingRoomPlayerId='';importOpen=false;importText='';playerTab='character';
    notice='Personaje importado. Revisa los campos antes de guardarlo.';
  }
  async function makeRoll(){
    const choice=categoryChoices.find(x=>x.label===selectedRoll);
    const notation=rollCategory==='Personalizada'?customNotation.trim():choice?.notation;
    const label=rollCategory==='Personalizada'?'Tirada personalizada':choice?.label||'Tirada';
    if(!notation){notice='Selecciona una tirada válida.';return;}
    if(!obrReady){notice='Abre la extensión dentro de una sala de Owlbear Rodeo.';return;}
    if(!diceReady){diceReady=await requestDiceReady();if(!diceReady){notice='Dice+ no está disponible en esta sala.';return;}}
    const rollId=crypto.randomUUID();
    pendingRolls[rollId]={label,notation,characterName:character.name};
    rollBusy=true;
    try{
      await OBR.broadcast.sendMessage('dice-plus/roll-request',{rollId,playerId:await OBR.player.getId(),playerName:await OBR.player.getName(),rollTarget:'everyone',diceNotation:notation,showResults:false,timestamp:Date.now(),source:DICE_SOURCE},{destination:'ALL'});
      notice='Tirada enviada a Dice+.';
    }catch{delete pendingRolls[rollId];rollBusy=false;notice='No se pudo enviar la tirada a Dice+.';}
  }
  function handleDiceResult(data:any){
    const pending=pendingRolls[data?.rollId];if(!pending)return;
    const entry:RollEntry={id:data.rollId,playerName:data.playerName||playerName||'Jugador',characterName:pending.characterName,label:pending.label,notation:pending.notation,total:data.result?.totalValue,summary:data.result?.rollSummary||'',status:'Completada',timestamp:data.timestamp||Date.now()};
    delete pendingRolls[data.rollId];rollBusy=false;addRollEntry(entry);
  }
  function handleDiceError(data:any){const pending=pendingRolls[data?.rollId];if(!pending)return;const entry:RollEntry={id:data.rollId,playerName:playerName||'Jugador',characterName:pending.characterName,label:pending.label,notation:pending.notation,summary:data.error||'Error de Dice+',status:'Error',timestamp:Date.now()};delete pendingRolls[data.rollId];rollBusy=false;addRollEntry(entry);}
  function addRollEntry(entry:RollEntry){if(rollLog.some(x=>x.id===entry.id))return;rollLog=[entry,...rollLog].slice(0,100);localStorage.setItem('forja-roll-history',JSON.stringify(rollLog));OBR.broadcast.sendMessage(ROLL_CHANNEL,{entry},{destination:'ALL'});}
  function formatTime(ts:number){return new Date(ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});}
</script>

<svelte:head><title>Forja de Aventureros — D&D 2024</title></svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#inicio" on:click|preventDefault={()=>{view='player';newCharacter();}}><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024</small></span></a>
    <nav><button class:active={view==='player'} on:click={()=>view='player'}>Jugador</button>{#if obrRole==='GM'}<button class:active={view==='gm'} on:click={()=>{view='gm';gmTab='characters';}}>Director de juego</button>{/if}</nav>
  </header>
  <main class="main">
    <div class="connection"><span class:connected={obrReady}></span>{syncStatus}<span class:connected={diceReady} class="dice-status">Dice+ {diceReady?'conectado':'no detectado'}</span></div>
    {#if view==='player'}
      <div class="eyebrow">HOJA DE PERSONAJE <span>EDICIÓN MANUAL</span></div>
      <h1>Forja tu <em>aventurero.</em></h1>
      <p class="intro">Importa una ficha o edita sus datos. Los valores se conservan tal como los introduces; no se calculan automáticamente.</p>
      <div class="player-tabs"><button class:active={playerTab==='character'} on:click={()=>playerTab='character'}>Personaje</button><button class:active={playerTab==='rolls'} on:click={()=>playerTab='rolls'}>Tiradas</button></div>
      {#if playerTab==='character'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">IDENTIDAD</div><h2>Datos generales</h2></div><span class="free-tag">Todo editable</span></div>
          {#if editingRoomPlayerId}<p class="hint">Estás editando la ficha de un jugador como director. Al guardar, los cambios se enviarán al jugador y a la sala.</p>{/if}
          <div class="import-row"><button class="secondary" on:click={()=>importOpen=!importOpen}>Importar personaje</button><span class="hint">Formato de exportación compatible</span></div>
          {#if importOpen}<div class="import-box"><label>Pega aquí el texto completo de la ficha<textarea rows="10" bind:value={importText} placeholder="Name: ..."></textarea></label><div class="actions"><button class="secondary" on:click={()=>{importOpen=false;importText='';}}>Cancelar</button><button class="primary" on:click={importCharacter}>Importar y distribuir datos</button></div></div>{/if}
          <label>Nombre del personaje<input bind:value={character.name} placeholder="Nombre" /></label>
          <div class="two"><label>Jugador<input bind:value={character.playerName} placeholder="Jugador" /></label><label>Nivel<input bind:value={character.level} placeholder="Nivel" /></label></div>
          <label>Especie<textarea rows="2" bind:value={character.species}></textarea></label>
          <label>Rasgos de especie<textarea rows="4" bind:value={character.speciesTraits}></textarea></label>
          <label>Clase<textarea rows="2" bind:value={character.className}></textarea></label>
          <label>Rasgos y capacidades de clase<textarea rows="5" bind:value={character.classTraits}></textarea></label>
          <div class="two"><label>Clase de Armadura (CA)<input bind:value={character.ac} /></label><label>Puntos de Golpe (PG)<input bind:value={character.hp} /></label></div>
          <div class="two"><label>Velocidad<input bind:value={character.speed} /></label><label>Iniciativa<input bind:value={character.initiative} /></label></div>
          <label>Percepción pasiva<input bind:value={character.passivePerception} /></label>
          <div class="section-heading subheading"><div><div class="eyebrow">CARACTERÍSTICAS</div><h2>Valores manuales</h2></div></div>
          <div class="ability-grid">{#each stats as stat}<label class="ability"><span>{stat.label}</span><input bind:value={character.abilities[stat.key]} placeholder="Valor" /></label>{/each}</div>
          <div class="section-heading subheading"><div><div class="eyebrow">COMPETENCIAS Y COMBATE</div><h2>Datos de tiradas</h2></div></div>
          <label>Pruebas de característica y modificadores<textarea rows="4" bind:value={character.abilityChecks} placeholder="Fuerza: -1"></textarea></label>
          <label>Habilidades y modificadores<textarea rows="5" bind:value={character.skills} placeholder="Sigilo: +7"></textarea></label>
          <label>Salvaciones y modificadores<textarea rows="4" bind:value={character.savingThrows} placeholder="Destreza: +5"></textarea></label>
          <label>Armas y ataques<textarea rows="6" bind:value={character.attacks} placeholder="Rapier. Melee Weapon Attack: +5 to hit. Hit: 1d8+3 piercing damage."></textarea></label>
          <div class="two"><label>Bonificador de ataque de conjuro<input bind:value={character.spellAttack} /></label><label>CD de salvación de conjuros<input bind:value={character.spellSaveDc} /></label></div>
          <label>Trasfondo<textarea rows="3" bind:value={character.background}></textarea></label>
          <label>Competencias, herramientas e idiomas<textarea rows="4" bind:value={character.proficiencies}></textarea></label>
          <label>Equipo y objetos<textarea rows="5" bind:value={character.equipment}></textarea></label>
          <label>Conjuros y recursos mágicos<textarea rows="5" bind:value={character.spells}></textarea></label>
          <label>Otros rasgos y capacidades<textarea rows="5" bind:value={character.features}></textarea></label>
          <div class="two"><label>Alineamiento<input bind:value={character.alignment} /></label><label>Experiencia<input bind:value={character.experience} /></label></div>
          <label>Personalidad, apariencia e historia<textarea rows="4" bind:value={character.personality}></textarea></label>
          <label>Notas<textarea rows="4" bind:value={character.notes}></textarea></label>
          <div class="actions"><button class="secondary" on:click={newCharacter}>Nueva ficha</button><button class="primary" on:click={saveCharacter}>Guardar ficha</button></div>
        </section>
      {:else}
        <section class="panel rolls-panel">
          <div class="section-heading"><div><div class="eyebrow">DADOS EN SALA</div><h2>Realizar una tirada</h2></div><span class:ready={diceReady} class="free-tag">{diceReady?'Dice+ listo':'Dice+ no detectado'}</span></div>
          <p class="hint">Las opciones se obtienen de los datos de la ficha. La tirada se envía a Dice+ y todos los participantes la ven.</p>
          <label>Personaje activo<input readonly value={character.name||'Sin personaje seleccionado'} /></label>
          <label>Tipo de tirada<select bind:value={rollCategory}><option>Habilidad</option><option>Característica</option><option>Salvación</option><option>Ataque</option><option>Conjuro</option><option>Iniciativa</option><option>Personalizada</option></select></label>
          {#if rollCategory==='Personalizada'}
            <label>Notación de dados<input bind:value={customNotation} placeholder="1d20+3" /></label>
          {:else}
            <label>Seleccionar tirada<select bind:value={selectedRoll}>{#each categoryChoices as option}<option value={option.label}>{option.label} · {option.detail}</option>{/each}</select></label>
            {#if categoryChoices.length===0}<p class="hint">No hay opciones de esta categoría en la ficha. Añade sus datos en la pestaña Personaje.</p>{/if}
            {#if rollCategory==='Conjuro' && character.spellSaveDc}<p class="hint">CD de salvación de conjuros: {character.spellSaveDc}. Las tiradas de salvación de los objetivos se realizan desde la categoría Salvación.</p>{/if}
          {/if}
          <button class="primary full" on:click={makeRoll} disabled={rollBusy||(!categoryChoices.length&&rollCategory!=='Personalizada')}>{rollBusy?'Esperando resultado…':'Lanzar dados con Dice+'}</button>
        </section>
        <section class="panel roll-history">
          <div class="section-heading"><div><div class="eyebrow">REGISTRO COMPARTIDO</div><h2>Historial de tiradas</h2></div><span class="count">{rollLog.length}</span></div>
          {#if !rollLog.length}<p class="muted">Las tiradas realizadas desde esta extensión aparecerán aquí.</p>{:else}
            <div class="roll-list">{#each rollLog as r}<article class="roll-entry"><div class="roll-entry-top"><strong>{r.characterName||'Sin personaje'} · {r.label}</strong><span>{formatTime(r.timestamp)}</span></div><p>{r.playerName} · {r.notation}</p><div class="roll-result">{#if r.total!==undefined}<b>{r.total}</b>{:else}<b>{r.status}</b>{/if}<span>{r.summary}</span></div></article>{/each}</div>
          {/if}
        </section>
      {/if}
      <section class="saved"><div class="section-heading"><div><div class="eyebrow">ALMACENAMIENTO LOCAL</div><h2>Mis fichas</h2></div><span class="count">{saved.length}</span></div>
        {#if !saved.length}<p class="muted">Todavía no hay fichas guardadas en este dispositivo.</p>{:else}<div class="character-grid">{#each saved as c}<article class="character-card"><div class="card-symbol">✧</div><div><h3>{c.name}</h3><p>{c.species||'Especie sin indicar'} · {c.className||'Clase sin indicar'}</p></div><div class="card-actions"><button on:click={()=>editCharacter(c)}>Editar</button><button class="danger-text" on:click={()=>deleteCharacter(c)}>Eliminar</button></div></article>{/each}</div>{/if}
      </section>
    {:else if obrRole==='GM'}
      <div class="eyebrow">ESPACIO DEL DIRECTOR DE JUEGO <span>SINCRONIZACIÓN DE SALA</span></div><h1>Panel del <em>director.</em></h1>
      <p class="intro">Consulta y edita las fichas publicadas por los jugadores. Los cambios se notifican al propietario de la ficha.</p>
      <div class="player-tabs gm-tabs"><button class:active={gmTab==='characters'} on:click={()=>gmTab='characters'}>Personajes</button><button class:active={gmTab==='bestiary'} on:click={()=>gmTab='bestiary'}>Bestiario</button></div>
      {#if gmTab==='characters'}
      <section class="panel"><div class="section-heading"><div><div class="eyebrow">SALA ACTUAL</div><h2>Personajes de los jugadores</h2></div><span class="count">{roomCharacters.length}</span></div>
        {#if !obrReady}<p class="muted">Abre esta aplicación desde Owlbear Rodeo.</p>{:else if !roomCharacters.length}<p class="muted">Todavía no se ha recibido ninguna ficha de jugador.</p>{:else}<div class="character-grid">{#each roomCharacters as item}<article class="character-card"><div class="card-symbol">✧</div><div><h3>{item.character.name}</h3><p>Jugador: {item.playerName} · {item.character.species} · {item.character.className}</p><p>CA: {item.character.ac||'—'} · PG: {item.character.hp||'—'} · Nivel: {item.character.level||'—'}</p></div><div class="card-actions"><button on:click={()=>editRoomCharacter(item)}>Ver y editar ficha</button></div></article>{/each}</div>{/if}
      </section>
      {:else}
      <section class="panel monster-panel"><div class="section-heading"><div><div class="eyebrow">BESTIARIO PRIVADO</div><h2>Crear bloque de estadísticas</h2></div><span class="count">{monsters.length}</span></div>
        <p class="hint">Este bestiario solo está disponible para el director de juego y se guarda en su dispositivo.</p>
        <div class="import-row"><button class="secondary" on:click={()=>monsterImportOpen=!monsterImportOpen}>Importar statblock</button><span class="hint">Pega el bloque de estadísticas del monstruo</span></div>
        {#if monsterImportOpen}<div class="import-box"><label>Bloque de estadísticas<textarea rows="12" bind:value={monsterImportText} placeholder="Nombre del monstruo&#10;Medium humanoid...&#10;Armor Class ...&#10;Hit Points ...&#10;Speed ..."></textarea></label><div class="actions"><button class="secondary" on:click={()=>{monsterImportOpen=false;monsterImportText='';}}>Cancelar</button><button class="primary" on:click={importMonster}>Importar monstruo</button></div></div>{/if}
        <label>Nombre<input bind:value={monster.name} /></label><div class="two"><label>Tamaño<input bind:value={monster.size} /></label><label>Tipo<input bind:value={monster.type} /></label></div>
        <div class="two"><label>Clase de Armadura (CA)<input bind:value={monster.ac} /></label><label>Puntos de Golpe (PG)<input bind:value={monster.hp} /></label></div>
        <label>Velocidad<input bind:value={monster.speed} /></label><label>Rasgos<textarea rows="4" bind:value={monster.traits}></textarea></label><label>Acciones<textarea rows="4" bind:value={monster.actions}></textarea></label><label>Notas<textarea rows="3" bind:value={monster.notes}></textarea></label>
        <button class="primary full" on:click={addMonster}>Guardar bloque</button>
      </section>
      <section class="saved"><div class="section-heading"><div><div class="eyebrow">BESTIARIO</div><h2>Monstruos guardados</h2></div><span class="count">{monsters.length}</span></div>
        {#if !monsters.length}<p class="muted">Aún no hay monstruos guardados.</p>{:else}<div class="monster-grid">{#each monsters as m}<article class="monster-card"><div class="monster-top"><span class="eyebrow">{m.size} · {m.type}</span><button class="danger-text" on:click={()=>deleteMonster(m.id)}>Eliminar</button></div><h3>{m.name}</h3><div class="monster-stats"><span>CA <b>{m.ac||'—'}</b></span><span>PG <b>{m.hp||'—'}</b></span><span>Vel. <b>{m.speed||'—'}</b></span></div>{#if m.traits}<p><b>Rasgos.</b> {m.traits}</p>{/if}{#if m.actions}<p><b>Acciones.</b> {m.actions}</p>{/if}{#if m.notes}<p>{m.notes}</p>{/if}{#if m.rawBlock}<details class="monster-source"><summary>Ver statblock original importado</summary><pre>{m.rawBlock}</pre></details>{/if}</article>{/each}</div>{/if}
      </section>
      {/if}
    {:else}
      <div class="eyebrow">ACCESO RESTRINGIDO</div><h1>Panel del <em>director.</em></h1><p class="intro">El bestiario y las herramientas del director solo están disponibles para el usuario con rol de GM en Owlbear Rodeo.</p>
    {/if}
  </main>
  {#if notice}<button class="toast" on:click={()=>notice=''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS</span><span>Herramienta manual · D&D 2024</span></footer>
</div>