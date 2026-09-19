const classes = {
  knight:{name:"Knight",role:"VANGUARD",icon:"🛡️",desc:"A durable frontliner who turns defense into survival.",stats:{atk:14,wit:7,dex:8,def:16,vit:15,lck:5},hp:135,skill:"Shield Bash",skillDesc:"Heavy hit + Guard",weapon:"Rusty Longsword",armor:"Ironbound Coat"},
  ranger:{name:"Ranger",role:"SKIRMISHER",icon:"🏹",desc:"Fast and precise. DEX and LCK create lethal openings.",stats:{atk:14,wit:9,dex:19,def:7,vit:9,lck:12},hp:98,skill:"Twin Shot",skillDesc:"Two rapid attacks",weapon:"Hunter's Bow",armor:"Forest Leathers"},
  mage:{name:"Mage",role:"ARCANIST",icon:"🔮",desc:"A fragile caster who starts rough and scales into a late-game threat.",stats:{atk:6,wit:17,dex:10,def:5,vit:7,lck:9},hp:78,skill:"Arcane Burst",skillDesc:"Scales with level",weapon:"Apprentice Staff",armor:"Scholar's Robe"}
};

const enemies = [
 {name:"Goblin Scout",type:"COMMON",icon:"👺",hp:58,atk:9,def:3,xp:28,gold:22},
 {name:"Cave Wolf",type:"BEAST",icon:"🐺",hp:72,atk:12,def:4,xp:34,gold:26},
 {name:"Bandit",type:"HUMAN",icon:"🥷",hp:85,atk:13,def:6,xp:42,gold:34},
 {name:"Orc Brute",type:"COMMON",icon:"👹",hp:125,atk:17,def:9,xp:62,gold:48}
];

/*
  Five unique elite encounters.
  Each elite has four destructible body parts and a telegraphed QTE.
  QTE types:
  - dodge: press DODGE before the countdown ends
  - target: attack the highlighted body part
  - block: press BLOCK before the countdown ends
*/
const elites = [
  {
    name:"Frostbound Revenant",type:"ELITE I",icon:"🧊",hp:245,atk:19,def:11,xp:110,gold:95,
    message:"The air gets cold around you.",
    qte:"random",prompt:"REACT TO THE FROST LANCE",window:3200,
    parts:{head:{hp:42,weak:1.6},body:{hp:92,weak:1},arm:{hp:55,weak:1.2},leg:{hp:56,weak:1.15}},
    special:"Frost Lance",specialText:"A freezing spear tears across the arena."
  },
  {
    name:"Ironhide Executioner",type:"ELITE II",icon:"🪓",hp:300,atk:22,def:15,xp:125,gold:110,
    message:"The executioner raises both hands. You feel the weight of the axe before it falls.",
    qte:"random",prompt:"REACT TO THE EXECUTIONER'S STRIKE",window:3000,
    parts:{head:{hp:50,weak:1.5},body:{hp:120,weak:1},arm:{hp:62,weak:1.45},leg:{hp:68,weak:1.15}},
    special:"Executioner's Strike",specialText:"The axe comes down with enough force to split stone."
  },
  {
    name:"Thornmother",type:"ELITE III",icon:"🌿",hp:270,atk:20,def:10,xp:120,gold:105,
    message:"Roots coil beneath your feet. Something enormous is moving underground.",
    qte:"random",prompt:"REACT TO THE ROOT SNARE",window:3500,
    parts:{head:{hp:48,weak:1.25},body:{hp:105,weak:1},arm:{hp:52,weak:1.2},leg:{hp:64,weak:1.8}},
    special:"Root Snare",specialText:"Thick roots erupt from the floor and drag toward your ankles."
  },
  {
    name:"Void Duelist",type:"ELITE IV",icon:"🗡️",hp:230,atk:26,def:8,xp:135,gold:125,
    message:"The duelist vanishes. A blade whispers somewhere behind you.",
    qte:"random",prompt:"REACT TO THE PHANTOM RIPOSTE",window:2600,
    parts:{head:{hp:35,weak:1.9},body:{hp:88,weak:1},arm:{hp:48,weak:2},leg:{hp:50,weak:1.3}},
    special:"Phantom Riposte",specialText:"A shadow blade appears at your back."
  },
  {
    name:"Ashen Colossus",type:"ELITE V",icon:"🔥",hp:380,atk:24,def:17,xp:180,gold:170,
    message:"The ground begins to tremble. The colossus draws breath like a furnace.",
    qte:"random",prompt:"REACT TO THE ASHEN ERUPTION",window:3800,
    parts:{head:{hp:70,weak:1.5},body:{hp:155,weak:1},arm:{hp:82,weak:1.25},leg:{hp:86,weak:1.35}},
    special:"Ashen Eruption",specialText:"A wave of burning ash explodes outward from its body."
  }
];

