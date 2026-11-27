        p.drawLine({start:{x:x+5,y:y+h-19},end:{x:x+w-5,y:y+h-19},thickness:0.45,color:line});
      };
      const footer = (p:any,n:number) => {
        p.drawLine({start:{x:M,y:25},end:{x:W-M,y:25},thickness:0.5,color:line});
        text(p,'D&D 2024 · Ficha de personaje',M,13,6,italic,muted);
        text(p,'Página '+n+' de 2',W-83,13,6,regular,muted);
      };
      const heading = (p:any,subtitle:string) => {
        text(p,target.name || 'Personaje',M,H-39,18,bold,accent, W-2*M);
        text(p,subtitle,M,H-55,7,italic,muted,W-2*M);
        p.drawLine({start:{x:M,y:H-64},end:{x:W-M,y:H-64},thickness:1.2,color:accent});
        p.drawLine({start:{x:M,y:H-67},end:{x:W-M,y:H-67},thickness:0.35,color:line});
      };
      const characterName=target.name || 'Personaje';
      const className=first([['PERSONAJE','Clase']]);
      const level=sheetLevel(target);
      const species=first([['PERSONAJE','Especie'],['PERSONAJE','Raza']]);
      const background=first([['PERSONAJE','Trasfondo'],['PERSONAJE','Antecedente']]);
      const alignment=first([['PERSONAJE','Alineamiento']]);
      const player=first([['PERSONAJE','Jugador']]) || playerLabel || '—';
      const abilities=['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
      const skills=['Acrobacias','Atletismo','Conocimiento arcano','Engaño','Historia','Interpretación','Intimidación','Investigación','Juego de manos','Medicina','Naturaleza','Perspicacia','Persuasión','Percepción','Religión','Sigilo','Supervivencia','Trato con animales'];
      const featureGroups=playerFeatureGroups(target);
      const traits=[...(featureGroups.traits||[]),...(featureGroups.feats||[])];
      const ownedInventory=getShopOwnedItems(target).map((entry:any)=>({name:String(entry.name||''),value:entry.quantity>1?'× '+entry.quantity:'× 1'})).filter((item:any)=>item.name);
      const attackNames=splitChoiceList(stat('ATAQUES','Armas incluidas en el equipo'));
      const storedAttackProfiles=stat('ATAQUES','Perfiles de ataque');
      const decodeWeaponName=(value:string)=>String(value||'').replace(/&#(?:x([0-9a-f]+)|(\\d+));/gi,(_match,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).trim();
      // Combina las armas declaradas en ATAQUES con las que figuran en el inventario.
      // También recupera nombres reconocibles desde perfiles antiguos aunque su texto esté codificado.
      const knownWeapons=Object.keys(WEAPON_PROFILES);
      const rawAttackText=decodeWeaponName([attackNames.join(', '),storedAttackProfiles].join(' '));
      const inventoryWeaponNames=ownedInventory.map((item:any)=>decodeWeaponName(item.name));
      const detectedProfileNames=knownWeapons.filter(weapon=>normalizeLevelText(rawAttackText).includes(normalizeLevelText(weapon)));
      const allAttackNames=[...new Map([...attackNames.map(decodeWeaponName),...inventoryWeaponNames,...detectedProfileNames]
        .filter((name:string)=>knownWeapons.some(weapon=>normalizeLevelText(weapon)===normalizeLevelText(name)))
        .map((name:string)=>[normalizeLevelText(name),name])).values()];
      const attackSource=allAttackNames.length?weaponAttackDetails(target,allAttackNames.join(', ')):decodeWeaponName(storedAttackProfiles);
      const attacks=attackSource.split(/\\r?\\n/).map(v=>decodeWeaponName(v).trim()).filter(Boolean).map(row=>{
        const m=row.match(/^(.+?):\\s*ataque\\s*([+-]?\\d+)\\s*[·|]\\s*([^·|]+)(?:\\s*[·|]\\s*(.*))?$/i);
        if(m) return [m[1].trim(),m[2],m[3].trim(),(m[4]||'').trim()];
        const name=row.split(':')[0].trim();
        return [name || row,'','',''];
      }).slice(0,6);
      const legacyEquipment=first([['EQUIPO','Equipo inicial']]);
      const inventory=ownedInventory.length?ownedInventory:(legacyEquipment?legacyEquipment.split(/[;\n]+/).map((name:string)=>name.trim()).filter(Boolean).map((name:string)=>({name,value:''})):sectionStats(['INVENTARIO']).filter(item=>/equipo|objeto/i.test(String(item.name||''))).map(item=>({name:String(item.name||''),value:clean(item.value)})).filter(item=>item.name||item.value));
      const spellRows=sectionStats(['DETALLE DE CONJUROS','DETALLES DE CONJUROS','CONJUROS']).map(item=>({name:String(item.name||''),value:clean(item.value)})).filter(item=>item.name||item.value);
      const proficiencies=sectionStats(['COMPETENCIAS']).map(item=>({name:String(item.name||''),value:clean(item.value)})).filter(item=>item.name||item.value);
      const isBarbarian=/bárbaro|barbarian/i.test(className);
      const furyFeature=traits.find(f=>/furia|rage/i.test(String(f.name||'')));
      const furyText=String(furyFeature?.description||'');
      const page1=pdf.addPage([W,H]);