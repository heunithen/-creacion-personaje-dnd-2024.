<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';

  type CharacterTrait = {id:string;name:string;level:string;source:string;description:string};
  type Character = {
    id:string; name:string; playerName:string; species:string; speciesTraits:string;
    className:string; classTraits:string; level:string; ac:string; hp:string; speed:string;
    abilities:Record<string,string>; abilityChecks:string; background:string; proficiencies:string; savingThrows:string;
    skills:string; attacks:string; initiative:string; passivePerception:string; spellAttack:string;
    spellSaveDc:string; equipment:string; spells:string; features:string; personality:string;
    alignment:string; experience:string; notes:string; updatedAt:string; traits:CharacterTrait[];
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
  const traitSources=['Clase','Dote','Especie','Trasfondo','Otro'];
  const traitOrder=['Especie','Clase','Dote','Trasfondo','Otro'];
  const abilityNames:Record<string,string>={Fuerza:'str',Destreza:'dex',Constitución:'con',Inteligencia:'int',Sabiduría:'wis',Carisma:'cha'};
  function blankCharacter():Character {
    return {id:crypto.randomUUID(),name:'',playerName:'',species:'',speciesTraits:'',className:'',classTraits:'',level:'',ac:'',hp:'',speed:'',
      abilities:{str:'',dex:'',con:'',int:'',wis:'',cha:''},abilityChecks:'',background:'',proficiencies:'',savingThrows:'',skills:'',attacks:'',
      initiative:'',passivePerception:'',spellAttack:'',spellSaveDc:'',equipment:'',spells:'',features:'',personality:'',
      alignment:'',experience:'',notes:'',updatedAt:'',traits:[]};
  }
  let view:'player'|'gm'='player';
  let playerTab:'identity'|'combat'|'abilities'|'proficiencies'|'traits'|'spells'|'equipment'|'rolls'='identity';
  let gmTab:'characters'|'bestiary'='characters';

  let character=blankCharacter();
  let saved:Character[]=[];
  let monsters:Monster[]=[];
  let roomCharacters:RoomCharacter[]=[];





  let editingId='';

  let characterImportOpen=false;
  let characterImportFileName='';
  async function importCharacterJson(event:Event){
    const input=event.currentTarget as HTMLInputElement;
    const file=input.files?.[0];
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(data.schemaVersion!=='forja-character-v1')throw new Error('Formato no compatible. Se requiere schemaVersion: forja-character-v1.');
      if(!data.identity?.name?.trim())throw new Error('Falta identity.name.');
      const c=blankCharacter();
      const text=(value:any)=>Array.isArray(value)?value.map(x=>typeof x==='string'?x:[x.name,x.modifier!==undefined?x.modifier:'',x.description||''].filter(Boolean).join(': ')).join('\\n'):typeof value==='string'?value:value==null?'':String(value);
      const list=(value:any)=>Array.isArray(value)?value.map(x=>typeof x==='string'?x:[x.name,x.modifier!==undefined?x.modifier:''].filter(Boolean).join(': ')).join('\\n'):text(value);
      c.name=data.identity.name||'';c.species=data.identity.species||'';
      c.className=[data.identity.class,data.identity.subclass?'('+data.identity.subclass+')':''].filter(Boolean).join(' ');
      c.level=text(data.identity.level);c.background=data.identity.background||'';c.alignment=data.identity.alignment||'';c.experience=text(data.identity.experience);
      const abilities=data.abilities||{};
      for(const key of ['str','dex','con','int','wis','cha'])if(abilities[key]!==undefined)c.abilities[key]=text(abilities[key].score??abilities[key]);
      c.ac=text(data.combat?.armorClass);c.hp=text(data.combat?.hitPoints?.maximum??data.combat?.hitPoints);c.speed=text(data.combat?.speed);
      c.initiative=text(data.combat?.initiative);c.passivePerception=text(data.combat?.passivePerception);
      const prof=data.proficiencies||{};
      c.savingThrows=list(prof.savingThrows);c.skills=list(prof.skills);c.abilityChecks=list(data.abilityChecks);
      c.proficiencies=[prof.bonus!==undefined?'Bonificador de competencia: +'+text(prof.bonus):'',prof.armor?.length?'Armaduras: '+list(prof.armor):'',prof.weapons?.length?'Armas: '+list(prof.weapons):'',prof.tools?.length?'Herramientas: '+list(prof.tools):'',prof.languages?.length?'Idiomas: '+list(prof.languages):'',prof.other?.length?'Otras: '+list(prof.other):''].filter(Boolean).join('\\n');
      const traitItems=[...(data.traits?.species||[]).map((t:any)=>({...t,source:'Especie'})),...(data.traits?.class||[]).map((t:any)=>({...t,source:'Clase'})),...(data.traits?.feats||[]).map((t:any)=>({...t,source:'Dote'})),...(data.traits?.background||[]).map((t:any)=>({...t,source:'Trasfondo'})),...(data.traits?.other||[]).map((t:any)=>({...t,source:'Otro'}))];
      c.traits=traitItems.map((t:any)=>({id:crypto.randomUUID(),name:t.name||'Rasgo',level:text(t.level),source:t.source,description:text(t.description)}));
      c.speciesTraits=c.traits.filter(t=>t.source==='Especie').map(t=>t.name+': '+t.description).join('\\n');
      c.classTraits=c.traits.filter(t=>t.source==='Clase').map(t=>t.name+': '+t.description).join('\\n');
      c.features=c.traits.filter(t=>!['Especie','Clase'].includes(t.source)).map(t=>t.name+': '+t.description).join('\\n');
      c.attacks=(data.attacks||[]).map((a:any)=>[a.name+':',a.attackBonus!==undefined?((Number(a.attackBonus)>=0?'+':'')+a.attackBonus+' to hit'):'',a.damage?'Hit: '+a.damage+' damage':'',a.range?'Range: '+a.range:'',a.properties||''].filter(Boolean).join('. ')).join('\\n');
      const magic=data.spellcasting||{};c.spellAttack=text(magic.attackModifier);c.spellSaveDc=text(magic.saveDC);
      c.spells=[magic.ability?'Característica: '+magic.ability:'',magic.cantrips?.length?'Trucos: '+list(magic.cantrips):'',magic.preparedSpells?.length?'Conjuros preparados: '+list(magic.preparedSpells):'',magic.knownSpells?.length?'Conjuros conocidos: '+list(magic.knownSpells):'',magic.spellSlots?'Espacios: '+Object.entries(magic.spellSlots).map(([level,slots])=>level+': '+slots).join(', '):'',magic.other?'Otros: '+text(magic.other):''].filter(Boolean).join('\\n\\n');
      c.equipment=[data.equipment?.carried?.length?'Equipo: '+list(data.equipment.carried):'',data.equipment?.treasure?.length?'Tesoro: '+list(data.equipment.treasure):'',data.equipment?.coins?'Monedas: '+Object.entries(data.equipment.coins).map(([coin,amount])=>amount+' '+coin).join(', '):'',data.equipment?.other?'Otros: '+text(data.equipment.other):''].filter(Boolean).join('\\n\\n');
      const p=data.personality||{};c.personality=[p.traits?'Rasgos: '+text(p.traits):'',p.ideal?'Ideal: '+text(p.ideal):'',p.bond?'Vínculo: '+text(p.bond):'',p.flaw?'Defecto: '+text(p.flaw):'',p.appearance?'Apariencia: '+text(p.appearance):'',p.backstory?'Historia: '+text(p.backstory):''].filter(Boolean).join('\\n\\n');
      c.notes=[data.notes||'',data.combat?.hitPoints?.hitDice?'Dados de golpe: '+data.combat.hitPoints.hitDice:'',data.source?.rawText?'TEXTO ORIGINAL\\n'+data.source.rawText:''].filter(Boolean).join('\\n\\n');
      character={...c,playerName:playerName||'',updatedAt:''};editingId=saved[0]?.id||'';playerTab='identity';characterImportOpen=false;characterImportFileName=file.name;
      notice='JSON importado. Revisa las pestañas y guarda la ficha.';input.value='';
    }catch(error){notice='No se pudo importar el JSON: '+(error instanceof Error?error.message:'archivo inválido');input.value='';}
  }
  let notice='';
  let obrReady=false;
  let obrRole='';

  let playerName='';
  let syncStatus='Owlbear Rodeo no está conectado.';

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
  let traitGroups:{source:string;items:CharacterTrait[]}[]=[];
  $: traitGroups=traitOrder.map(source=>({source,items:(character.traits||[]).filter(t=>t.source===source)})).filter(group=>group.items.length>0);
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
  function persistLocal(){localStorage.setItem('forja-characters',JSON.stringify(saved.slice(0,1)));localStorage.setItem('forja-monsters',JSON.stringify(monsters));}
  function addTrait(){character.traits=[...(character.traits||[]),{id:crypto.randomUUID(),name:'',level:'',source:'Clase',description:''}];}
  function removeTrait(id:string){character.traits=(character.traits||[]).filter(t=>t.id!==id);}
  function legacyTraits(text:string,source:string):CharacterTrait[]{
    const clean=text.trim();if(!clean)return[];
    return clean.split(/\n\s*\n/).map(block=>block.trim()).filter(Boolean).map(block=>{
      const lines=block.split('\n').map(x=>x.trim()).filter(Boolean);
      const first=lines[0]||'Rasgo';
      const looksLikeName=first.length<90&&!/[.!?]$/.test(first);
      return {id:crypto.randomUUID(),name:looksLikeName?first:'Rasgo importado',level:'',source,description:looksLikeName?lines.slice(1).join('\n'):block};
    });
  }
  function normalizeTraits(c:any):CharacterTrait[]{
    if(Array.isArray(c.traits))return c.traits.map((t:any)=>({id:t.id||crypto.randomUUID(),name:t.name||'',level:t.level||'',source:traitSources.includes(t.source)?t.source:'Otro',description:t.description||''}));
    return [...legacyTraits(c.speciesTraits||'','Especie'),...legacyTraits(c.classTraits||'','Clase'),...legacyTraits(c.features||'','Otro')];
  }
  function readRoomPlayers(players:any[]){
    roomCharacters=players.flatMap((p:any)=>{
      const payload=p.metadata?.[KEY];
      if(!payload||payload.deleted||!payload.character)return[];
      return[{playerId:p.id,playerName:p.name||payload.playerName||'Jugador',character:payload.character}];
    });
  }
  async function refreshRoomPlayers(){
    try{readRoomPlayers(await OBR.party.getPlayers());}catch{}
  }
  async function restoreOwnCharacter(){
    if(obrRole!=='PLAYER')return;
    const metadata:any=await OBR.player.getMetadata();
    const payload=metadata?.[KEY];
    if(payload?.deleted){
      saved=[];character=blankCharacter();editingId='';persistLocal();return;
    }    if(payload?.character){      const remote=payload.character as Character;
      const local=saved[0];
      const remoteTime=Date.parse(payload.updatedAt||remote.updatedAt||'')||0;
      const localTime=Date.parse(local?.updatedAt||'')||0;
      if(!local||remoteTime>=localTime){
        const normalized={...blankCharacter(),...remote,traits:normalizeTraits(remote),abilities:{...blankCharacter().abilities,...remote.abilities}};
        saved=[normalized];character=normalized;editingId=normalized.id;persistLocal();
      }
    }
  }
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
    saved=saved.length?[{...saved[saved.length-1],traits:normalizeTraits(saved[saved.length-1])}]:[];
    if(saved.length)character={...blankCharacter(),...saved[0],traits:saved[0].traits,abilities:{...blankCharacter().abilities,...saved[0].abilities}};
    if(OBR.isAvailable)OBR.onReady(async()=>{
      obrReady=true;
      try{
        obrRole=await OBR.player.getRole();playerName=await OBR.player.getName();if(obrRole==='GM')view='gm';
        syncStatus='Conectado a Owlbear Rodeo como '+(obrRole==='GM'?'Director de juego.':'Jugador.');
        await restoreOwnCharacter();
        await refreshRoomPlayers();
        OBR.party.onChange((players:any[])=>readRoomPlayers(players));
        OBR.broadcast.onMessage(CHANNEL,async(event:any)=>{
          const d=event.data;
          if(d?.type==='character-updated'&&d.character)roomCharacters=[...roomCharacters.filter(c=>c.playerId!==d.playerId),{playerId:d.playerId,playerName:d.playerName||'Jugador',character:d.character}];
          if(d?.type==='character-deleted')roomCharacters=roomCharacters.filter(c=>c.playerId!==d.playerId);
        });
        OBR.broadcast.onMessage(ROLL_CHANNEL,(event:any)=>{const d=event.data;if(d?.entry&& !rollLog.some(x=>x.id===d.entry.id)){rollLog=[d.entry,...rollLog].slice(0,100);localStorage.setItem('forja-roll-history',JSON.stringify(rollLog));}});
        OBR.broadcast.onMessage(DICE_RESULT,(event:any)=>handleDiceResult(event.data));
        OBR.broadcast.onMessage(DICE_ERROR,(event:any)=>handleDiceError(event.data));
        diceReady=await requestDiceReady();
      }catch{syncStatus='Owlbear está abierto, pero no se pudo leer la sala.';}
    });
  });
  function saveCharacter(){
    character={...character,name:character.name.trim(),playerName:playerName||character.playerName,updatedAt:new Date().toISOString()};
    if(!character.name){notice='Escribe el nombre del personaje.';return;}
    character={...character,id:editingId||saved[0]?.id||crypto.randomUUID()};
    saved=[character];editingId=character.id;persistLocal();publishCharacter(character);notice='Ficha guardada.';
  }
  function newCharacter(){
    if(saved.length){editCharacter(saved[0]);return;}
    character=blankCharacter();editingId='';view='player';playerTab='identity';notice='';
  }
  function editCharacter(c:Character){
    character={...blankCharacter(),...c,traits:normalizeTraits(c),abilities:{...blankCharacter().abilities,...c.abilities}};
    editingId=c.id;view='player';playerTab='identity';
  }
  async function deleteCharacter(c:Character){
    saved=saved.filter(x=>x.id!==c.id);
    if(editingId===c.id){editingId='';character=blankCharacter();}
    persistLocal();
    if(obrReady&&obrRole==='PLAYER'){
      const id=await OBR.player.getId();
      await OBR.player.setMetadata({[KEY]:{deleted:true,updatedAt:new Date().toISOString()}});
      await OBR.broadcast.sendMessage(CHANNEL,{type:'character-deleted',playerId:id},{destination:'ALL'});
    }
    notice='Ficha eliminada. Puedes crear un nuevo personaje.';
  }
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
  async function makeRoll(){
    const choice=categoryChoices.find(x=>x.label===selectedRoll);
    const notation=rollCategory==='Personalizada'?customNotation.trim():choice?.notation;
    const label=rollCategory==='Personalizada'?'Tirada personalizada':choice?.label||'Tirada';
    if(!notation){notice='Selecciona una tirada válida.';return;}
    if(!obrReady){notice='Abre la extensión dentro de una sala de Owlbear Rodeo.';return;}
    if(!diceReady){diceReady=await requestDiceReady();if(!diceReady){notice='Dice+ no está disponible en esta sala.';return;}}
    const rollId=crypto.randomUUID();    pendingRolls[rollId]={label,notation,characterName:character.name};
    rollBusy=true;    try{
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
    <a class="brand" href="#inicio" on:click|preventDefault={()=>{if(obrRole==='GM')view='gm';else{view='player';newCharacter();}}}><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>DUNGEONS & DRAGONS · 2024 · v0.9.8</small></span></a>
    <nav>{#if obrRole!=='GM'}<button class:active={view==='player'} on:click={()=>view='player'}>Jugador</button>{/if}{#if obrRole==='GM'}<button class:active={view==='gm'} on:click={()=>{view='gm';gmTab='characters';}}>Director de juego</button>{/if}</nav>
  </header>
  <main class="main">
    <div class="connection"><span class:connected={obrReady}></span>{syncStatus}<span class:connected={diceReady} class="dice-status">Dice+ {diceReady?'conectado':'no detectado'}</span></div>
    {#if view==='player'}
      <div class="eyebrow">HOJA DE PERSONAJE <span>EDICIÓN MANUAL</span></div>
      <h1>Tu <em>aventurero.</em></h1>
      <p class="intro">Crea tu personaje, completa sus datos y guarda la ficha. Se sincronizará con la sala de Owlbear Rodeo.</p>
      <section class="panel import-character-panel">
        <div class="import-row"><button class="secondary" on:click={()=>characterImportOpen=!characterImportOpen}>Importar personaje desde JSON</button><span class="hint">Carga un archivo .json preparado con el formato Forja v1.</span></div>
        {#if characterImportOpen}
          <div class="import-box">
            <label>Archivo JSON del personaje<input type="file" accept=".json,application/json" on:change={importCharacterJson} /></label>
            <p class="hint">El archivo debe utilizar el esquema <strong>forja-character-v1</strong>. La importación no sustituye tu ficha guardada hasta que pulses «Guardar ficha».</p>
            <div class="actions"><button class="secondary" on:click={()=>characterImportOpen=false}>Cerrar</button></div>
          </div>
        {/if}
      </section>
      <div class="player-tabs character-tabs">
        <button class:active={playerTab==='identity'} on:click={()=>playerTab='identity'}>Identidad</button>
        <button class:active={playerTab==='combat'} on:click={()=>playerTab='combat'}>Combate</button>
        <button class:active={playerTab==='abilities'} on:click={()=>playerTab='abilities'}>Características</button>
        <button class:active={playerTab==='proficiencies'} on:click={()=>playerTab='proficiencies'}>Competencias</button>
        <button class:active={playerTab==='traits'} on:click={()=>playerTab='traits'}>Rasgos</button>
        <button class:active={playerTab==='spells'} on:click={()=>playerTab='spells'}>Conjuros</button>
        <button class:active={playerTab==='equipment'} on:click={()=>playerTab='equipment'}>Equipo</button>
        <button class:active={playerTab==='rolls'} on:click={()=>playerTab='rolls'}>Tiradas</button>
      </div>
      {#if playerTab==='identity'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">IDENTIDAD</div><h2>Datos del aventurero</h2></div><span class="free-tag">Todo editable</span></div>

          
          <label>Nombre del personaje<input bind:value={character.name} placeholder="Nombre" /></label>
          <div class="two"><label>Jugador<input bind:value={character.playerName} placeholder="Jugador" /></label><label>Nivel<input bind:value={character.level} placeholder="Nivel" /></label></div>
          <label>Especie<input bind:value={character.species} /></label>
          <label>Clase<input bind:value={character.className} /></label>
          <label>Trasfondo<textarea rows="3" bind:value={character.background}></textarea></label>
          <div class="two"><label>Alineamiento<input bind:value={character.alignment} /></label><label>Experiencia<input bind:value={character.experience} /></label></div>
          <label>Personalidad, apariencia e historia<textarea rows="5" bind:value={character.personality}></textarea></label>
          <label>Notas generales<textarea rows="4" bind:value={character.notes}></textarea></label>
        </section>
      {:else if playerTab==='combat'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">COMBATE</div><h2>Estadísticas y ataques</h2></div></div>
          <div class="two"><label>Clase de Armadura (CA)<input bind:value={character.ac} /></label><label>Puntos de Golpe (PG)<input bind:value={character.hp} /></label></div>
          <div class="two"><label>Velocidad<input bind:value={character.speed} /></label><label>Iniciativa<input bind:value={character.initiative} /></label></div>
          <label>Percepción pasiva<input bind:value={character.passivePerception} /></label>
          <label>Armas y ataques<textarea rows="8" bind:value={character.attacks} placeholder="Nombre del arma, bonificador de ataque, daño y propiedades"></textarea></label>
        </section>
      {:else if playerTab==='abilities'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">CARACTERÍSTICAS</div><h2>Valores del personaje</h2></div></div>
          <p class="hint">Introduce los valores tal como aparecen en la ficha. Los modificadores no se calculan automáticamente.</p>
          <div class="ability-grid">{#each stats as stat}<label class="ability"><span>{stat.label}</span><input bind:value={character.abilities[stat.key]} placeholder="Valor" /></label>{/each}</div>
        </section>
      {:else if playerTab==='proficiencies'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">COMPETENCIAS</div><h2>Pruebas, habilidades y salvaciones</h2></div></div>
          <label>Pruebas de característica y modificadores<textarea rows="5" bind:value={character.abilityChecks} placeholder="Fuerza: +3"></textarea></label>
          <label>Habilidades y modificadores<textarea rows="7" bind:value={character.skills} placeholder="Sigilo: +5"></textarea></label>
          <label>Salvaciones y modificadores<textarea rows="5" bind:value={character.savingThrows} placeholder="Destreza: +4"></textarea></label>
          <label>Competencias con armaduras, armas y herramientas; idiomas<textarea rows="6" bind:value={character.proficiencies}></textarea></label>
        </section>
      {:else if playerTab==='traits'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">RASGOS Y CAPACIDADES</div><h2>Rasgos del personaje</h2></div><span class="count">{(character.traits||[]).length}</span></div>
          <p class="hint">Cada rasgo se registra por separado y se organiza automáticamente según su origen.</p>
          <button class="secondary add-trait" on:click={addTrait}>＋ Añadir rasgo</button>
          {#if !(character.traits||[]).length}<p class="muted">Todavía no hay rasgos añadidos.</p>{/if}
          {#each character.traits||[] as trait, index}
            <article class="trait-editor">
              <div class="trait-editor-head"><strong>Rasgo {index+1}</strong><button class="danger-text" on:click={()=>removeTrait(trait.id)}>Eliminar</button></div>
              <div class="two">
                <label>Nombre del rasgo<input bind:value={trait.name} placeholder="Nombre" /></label>
                <label>Nivel<input bind:value={trait.level} placeholder="Nivel en que se obtiene (si corresponde)" /></label>
              </div>
              <label>Origen del rasgo<select bind:value={trait.source}>{#each traitSources as source}<option value={source}>{source}</option>{/each}</select></label>
              <label>Descripción<textarea rows="4" bind:value={trait.description} placeholder="Describe el efecto y sus reglas"></textarea></label>
            </article>
          {/each}
          <div class="traits-preview">
            <div class="eyebrow">RASGOS ORDENADOS EN LA FICHA</div>
            {#if !traitGroups.length}<p class="muted">Los rasgos aparecerán aquí agrupados por origen.</p>{:else}
              {#each traitGroups as group}
                <section class="trait-group"><h3>{group.source}</h3>
                  {#each group.items as trait}
                    <article class="trait-view"><div><strong>{trait.name||'Rasgo sin nombre'}</strong>{#if trait.level}<span class="trait-level">Nivel {trait.level}</span>{/if}</div>{#if trait.description}<p>{trait.description}</p>{/if}</article>
                  {/each}
                </section>
              {/each}
            {/if}
          </div>
        </section>
      {:else if playerTab==='spells'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">CONJUROS</div><h2>Magia y recursos</h2></div></div>
          <div class="two"><label>Bonificador de ataque de conjuro<input bind:value={character.spellAttack} /></label><label>CD de salvación de conjuros<input bind:value={character.spellSaveDc} /></label></div>
          <label>Conjuros conocidos, preparados y otros recursos mágicos<textarea rows="12" bind:value={character.spells}></textarea></label>
        </section>
      {:else if playerTab==='equipment'}
        <section class="panel form-panel">
          <div class="section-heading"><div><div class="eyebrow">EQUIPO</div><h2>Inventario y tesoro</h2></div></div>
          <p class="hint">Incluye aquí armas, armaduras, equipo, objetos y tesoro. Los datos de ataques también se consultan en la pestaña Combate.</p>
          <label>Equipo, objetos y tesoro<textarea rows="12" bind:value={character.equipment}></textarea></label>
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
            {#if categoryChoices.length===0}<p class="hint">No hay opciones de esta categoría en la ficha. Añade sus datos en la pestaña Competencias, Combate o Conjuros.</p>{/if}
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
      <section class="panel save-panel"><button class="primary full" on:click={saveCharacter}>Guardar ficha</button></section>
      {#if saved.length}
      <section class="saved"><div class="section-heading"><div><div class="eyebrow">PERSONAJE GUARDADO</div><h2>Mi personaje</h2></div><span class="count">1</span></div>
        <div class="character-grid">{#each saved as c}<article class="character-card"><div class="card-symbol">✧</div><div><h3>{c.name}</h3><p>{c.species||'Especie sin indicar'} · {c.className||'Clase sin indicar'}</p></div><div class="card-actions"><button on:click={()=>editCharacter(c)}>Editar ficha</button><button class="danger-text" on:click={()=>deleteCharacter(c)}>Eliminar ficha</button></div></article>{/each}</div>
      </section>{/if}
    {:else if obrRole==='GM'}
      <div class="eyebrow">ESPACIO DEL DIRECTOR DE JUEGO <span>SINCRONIZACIÓN DE SALA</span></div><h1>Panel del <em>director.</em></h1>
      <p class="intro">Consulta las fichas publicadas por los jugadores y administra tu bestiario.</p>
      <div class="player-tabs gm-tabs"><button class:active={gmTab==='characters'} on:click={()=>gmTab='characters'}>Personajes en sala</button><button class:active={gmTab==='bestiary'} on:click={()=>gmTab='bestiary'}>Bestiario</button></div>
      {#if gmTab==='characters'}
      <section class="panel"><div class="section-heading"><div><div class="eyebrow">SALA ACTUAL</div><h2>Personajes de los jugadores</h2></div><span class="count">{roomCharacters.length}</span></div>
        <div class="actions"><button class="secondary" on:click={refreshRoomPlayers}>Actualizar jugadores</button></div>
        <p class="hint">Fichas creadas y publicadas por los jugadores en esta sala.</p>
        {#if !obrReady}<p class="muted">Abre esta aplicación desde Owlbear Rodeo.</p>{:else if !roomCharacters.length}<p class="muted">Todavía no se ha recibido ninguna ficha de jugador.</p>{:else}<div class="character-grid">{#each roomCharacters as item}<article class="character-card"><div class="card-symbol">✧</div><div><h3>{item.character.name}</h3><p>Jugador: {item.playerName} · {item.character.species} · {item.character.className}</p><p>CA: {item.character.ac||'—'} · PG: {item.character.hp||'—'} · Nivel: {item.character.level||'—'}</p></div><div class="card-actions"><span class="muted">Ficha del jugador</span></div></article>{/each}</div>{/if}
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