const shopPool = [
 {name:"Tempered Edge",kind:"WEAPON",icon:"⚔️",cost:90,desc:"+5 ATK",effect:["atk",5]},
 {name:"Hunter's Focus",kind:"TRINKET",icon:"🎯",cost:110,desc:"+4 DEX, +2 LCK",effect:["dex",4,"lck",2]},
 {name:"Runic Codex",kind:"WEAPON",icon:"📜",cost:120,desc:"+6 WIT",effect:["wit",6]},
 {name:"Steel Carapace",kind:"ARMOR",icon:"🪖",cost:100,desc:"+5 DEF, +12 max HP",effect:["def",5,"vit",3]},
 {name:"Vitality Charm",kind:"TRINKET",icon:"💠",cost:80,desc:"+5 VIT",effect:["vit",5]},
 {name:"Executioner's Axe",kind:"WEAPON",icon:"🪓",cost:180,desc:"+9 ATK, -2 DEX",effect:["atk",9,"dex",-2]},
 {name:"Field Rations",kind:"CONSUMABLE",icon:"🧪",cost:45,desc:"+2 Potions",consumable:"potion",amount:2},
 {name:"Throwing Daggers",kind:"CONSUMABLE",icon:"🗡️",cost:55,desc:"+3 Throwing Daggers",consumable:"dagger",amount:3}
];

let state = freshState();

function freshState(){
  return {class:null,player:null,enemy:null,kills:0,gold:100,floor:1,run:1,potions:2,throwingDaggers:0,guard:false,turn:true,log:[],eliteDefeated:0,qte:null,elitePartBroken:{arm:false,leg:false,body:false,head:false},transitionTimer:null,transitionToken:0,parryReady:false,parryWindowTimer:null,parryQte:null};
}
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const partLabel=p=>p==="arm"?"ARM":p==="leg"?"LEG":p==="body"?"BODY":"HEAD";

function renderClasses(){
  $("classCards").innerHTML=Object.entries(classes).map(([key,c])=>`
    <article class="class-card" data-class="${key}">
      <div class="class-art"><div>${c.icon}</div></div>
      <div><span class="role">${c.role}</span><h3>${c.name}</h3><p>${c.desc}</p>
      <div class="class-stats">${Object.entries(c.stats).map(([k,v])=>`<span>${k.toUpperCase()} ${v}</span>`).join("")}</div></div>
    </article>`).join("");
  document.querySelectorAll(".class-card").forEach(x=>x.onclick=()=>startRun(x.dataset.class));
}

