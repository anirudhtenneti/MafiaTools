/**Shorthand*/
Id=(i)=>document.getElementById(i);
/**Get random item from array.
If `pop`, then remove that item.*/
Array.prototype.getRandom=function(pop) {
    let i=Math.floor(this.length*Math.random());
    let ans=this[i];
    pop&&this.splice(i,1);
    return ans;
}
/*Call f with probability p*/
chance=(p,f)=>Math.random()<p&&f();
players=[];
skipCount=0;
/*This means duplicate names are not OK*/
getPlayerByName=n=>players.find(x=>x.name==n);
getPlayerByRole=r=>players.find(x=>x.role.name==r);
livePlayers=()=>players.filter(x=>x.alive);
liveNames=()=>livePlayers().map(x=>x.name);
tonight=()=>nights[nights.length-1];
nightNum=()=>nights.length;
/**Get automod-supported roles*/
getAutoRoles=()=>{
    let t=new XMLHttpRequest();
    t.open('GET',`https://raw.githubusercontent.com/mafiaclub/mafiaclub.github.io/master/tiers/auto.json`);
    t.onloadend=()=>autoRoles=JSON.parse(t.responseText);
    t.send();
    let r=new XMLHttpRequest();
    r.open('GET',`https://raw.githubusercontent.com/mafiaclub/mafiaclub.github.io/master/roles.json`);
    r.onloadend=()=>roles=JSON.parse(r.responseText);
    r.send();
}
/**Get roles in tier*/
getTier=tier=>{
    window.autoRoles||getAutoRoles();
    window.tiers??={};
    window.autoTiers??={};
    if (!tiers[tier]) {
        let t=new XMLHttpRequest();
        t.onloadend=()=>{
            tiers[tier]=JSON.parse(t.responseText).roles;
            autoTiers[tier]={
                town:tiers[tier].filter(x=>autoRoles.town.includes(x)),
                mafia:tiers[tier].filter(x=>autoRoles.mafia.includes(x)),
                third:tiers[tier].filter(x=>autoRoles.third.includes(x))
            };
        };
        t.open('GET',`https://raw.githubusercontent.com/mafiaclub/mafiaclub.github.io/master/tiers/${tier}.json`);
        t.send();
    }
}
/**Faction distribution*/
getFactions=(gameSize)=>{
    let z=[];
    let nMafia=Math.ceil(gameSize/6);
    let nThird=Math.ceil((gameSize-8)/6);
    let nTown=gameSize-nMafia-nThird;
    for (let m=0; m<nMafia; m++) {
        z.push('mafia');
    }
    for (let t=0; t<nThird; t++) {
        z.push('third');
    }
    for (let t=0; t<nTown; t++) {
        z.push('town');
    }
    //Variability
    chance(.3,()=>nThird&&(z[z.indexOf('third')]='town'));
    chance(.2,()=>z[z.indexOf('mafia')]='third')||(chance(.1,()=>z=z.map(x=>x=='mafia'?'third':x))&&chance(.3,()=>z[z.indexOf('town')]='third'));
    return z;
}
showInfo=text=>{
    Id('info').innerHTML=text;
    Id('misc').show();
}
hideInfo=()=>Id('misc').close();
showRole=player=>{
    Id('who').innerText=player.name+', come get your role!';
    Id('role').innerText=player.role.name;
    Id('desc').innerText=player.role.desc;
    Id('desc').className=(Id('role').className=player.role.side.split(' ')[0].toLowerCase());
    Id('num').innerText=player.num;
    Id('roleHider').show();
    Id('yourRole').show();
}
nextRole=()=>turn<players.length?showRole(currentPlayer=players[turn++]):(Id('yourRole').close(),nextNight());
push1Visit=what=>Id('action2skip').checked||tonight().visits.push(new Visit(currentPlayer,getPlayerByName(Id('action2choices').value),what));
pushVisit2=what=>Id('action2skip').checked||tonight().visits.push(new Visit(currentPlayer,getPlayerByName(Id('action2choices2').value),what));
wake=(player,then)=>{
    Id('whom').innerText=(currentPlayer=player).num;
    Id('wake').onclick=()=>{Id('actionHider').close();then()};
    Id('actionHider').show();
}
mafiaKill=()=>action("Everyone awake with you right now is Mafia. If only you are awake, you are the only Mafia. The Mafia collectively decide who performs the kill (left) and who dies (right). When done, gesture to all other Mafia to sleep, and pass the device on."+(getPlayerByRole('Traitor')||getPlayerByRole('Traitor+')?'<br>A Traitor is in the game.':''),0,livePlayers().filter(x=>x.role.side=="Mafia"&&!nonWakingMafia.includes(x.role.name)||x.role.name=="Backstabber").map(x=>x.name),liveNames(),()=>{tonight().visits.push(new Visit(getPlayerByName(Id('action2choices').value),getPlayerByName(Id('action2choices2').value),"kill"))});
tellPlayer=(text,canPass,choice1,choice2)=>action(text,canPass,choice1,choice2);
visit1Player=(text,canPass,what,extraChoices,then,noSelf)=>action(text,canPass,liveNames().filter(n=>!noSelf||n!=currentPlayer.name),extraChoices,()=>{push1Visit(what);then&&then()});
visit2Players=(text,canPass,what,then,noSelf)=>action(text,canPass,liveNames().filter(n=>!noSelf||n!=currentPlayer.name),liveNames().filter(n=>!noSelf||n!=currentPlayer.name),()=>{push1Visit(what);pushVisit2(what);then&&then()});
action=(text,canPass,choices,choices2,handler)=>{
    currentActionHandler=handler||(()=>{});
    let r=currentPlayer.role;
    Id('action2role').innerText="Your role: "+r.name;
    Id('action2desc').innerText=r.desc;
    Id('action2').show();
    Id('action2prompt').innerHTML=text+(!tonight().action2done&&getInfo(r)?"<br>Your role will wake up again later to receive info or do another action. If applicable, remember your choice. It'd be embarrassing to find a guilty player but forget whom you checked.":'');
    Id('action2skip').checked=(Id('action2choices').disabled=false);
    Id('action2skip').disabled=!canPass;
    let d=Id('action2choices');
    d.innerHTML="";
    if (choices!=undefined) {
        d.style.visibility="";
        try {
            for (let c of choices) {
                d.innerHTML+=`<option>${c}</option>`;
            }
        } catch {
            d.innerHTML+=`<option>${choices}</option>`;
        }
    } else {
        d.style.visibility="hidden";
    }
    d=Id('action2choices2');
    d.innerHTML="";
    if (choices2!=undefined) {
        d.style.visibility="";
        try {
            for (let c of choices2) {
                d.innerHTML+=`<option>${c}</option>`;
            }
        } catch {
            d.innerHTML+=`<option>${choices2}</option>`;
        }
    } else {
        d.style.visibility="hidden";
    }
}
startDay=()=>{
    Id('day').show();
    let v=Id('vote');
    v.innerHTML='<optgroup label="No-vote"><option>No one</option></optgroup>';
    for (let c of liveNames()) {
        v.innerHTML+=`<option>${c}</option>`;
    }
    Id('vote').disabled=(Id('confirm').disabled=!(Id('night').disabled=true));
}
vote=()=>{
    let voted=getPlayerByName(Id('vote').value);
    voted&&((voted.role.name=="Escape Artist"&&livePlayers().filter(p=>p.role.side=='Mafia').length>1&&(nightNum()<2||(voted.role.wasVoted=1)))||(voted.alive=0));
    showInfo((voted?voted.alive?`${voted.name} survived being voted out!`:`${voted.name} was voted out and turned out to be the ${voted.role.name}!`+(voted.role.name=='Jester'?'<br>The Jester wins!':''):(skipCount++,'Everyone is safe…for now.'))+'<br>'+checkWinner());
    Id('skipCount').innerText=`The town has no-voted ${skipCount} time(s).`;
    Id('night').disabled=!(Id('vote').disabled=(Id('confirm').disabled=true));
}
endDay=()=>{
    Id('day').close();
    nextNight();
}
checkWinner=()=>{
    let l=livePlayers();
    if (l.length<1) return 'Everyone died! Stalemate!';
    if (l.every(p=>p.role.side=='Town'||lawfulEvil.includes(p.role.name))) return 'Town victory!';
    if (l.every(p=>p.role.side!='Third Party'||lawfulEvil.includes(p.role.name))) {
        let b=getPlayerByRole('Backstabber')
        if (b) {
            (l.filter(p=>p.role.side=="Mafia").length+1<l.length/2||((b.role=new Role('Serial Killer')).bulletproof=1));
        } else {
            if (l.filter(p=>p.role.side=="Mafia").length>=l.length/2) return 'Mafia victory!';
        }
    }
    let winning3rds=l.every(p=>p.role.side=='Third Party')?l.length==1?l.map(p=>p.role.name):allied3rd.find(a=>l.every(p=>a.includes(p.role.name))).filter(w=>players.some(p=>p.role.name==w)):0;
    if (winning3rds) return winning3rds.join(', ')+" victory!";
    return 'The game continues…';
}
class Player {
    constructor(id) {
        this.name=id;
        this.dying=!(this.alive=true);
        this.role=null;
    }
}
class Role {
    constructor(name) {
        this.name=name;
        let r=(roles.find((x)=>x.name==name));
        if (r===undefined) {throw "Invalid role"};
        this.desc=r.description;
        this.side=r.team;
        this.action1=/*Mafia kill*/this.side=="Mafia"&&!nonWakingMafia.includes(name)||this.name=="Backstabber";
        // this.action2=getSkill(this);
        // this.action3=getInfo(this);
        this.bulletproof=getBulletproof(this);
        this.uses=getUses(this);
        this.guilt=appearingGuilty.includes(this.name)?true:appearingInnocent.includes(this.name)?false:this.side!="Town";
    }
}
class Night {
    constructor() {
        this.visits=[];
        this.alive=livePlayers();
        this.actionQueue=[];
        this.announcements=[];
    }
    /*Changes to roles that should occur before waking
    them to avoid arbitrariness from wakeup order*/
    handleRoleChanges() {
        for (let p of this.alive) {
            p.role.tinkered&&(p.role.uses=getUses(p.role))&&(p.role.bulletproof=getBulletproof(p.role));
            p.role.shrunk&&p.role.side=='Third Party'&&(p.role=new Role('Townie'))&&this.actionQueue.push({player:p,action:()=>tellPlayer('Your role has changed! See above.')});
        }
    }
    handleReflects() {
        let s=getPlayerByRole('Sage')
        s&&this.visitsTo(getPlayerByRole('Sage')).forEach(v=>killingVisits.includes(v.act)||v.strong||(v.to=v.from));
    }
    handleRoleblocks() {
        let v=this.visits;
        let k=v.length;
        for (let i=0;i<k;i++) {
            if (v[i]!=null&&blockingVisits.includes(v[i].act)) {
                if (this.visitsTo(v[i].from).some(v=>blockingVisits.includes(v.act))) continue;
                let blockedPlayer=v[i].to;
                for (let j=0;j<k;j++) {
                    if (v[j]!=null&&v[j].from==blockedPlayer&&!v[j].strong) {
                        v[j]=null;
                    }
                }
            }
        }
        this.visits=this.visits.filter(v=>v);
    }
    /*Visits that should not be detected*/
    handleInvis() {
        // let i=this.visitsFromRole('Hitman');
        // i=i.concat(this.visitsFromRole('Scenic').filter(v=>v.act!='fake'));
        // let k=getPlayerByRole('Serial Killer');
        // k&&(k.role.guilt||(i=i.concat(this.visitsFrom(k))));
        // i=i.concat(this.visitsByType('tactic'));
        // i.forEach(v=>v.invis=1);
        for (let v of this.visits) {
            (v.from.role.name=='Hitman'||
            (v.from.role.name=='Scenic'&&v.act!='fake')||
            (v.from.role.name=="Serial Killer"&&!getPlayerByRole('Serial Killer').role.guilt)||
            v.act=='tactic')&&(v.invis=1);
        }
    }
    /*Roles like Illusionist, Siren, Bodyguard that change others' visits*/
    handleVisitChanges() {
        let s=getPlayerByRole('Illusionist');
        let i=this.visitsFrom(s).filter(v=>v.act=='illude');
        if (i.length==2) {
            let q=i[0].to;
            let z=i[1].to;
            for (let v of this.visits) {
                if (v.to==q) {
                    v.to=z;
                } else if (v.to==z) {
                    v.to=q;
                }
            }
        }
        (s=getPlayerByRole('Siren'))&&(
            i=this.visitsFrom(s).filter(v=>v.act=='charm'),
            i.forEach(c=>this.visitsFrom(c.to).forEach(v=>v.to=s))
        );
        (s=getPlayerByRole('Bodyguard'))&&(
            i=this.visitsFrom(s).filter(v=>v.act=='guard'),
            i.forEach(c=>this.visitsTo(c.to).forEach(v=>v.act=='guard'||(v.to=s)))
        );
    }
    /*Roles like Sleepwalker add visits that do nothing
    Also roles that affect their visitors*/
    handleFakeVisits() {
        let s=getPlayerByRole('Sleepwalker');
        s&&this.visits.push(new Visit(s,this.alive.getRandom(0)));
        s=getPlayerByRole('Night Crawler');
        s&&this.visits.push(new Visit(s,this.alive.getRandom(0)));
        s=getPlayerByRole('Paranoid Townie');
        s&&this.wasRoleRoleblocked('Paranoid Townie')||this.visitsTo(s,1).forEach(v=>{
            let a=new Visit(s,v.from,'kill');
            a.invis=1;
            this.visits.push(a)});
        s=getPlayerByRole('Veteran');
        s&&this.wasRoleRoleblocked('Veteran')||this.visitsFromRole('Veteran').length&&this.visitsTo(s,1).forEach(v=>{
            let a=new Visit(s,v.from,'kill');
            a.invis=1;
            this.visits.push(a)});
        s=getPlayerByRole('Electrician');
        s&&s.role.uses&&this.visitsTo(s,1).forEach(v=>{
            if (s.role.uses) {
                let a=new Visit(s,v.from,'kill');
                s.role.uses-=(a.strong=(a.invis=1));
                this.visits.push(a)
            }});
        s=getPlayerByRole('Shopkeeper');
        s&&this.wasRoleRoleblocked('Shopkeeper')||this.visitsTo(s,1).forEach(v=>{
            let a=new Visit(s,v.from,'save');
            a.invis=1;
            this.visits.push(a)});
        s=this.visits.find(v=>(v.from.role.name=="King"&&(v.to===null)));
        if (s) {
            this.visits=this.visits.filter(v=>v!=s);
            let q=getPlayerByRole('Queen');
            this.announcements.push(`No one may talk${q&&q.alive?` except ${q.name}`:''}!`)
        };
    }
    handleActChanges() {
        //Arms Dealer makes someone kill
        let b=this.visits.find(v=>v.act=='arm');
        b&&this.visitsFrom(b.to).forEach(v=>v.act='kill');
        //If Virgin "visited anyone" aka used ability, delete Virgin's visit and bard everyone
        // if (this.visitsFromRole('Virgin').length) {(this.visits=this.visits.filter(v=>v.from.role.name!="Virgin")).forEach(k=>killingVisits.includes(k.act)&&!k.strong&&!delayedKills.includes(k.act)&&(k.act=''))}
        if (this.visitsFromRole('Virgin').length) {this.alive.forEach(p=>{let v=new Visit(null,p,'save');v.strong=(v.invis=1);this.visits.push(v)})}
        else {
            (b=getPlayerByRole('Bard'))&&this.visitsFrom(b).forEach(v=>this.visitsFrom(v.to,1).forEach(k=>killingVisits.includes(k.act)&&!k.strong&&(k.act='')));
        }
        this.visitsByType('tinker').forEach(v=>v.to.role.tinkered=1);
        this.visitsByType('shrink').forEach(v=>v.to.role.shrunk=1);
    }
    /*Mafia that affect the communal kill*/
    mafiaKillEffects() {
        let v0=this.visits[0];
        if (!v0) return;
        if (v0.from.role.side=='Mafia'&&['kill','burn'].includes(v0.act)) {
            //Tactician ability
            let t=this.visits.find(v=>v.act=='tactic');
            t&&this.visitsTo(v0.to,2).find(v=>v!=v0&&killingVisits.includes(v.act))&&(v0.to=t.to);
            switch (v0.from.role.name) {
                case "Gravedigger":
                    v0.act='dig';
                    break;
                case "Sniper":
                    v0.act='snipe';
                    break;
                case "Frontman":
                    let f=getPlayerByRole('Frontman').role;
                    f.guilt||(f.guilt=(v0.invis=1));
                    break;
            }
        } else {v0.from.role.name=='Backstabber'&&(v0.act='')/*Backstabber can't kill*/}
    }
    burnPlayer(whom) {
        fireproof.includes(whom.role.name)||(whom.dying=3);
    }
    killPlayer(visit) {
        let whom=visit.to;
        whom.role.bulletproof-->0&&!visit.strong||(whom.dying=1+(visit.act=='dig'));
    }
    handleKills() {
        this.kills=[];
        this.saves=[];
        //Agoraphobe tentative kill
        this.visitsByType('agora').forEach(v=>this.visitsTo(v.to).length>1&&(v.act=''));
        this.visits.forEach(v=>killingVisits.includes(v.act)?this.kills.push(v):savingVisits.includes(v.act)?this.saves.push(v.to):v.act=='douse'&&(v.to.doused=1));
        //Arsonist ignition
        let i=this.visits.find(v=>["Arsonist","Douser"].includes(v.from.role.name)&&v.to===null);
        i&&(this.visits=this.visits.filter(v=>v!=i),this.alive.forEach(p=>p.doused&&(this.saves.includes(p)||this.burnPlayer(p))));
        //Delayed kills
        this.alive.forEach(p=>p.doom==nightNum()&&this.kills.push(new Visit(null,p,'kill')));
        //Normal kills
        this.kills.forEach(k=>k.to&&(this.saves.includes(k.to)&&!k.strong||(k.act=='burn'?this.burnPlayer(k.to):k.act=='snipe'?k.to.doom=nightNum()+1:this.killPlayer(k))));
        //Witch fate inversion
        this.visitsFromRole('Witch').forEach(v=>v.to.dying=v.to.dying?0:1);
        this.alive.forEach(p=>p.dying&&(p.alive=0));
    }
    run() {
        turn=0;
        let wakingMafia=this.alive.filter(x=>x.role.action1);
        if (wakingMafia.length) {
            for (let m=0;m<wakingMafia.length-1;m++) {
                this.actionQueue.push({player:wakingMafia[m],action:()=>{
                    window.currentActionHandler=()=>{};
                    action('The device will be passed around until all living Mafia are awake. Nothing to do for now. Pass the device on but do not sleep even if the next screen tells you to.'+(getPlayerByRole('Traitor')||getPlayerByRole('Traitor+')?'<br>A Traitor is in the game.':''))
                }});
            }
            this.actionQueue.push({player:wakingMafia[wakingMafia.length-1],action:mafiaKill});
        }
        this.handleRoleChanges();
        this.actionQueue=this.actionQueue.concat(this.alive.filter(x=>getSkill(x.role)).map(p=>({player:p,action:getSkill(p.role)})));
        this.nextAction();
    }
    nextAction() {
        let a=this.actionQueue[turn++];
        if (a) {wake(a.player,a.action)}
        else {
            turn--;
            this.action2done=1;
            {/*TODO: Evaluate the result of all actions performed in cycles 1 and 2, and 'visit changes' and other post-action2 stuff*/
                this.handleReflects();
                this.handleRoleblocks();
                this.handleInvis();
                this.handleVisitChanges();
                this.handleFakeVisits();
                this.handleActChanges();
                this.mafiaKillEffects();
                this.handleKills();
            }
            this.action3s();
        }
    }
    action3s() {
        // this.actionQueue=this.actionQueue.concat(this.alive.filter(x=>x.role.action3).map(p=>({player:p,action:p.role.action3})));
        this.actionQueue=this.actionQueue.concat(this.alive.filter(x=>getInfo(x.role)).map(p=>({player:p,action:getInfo(p.role)})));
        this.nextAction3();
    }
    nextAction3() {
        let a=this.actionQueue[turn++];
        a?wake(a.player,a.action):wake((livePlayers().length?livePlayers():players).getRandom(),()=>{Id('morn').show()});
    }
    whatToAnnounce() {
        for (let p of this.alive) {
            switch (p.dying) {
                case 1:
                case 2:
                    this.announcements.push(p.name+' died! '+p.name+(p.dying%2?' was the '+p.role.name:"'s role was not revealed")+'.');
                    break;
                case 3:
                case 4:
                    this.announcements.push(p.name+' burned to death! '+p.name+(p.dying%2?' was the '+p.role.name:"'s role was not revealed")+'.');
                    break;
            }
        }
        for (let v of this.visits) {
            switch (v.act) {
                case "milk":
                    this.announcements.push(v.to.name+" received milk!");
                    break;
                case "hook":
                    this.announcements.push(v.to.name+" is silenced this round!");
                    break;
            }
        }
        // this.announcements.push(checkWinner());
    }
    announce() {
        this.whatToAnnounce();
        Id('announcements').innerHTML=(this.announcements.length?this.announcements:["Nothing to announce!"]).concat(checkWinner()).map(a=>`<li>${a}</li>`).join('');
        Id('result').show();
    }
    visitsTo(player,includeInvis) {
        return player?this.visits.filter(v=>v&&v.to&&v.to==player&&(!v.invis||includeInvis)):[];
    };
    visitsFrom(player,includeInvis) {
        return player?this.visits.filter(v=>v&&v.from&&v.from==player&&(!v.invis||includeInvis)):[];
    };
    visitsFromRole(role,includeInvis) {
        return role?this.visits.filter(v=>v.from&&v.from.role.name==role&&(!v.invis||includeInvis)):[];
    };
    visitsByType(act) {
        return this.visits.filter(v=>v.act==act);
    };
    wasRoleRoleblocked(role) {
        return this.visitsTo(getPlayerByRole(role)).some(v=>blockingVisits.includes(v.act));
    }
}
class Visit {
    constructor(from,to,what) {
        this.from=from;
        this.to=to;
        this.act=what;
    }
}
giveRoles=(rolesOverride)=>{
    window.autoRoles||getAutoRoles();
    nights=[];
    let names=Id('names').value.split('\n').map(n=>n.trim());
    for (let i=0;i<names.length;i++) {
        for (let j=0;j<i;j++) {
            if (names[i]==names[j]) {return alert('No duplicate names')}
        }
    }
    let tier=Id('tier').value;
    setTimeout(()=>showInfo('Loading…'),1);
    (window.autoTiers&&window.autoTiers[tier])||getTier(tier);
    setTimeout(()=>{
        players=[];
        names.forEach(n=>players.push(new Player(n)));
        let nums=[1];
        for(let i=1;i<players.length;nums.push(i+=1)){}
        nums.sort(()=>Math.random()-0.5).forEach((n,i)=>players[i].num=n);
        let roles=getFactions(players.length);
        let tierCopy={town:autoTiers[tier].town.flat(),mafia:autoTiers[tier].mafia.flat(),third:autoTiers[tier].third.flat()};
        //TODO remove rolesOverride
        roles=rolesOverride??roles.map((f)=>tierCopy[f].getRandom(true)||tierCopy['town'].getRandom(true)||'Townie').sort(()=>Math.random()-0.5);
        for (let i=0;i<roles.length;i++) {
            let s=sidekicks.find(k=>k[1]==roles[i]);
            s&&(roles.some(q=>q==s[0])||(roles[i]=s[0]));
        }
        roles.includes("Spy")&&(spyInfo=tierCopy['town'].getRandom(1));
        roles=roles.map(r=>new Role(r));
        if (roles.every(r=>r.side!='Mafia'||nonWakingMafia.includes(r.name))) {
            for (let i=0;i<roles.length;i++) {
                let n=roles[i].name;
                (n=="Backstabber"||nonWakingMafia.includes(n))&&(roles[i]=new Role(tierCopy['mafia'].getRandom(1)));
            }
        }
        roles.forEach((r,i)=>players[i].role=r);
        hideInfo();
        turn=0;
        nextRole();
    },1000);
}
nextNight=()=>{
    showInfo('If you are holding the device, tell everyone to sleep. If you are alive, click OK when everyone else is asleep. If you are dead, click OK when everyone is asleep, then wake any living player and give them the device.');
    let n=new Night();
    nights.push(n);
    n.run();
}
showHelp=()=>{
    Id('help').showModal();
    if (!Id('roleList').innerHTML) {
        for (let s of ['town','mafia','third']) {
            for (let r of autoRoles[s].sort()) {
                Id('roleList').innerHTML+=`<li class="${s}">${r}</li>`;
            }
        }
    }
}
init=()=>{
    // setTimeout(()=>{
    //     nights.push(new Night())
    //     p1=new Player("P1");
    //     p2=new Player("P2");
    //     p1.role=new Role("1-Shot Bulletproof Mafia");
    //     p1.num=-1;
    //     p2.role=new Role("Bootlegger");
    //     p2.num=-2;
    //     currentPlayer=p2;
    // },500);
    Id('names').value=`Q
W
E
R
     \t This name has spaces at the ends \t
Y
U
I
O
P`;
    Id('tier').value='all';
    getAutoRoles();
}