function startRun(cls){
  const c=classes[cls];
  state=freshState();
  state.class=cls;
  state.player={...c,stats:{...c.stats},hp:c.hp,baseHp:c.hp,bonusHp:0,weapon:c.weapon,armor:c.armor,trinket:"Empty",xp:0,level:1};
  state.throwingDaggers=cls==="ranger"?5:0;
  $("classScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  addLog(`Run ${String(state.run).padStart(2,"0")} begins. No save. No safety net.`);
  spawnEnemy();
  renderAll();
}

function maxHp(){return state.player.baseHp+state.player.stats.vit*2+state.player.bonusHp}

function chooseEncounter(){
  // Every fifth normal kill starts an elite gauntlet. After all 5 elites, the boss arrives.
  if(state.kills>0 && state.kills%5===0 && state.eliteDefeated<5){
    return {...elites[state.eliteDefeated],isElite:true};
  }
  const e=enemies[Math.floor(Math.random()*enemies.length)];
  const scale=1+(Math.floor(state.kills/5)*.15);
  return {...e,hp:Math.round(e.hp*scale),maxHp:Math.round(e.hp*scale),atk:Math.round(e.atk*scale),def:Math.round(e.def*scale),xp:Math.round(e.xp*scale),gold:Math.round(e.gold*scale),isElite:false};
}

function clearCombatTimers(){
  if(state.transitionTimer){clearTimeout(state.transitionTimer);state.transitionTimer=null}
  if(state.qte?.timer)clearTimeout(state.qte.timer);
  if(state.parryWindowTimer){clearTimeout(state.parryWindowTimer);state.parryWindowTimer=null}
  if(state.parryQte?.timer)clearTimeout(state.parryQte.timer);
  if(state.parryQte?.stepTimer)clearTimeout(state.parryQte.stepTimer);
  state.qte=null;
  state.parryQte=null;
  state.parryReady=false;
  state.transitionToken++;
}

function queueTransition(fn,delay=650){
  const token=state.transitionToken;
  state.turn=false;
  state.transitionTimer=setTimeout(()=>{
    state.transitionTimer=null;
    if(token!==state.transitionToken)return;
    fn();
  },delay);
}

function spawnEnemy(){
  clearCombatTimers();
  resetCombatAnimation();
  const e=chooseEncounter();
  state.enemy={...e,maxHp:e.maxHp||e.hp};
  state.turn=true;
  state.elitePartBroken={arm:false,leg:false,body:false,head:false};
  addLog(`${e.name} enters the ruins.`);
  if(e.isElite){
    const token=state.transitionToken;
    state.transitionTimer=setTimeout(()=>{
      state.transitionTimer=null;
      if(token===state.transitionToken)beginEliteQTE();
    },650);
  }
  renderAll();
}

function addLog(msg,type=""){
  state.log.unshift({msg,type});
  state.log=state.log.slice(0,9);
  $("combatLog").innerHTML=state.log.map(x=>`<div class="${x.type?'log-'+x.type:''}">› ${x.msg}</div>`).join("");
}

function resetCombatAnimation(){
  [$("playerSprite"),$("enemySprite")].forEach(el=>{
    if(!el)return;
    el.classList.remove("player-attacking","enemy-attacking","player-knockback","enemy-knockback","hit");
  });
}

function playCombatAnimation(attacker){
  const player=$("playerSprite"),enemy=$("enemySprite");
  if(!player||!enemy)return;
  resetCombatAnimation();
  void player.offsetWidth;
  void enemy.offsetWidth;
  if(attacker==="player"){
    player.classList.add("player-attacking");
    enemy.classList.add("enemy-knockback");
  }else{
    enemy.classList.add("enemy-attacking");
    player.classList.add("player-knockback");
  }
  setTimeout(resetCombatAnimation,920);
}

function playerDamage(mult=1,magic=false,targetPart=null){
  const s=state.player.stats,e=state.enemy;
  const base=magic?s.wit*1.35+s.atk*.2:s.atk+s.dex*.18;
  const crit=Math.random()<(s.dex*.008+s.lck*.004);
  let partMult=1;
  if(e.isElite && targetPart){
    const part=e.parts[targetPart];
    if(part && part.hp>0)partMult=part.weak;
  }
  const dmg=Math.max(1,Math.round((base*(.85+Math.random()*.3))*mult*partMult-e.def*.35));
  return {dmg,crit};
}

function getSkillMultiplier(){
  if(state.class==="mage")return 1.22+state.player.level*0.14;
  if(state.class==="ranger")return 0.95;
  if(state.class==="knight")return 1.55;
  return 1;
}

function getSkillLabel(){
  if(state.class==="mage")return `Arcane Burst scales to ${Math.round(getSkillMultiplier()*100)}%`;
  if(state.class==="ranger")return "Two rapid attacks";
  return state.player.skillDesc;
}

function getGuardButton(){
  return document.querySelector('[data-action="guard"]');
}

function getAliveParts(){
  if(!state.enemy?.isElite)return [];
  return Object.keys(state.enemy.parts).filter(p=>state.enemy.parts[p].hp>0);
}

function elitePartDamage(part,amount){
  const e=state.enemy;
  if(!e.isElite || !e.parts[part] || e.parts[part].hp<=0)return;
  e.parts[part].hp=clamp(e.parts[part].hp-amount,0,e.parts[part].hp);
  if(e.parts[part].hp===0){
    state.elitePartBroken[part]=true;
    addLog(`${partLabel(part)} destroyed. The elite loses part of its power.`,"good");
    if(part==="arm")e.atk=Math.max(5,e.atk-5);
    if(part==="leg")e.atk=Math.max(5,e.atk-2);
    if(part==="body")e.def=Math.max(0,e.def-5);
    if(part==="head")e.atk=Math.max(5,e.atk-7);
  }
}

function beginEliteQTE(){
  const e=state.enemy;
  if(!e?.isElite || e.hp<=0)return;
  const type=Math.random()<.5?"dodge":"block";
  state.qte={type,target:null,active:true,success:null,prompt:type==="dodge"?"DODGE THE INCOMING ATTACK":"BLOCK THE INCOMING ATTACK"};
  addLog(e.message,"danger");
  showQTE();
  state.qte.timer=setTimeout(()=>resolveQTE(false),e.window);
}

function showQTE(){
  const q=state.qte;
  $("qtePanel").classList.remove("hidden");
  $("qteTitle").textContent=q.type==="dodge"?"DODGE NOW":q.type==="block"?"BLOCK NOW":"TARGET NOW";
  $("qtePrompt").textContent=q.type==="target"?`${partLabel(q.target)}: STRIKE IT`:(q.prompt||"React!");
  $("qteTarget").textContent=q.type==="target"?partLabel(q.target):q.type.toUpperCase();
  $("qteHint").textContent=q.type==="dodge"?"Press DODGE or the D key":q.type==="block"?"Press BLOCK or the B key":"Use ATTACK or the A key on the highlighted part";
}

function resolveQTE(success){
  const q=state.qte;
  if(!q?.active)return;
  clearTimeout(q.timer);q.active=false;q.success=success;
  $("qtePanel").classList.add("hidden");
  if(success){
    addLog("QTE SUCCESS. The special attack is interrupted.","good");
    state.turn=true;
    if(q.type==="target")elitePartDamage(q.target,9999);
  }else{
    addLog(`${state.enemy.special} lands. ${state.enemy.specialText}`,"danger");
    let dmg=Math.round(state.enemy.atk*(q.type==="block"?1.45:1.25));
    if(q.type==="block" && state.guard)dmg=Math.round(dmg*.35);
    if(q.type==="dodge")dmg=Math.round(dmg*1.15);
    state.player.hp=clamp(state.player.hp-dmg,0,maxHp());
    state.guard=false;
    if(state.player.hp<=0){gameOver();return}
    state.turn=true;
  }
  renderAll();
}

function beginParryQTE(){
  if(!state.parryReady||!state.enemy||state.enemy.hp<=0)return;
  if(state.parryWindowTimer){clearTimeout(state.parryWindowTimer);state.parryWindowTimer=null}
  state.parryReady=false;
  const sequence=Array.from({length:5},()=>Math.random()<.5?"left":"right");
  state.parryQte={sequence,index:0,active:true,timer:null,stepTimer:null};
  showParryQTE();
  const q=state.parryQte;
  q.timer=setTimeout(()=>resolveParryQTE(false),6000);
  startParryStepTimer();
  renderAll();
}

function startParryStepTimer(){
  const q=state.parryQte;
  if(!q?.active)return;
  if(q.stepTimer)clearTimeout(q.stepTimer);
  q.stepTimer=setTimeout(()=>resolveParryQTE(false),1200);
}

function showParryQTE(){
  const q=state.parryQte;
  if(!q?.active)return;
  $("parryPanel").classList.remove("hidden");
  $("parrySequence").textContent=`STEP ${q.index+1} / 5`;
  $("parryTarget").textContent=q.sequence[q.index].toUpperCase();
  $("parryHint").textContent="Hit the highlighted side. Five steps, six seconds total.";
  $("parryLeft").classList.toggle("parry-target",q.sequence[q.index]==="left");
  $("parryRight").classList.toggle("parry-target",q.sequence[q.index]==="right");
}

function handleParryInput(side){
  const q=state.parryQte;
  if(!q?.active)return;
  if(side!==q.sequence[q.index]){resolveParryQTE(false);return}
  q.index++;
  if(q.index>=q.sequence.length){resolveParryQTE(true);return}
  showParryQTE();
  startParryStepTimer();
}

function resolveParryQTE(success){
  const q=state.parryQte;
  if(!q?.active)return;
  if(q.timer)clearTimeout(q.timer);
  if(q.stepTimer)clearTimeout(q.stepTimer);
  q.active=false;
  state.parryQte=null;
  $("parryPanel").classList.add("hidden");
  if(success){
    const heal=Math.max(1,Math.round(maxHp()*.05));
    state.player.hp=clamp(state.player.hp+heal,0,maxHp());
    state.turn=true;
    state.guard=false;
    addLog(`PERFECT PARRY. You interrupt the attack and recover ${heal} HP.`,"good");
    renderAll();
    return;
  }
  state.guard=false;
  addLog("The parry window is missed. The enemy gets its hit.","danger");
  performEnemyAttack();
}

function act(action,targetPart=null){
  if(action==="guard" && state.parryReady){
    beginParryQTE();
    return;
  }
  if(action==="dagger"){
    if(!state.turn||!state.enemy||state.enemy.hp<=0||state.qte?.active)return;
    if(state.throwingDaggers<=0){addLog("No throwing daggers left.","danger");renderAll();return}
    const r=playerDamage(.58,false,targetPart);
    state.throwingDaggers--;
    state.enemy.hp=clamp(state.enemy.hp-r.dmg,0,state.enemy.maxHp);
    if(state.enemy.isElite&&targetPart)elitePartDamage(targetPart,Math.max(3,Math.round(r.dmg*.35)));
    addLog(`You throw a dagger for ${r.dmg}${r.crit?" critical":""} damage. The enemy loses its turn window.` ,r.crit?"good":"");
    renderAll();
    if(state.enemy.hp<=0){victory();return}
    return;
  }
  if(!state.turn||!state.enemy||state.enemy.hp<=0)return;
  // QTE overrides normal combat actions.
  if(state.qte?.active){
    if(state.qte.type==="dodge" && action==="dodge"){resolveQTE(true);return}
    if(state.qte.type==="block" && action==="guard"){state.guard=true;resolveQTE(true);return}
    if(state.qte.type==="target" && action==="attack"){
      if(targetPart===state.qte.target){resolveQTE(true);return}
      addLog(`Wrong body part. The opening disappears.`,"danger");
      return;
    }
    return;
  }

  state.turn=false;
  const p=state.player;
  if(action==="attack"){
    playCombatAnimation("player");
    const r=playerDamage(1,false,targetPart);
    state.enemy.hp=clamp(state.enemy.hp-r.dmg,0,state.enemy.maxHp);
    if(state.enemy.isElite&&targetPart)elitePartDamage(targetPart,Math.max(5,Math.round(r.dmg*.55)));
    addLog(`You strike ${targetPart?`the ${partLabel(targetPart).toLowerCase()}`:""} for ${r.dmg}${r.crit?" critical":""} damage.`,r.crit?"good":"");
  }else if(action==="skill"){
    let total=0;
    playCombatAnimation("player");
    if(state.class==="knight"){
      const r=playerDamage(1.55,false,targetPart);total=r.dmg;state.guard=true;
      addLog(`Shield Bash deals ${r.dmg} and prepares Guard.`,"good");
    }else if(state.class==="ranger"){
      const a=playerDamage(getSkillMultiplier(),false,targetPart),b=playerDamage(getSkillMultiplier(),false,targetPart);total=a.dmg+b.dmg;
      addLog(`Twin Shot lands twice for ${total} damage.`,"good");
    }else{
      const r=playerDamage(getSkillMultiplier(),true,targetPart);total=r.dmg;
      addLog(`Arcane Burst tears through the enemy for ${r.dmg} magic damage.`,"good");
    }
    state.enemy.hp=clamp(state.enemy.hp-total,0,state.enemy.maxHp);
    if(state.enemy.isElite&&targetPart)elitePartDamage(targetPart,Math.max(5,Math.round(total*.45)));
  }else if(action==="guard"){
    state.guard=true;addLog("You brace for impact. Next damage is reduced.");
  }else if(action==="potion"){
    if(state.potions<=0){addLog("No potions left.");state.turn=true;return}
    const heal=Math.round(maxHp()*.35);p.hp=clamp(p.hp+heal,0,maxHp());state.potions--;addLog(`You recover ${heal} HP.`,"good");
  }
  renderAll();
  if(state.enemy.hp<=0){victory();return}
  setTimeout(enemyAttack,500);
}

function enemyAttack(){
  const p=state.player,e=state.enemy;
  if(!p||!e||e.hp<=0)return;
  state.parryReady=false;
  if(state.parryWindowTimer){clearTimeout(state.parryWindowTimer);state.parryWindowTimer=null}
  if(Math.random()<0.10){
    state.turn=false;
    state.parryReady=true;
    addLog(`${e.name} leaves an opening. Guard can trigger a parry QTE!`,"good");
    state.parryWindowTimer=setTimeout(()=>{
      state.parryWindowTimer=null;
      if(!state.parryReady)return;
      state.parryReady=false;
      addLog("The parry opening closes.","danger");
      performEnemyAttack();
    },1600);
    renderAll();
    return;
  }
  performEnemyAttack();
}

function performEnemyAttack(){
  const p=state.player,e=state.enemy;
  if(!p||!e||e.hp<=0)return;
  playCombatAnimation("enemy");
  let dmg=Math.max(1,Math.round(e.atk*(.85+Math.random()*.3)-p.stats.def*.38));
  if(state.guard)dmg=Math.round(dmg*.4);
  state.guard=false;p.hp=clamp(p.hp-dmg,0,maxHp());
  addLog(`${e.name} hits you for ${dmg} damage.`,"danger");
  if(p.hp<=0){gameOver();return}
  state.turn=true;
  renderAll();
  if(e.isElite && Math.random()<.42)setTimeout(beginEliteQTE,350);
}

function victory(){
  const e=state.enemy,p=state.player;
  clearCombatTimers();
  resetCombatAnimation();
  state.turn=false;
  state.kills++;state.gold+=e.gold;p.xp+=e.xp;
  if(e.isElite)state.eliteDefeated++;
  addLog(`${e.name} defeated. +${e.xp} XP, +${e.gold} gold.`,"good");
  while(p.xp>=p.level*100){
    p.xp-=p.level*100;p.level++;
    ["atk","wit","dex","def","vit"].forEach(k=>p.stats[k]++);
    p.hp=maxHp();addLog(`LEVEL UP! You reached level ${p.level}.`,"good");
  }
  renderAll();

  if(e.isBoss){
    addLog("The Hollow King falls. The merchant returns to the ruins.","good");
    queueTransition(openShop,900);
    return;
  }

  if(e.isElite){
    if(state.eliteDefeated===5)queueTransition(spawnFinalBoss,900);
    else queueTransition(openShop,900);
    return;
  }

  // Every fifth normal kill leads into the next elite encounter.
  // Non-milestone kills immediately start another normal encounter.
  queueTransition(spawnEnemy,state.kills%5===0?900:650);
}

function spawnFinalBoss(){
  clearCombatTimers();
  resetCombatAnimation();
  const boss={name:"The Hollow King",type:"FINAL BOSS",icon:"👑",hp:520,maxHp:520,atk:31,def:19,xp:300,gold:300,isBoss:true};
  state.enemy=boss;state.turn=true;
  addLog("The five elites fall silent. Something ancient answers from below.","danger");
  renderAll();
}

function openShop(){
  clearCombatTimers();
  resetCombatAnimation();
  state.turn=false;
  $("shopModal").classList.remove("hidden");
  const consumables=shopPool.filter(x=>x.consumable);
  const gear=shopPool.filter(x=>!x.consumable).sort(()=>Math.random()-.5).slice(0,4);
  const items=[...consumables,...gear].sort(()=>Math.random()-.5);
  $("shopItems").innerHTML=items.map(item=>{
    const price=item.cost;
    const buttonText=item.consumable?"BUY":"BUY";
    return `<div class="shop-item">
      <div class="item-icon">${item.icon}</div>
      <span class="muted">${item.kind}</span>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price"><b>${price} ◆</b><button class="buy" data-item="${shopPool.indexOf(item)}" ${state.gold<price?"disabled":""}>${buttonText}</button></div>
    </div>`;
  }).join("");
  document.querySelectorAll(".buy").forEach(b=>b.onclick=()=>buy(+b.dataset.item));
}

function buy(i){
  const item=shopPool[i];
  if(!item||state.gold<item.cost)return;
  state.gold-=item.cost;
  const p=state.player;
  if(item.consumable==="potion"){
    state.potions+=item.amount;
  }else if(item.consumable==="dagger"){
    state.throwingDaggers+=item.amount;
  }else{
    for(let j=0;j<item.effect.length;j+=2)p.stats[item.effect[j]]+=item.effect[j+1];
    if(item.name==="Steel Carapace")p.bonusHp+=24;
    if(item.kind==="WEAPON")p.weapon=item.name;
    if(item.kind==="ARMOR")p.armor=item.name;
    if(item.kind==="TRINKET")p.trinket=item.name;
  }
  addLog(`Purchased ${item.name}.`,"good");
  openShop();
  renderAll();
}

function renderParts(){
  const e=state.enemy;
  const box=$("bodyParts");
  if(!box)return;
  if(!e?.isElite){box.innerHTML="";box.classList.add("hidden");return}
  box.classList.remove("hidden");
  box.innerHTML=Object.entries(e.parts).map(([k,v])=>`
    <button class="part-btn ${v.hp<=0?"broken":""} ${state.qte?.target===k?"targeted":""}" data-part="${k}" ${v.hp<=0?"disabled":""}>
      <span>${partLabel(k)}</span><b>${Math.max(0,v.hp)}</b>
    </button>`).join("");
  box.querySelectorAll(".part-btn").forEach(b=>b.onclick=()=>act("attack",b.dataset.part));
}

function renderAll(){
  const p=state.player,e=state.enemy;if(!p||!e)return;
  $("run").textContent=String(state.run).padStart(2,"0");$("floor").textContent=1+Math.floor(state.kills/5);$("gold").textContent=state.gold;
  $("playerName").textContent=p.name;$("playerClass").textContent=p.role;$("playerAvatar").textContent=p.icon;$("playerSprite").querySelector(".sprite-core").textContent=p.icon;
  $("playerHpText").textContent=`${p.hp} / ${maxHp()}`;$("playerHpBar").style.width=`${p.hp/maxHp()*100}%`;
  $("combatHudName").textContent=p.name.toUpperCase();
  $("combatHudHpText").textContent=`${p.hp} / ${maxHp()} HP`;
  $("combatHudHpBar").style.width=`${p.hp/maxHp()*100}%`;
  $("combatHudStats").innerHTML=Object.entries(p.stats).map(([k,v])=>`<span>${k.toUpperCase()}<b>${v}</b></span>`).join("");
  $("xpText").textContent=`${p.xp} / ${p.level*100}`;$("xpBar").style.width=`${p.xp/(p.level*100)*100}%`;
  $("statGrid").innerHTML=Object.entries(p.stats).map(([k,v])=>`<div class="stat"><span>${k.toUpperCase()}</span><b>${v}</b></div>`).join("");
  $("weaponName").textContent=p.weapon;$("xpBar").style.width=`${p.xp/(p.level*100)*100}%`;
  $("statGrid").innerHTML=Object.entries(p.stats).map(([k,v])=>`<div class="stat"><span>${k.toUpperCase()}</span><b>${v}</b></div>`).join("");
  $("weaponName").textContent=p.weapon;$("armorName").textContent=p.armor;$("trinketName").textContent=p.trinket;
  $("enemyType").textContent=e.type;$("enemyName").textContent=e.name;$("enemyLevel").textContent=e.isBoss?"FINAL ENCOUNTER":e.isElite?"ELITE ENCOUNTER":`Lv. ${1+Math.floor(state.kills/5)}`;
  $("threat").textContent=e.isBoss?"FINAL BOSS":e.isElite?"ELITE":"THREAT "+["I","II","III","IV"][Math.min(3,Math.floor(state.kills/5))];
  $("enemySprite").querySelector(".sprite-core").textContent=e.icon;$("enemyHpText").textContent=`${e.hp} / ${e.maxHp}`;$("enemyHpBar").style.width=`${e.hp/e.maxHp*100}%`;
  $("kills").textContent=state.kills;$("shopProgress").textContent=`${state.eliteDefeated} / 5 elites`;$("bossProgress").textContent=`${Math.max(0,5-state.eliteDefeated)} ELITES`;
  $("skillName").textContent=p.skill;$("skillDesc").textContent=getSkillLabel();$("potionText").textContent=`${state.potions} remaining`;
  $("daggerText").textContent=`${state.throwingDaggers} remaining • free action`;
  const guardBtn=getGuardButton();
  if(guardBtn){
    guardBtn.classList.toggle("parry-ready",state.parryReady);
    guardBtn.querySelector("b").textContent=state.parryReady?"PARRY":"GUARD";
    guardBtn.querySelector("small").textContent=state.parryReady?"10% opening • 5-step QTE":"Reduce next hit";
  }
  const actionButtons=document.querySelectorAll('.actions [data-action]');
  actionButtons.forEach(btn=>{
    const action=btn.dataset.action;
    const parryEnabled=action==="guard"&&state.parryReady;
    const normalLocked=!state.turn&&!parryEnabled;
    const daggerLocked=action==="dagger"&&(state.throwingDaggers<=0 || !!state.qte?.active || !!state.parryQte?.active || !state.turn);
    btn.disabled=normalLocked||daggerLocked;
  });
  $("parryPanel").classList.toggle("hidden",!state.parryQte?.active);
  renderParts();
  $("combatLog").innerHTML=state.log.map(x=>`<div class="${x.type?'log-'+x.type:''}">› ${x.msg}</div>`).join("");
}

function gameOver(){
  $("gameOverText").textContent=`Run ${String(state.run).padStart(2,"0")} ended after ${state.kills} kills. Level ${state.player.level}. Nothing was saved.`;
  $("gameOverModal").classList.remove("hidden");
}

function restart(){
  clearCombatTimers();
  state=freshState();
  $("gameOverModal").classList.add("hidden");
  $("shopModal").classList.add("hidden");
  $("gameScreen").classList.add("hidden");
  $("classScreen").classList.remove("hidden");
  renderClasses();
}

document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>act(b.dataset.action));
$("qteDodge").onclick=()=>resolveQTE(state.qte?.type==="dodge");
$("qteBlock").onclick=()=>{if(state.qte?.type==="block")state.guard=true;resolveQTE(state.qte?.type==="block")};
$("parryLeft").onclick=()=>handleParryInput("left");
$("parryRight").onclick=()=>handleParryInput("right");
$("closeShop").onclick=()=>{$("shopModal").classList.add("hidden");spawnEnemy()};
$("restartBtn").onclick=restart;$ ("restartBtn2").onclick=restart;
window.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(state.parryQte?.active){
    if(k==="arrowleft"||k==="a")handleParryInput("left");
    if(k==="arrowright"||k==="d")handleParryInput("right");
    return;
  }
  if(!state.qte?.active)return;
  if(state.qte.type==="dodge"&&k==="d")resolveQTE(true);
  if(state.qte.type==="block"&&k==="b"){state.guard=true;resolveQTE(true)}
});
renderClasses();