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
    t.open('GET',`auto.json`);
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
sideClass=role=>(role.side||role.team).split(' ')[0].toLowerCase();
showRole=player=>{
    Id('who').innerText=player.name+', come get your role!';
    Id('role').innerText=player.role.name;
    Id('desc').innerText=player.role.desc;
    Id('desc').className=(Id('role').className=sideClass(player.role));
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
mafiaKill=()=>action("Everyone awake with you right now is Mafia. If only you are awake, you are the only Mafia. The Mafia collectively decide who performs the kill (left) and who dies (right). When done, gesture to all other Mafia to sleep, and pass the device on."+(nightNum()==1&&(getPlayerByRole('Traitor')||getPlayerByRole('Traitor+'))?'<br>A Traitor is in the game.':''),0,livePlayers().filter(x=>x.role.side=="Mafia"&&!nonWakingMafia.includes(x.role.name)||x.role.name=="Backstabber").map(x=>x.name),liveNames(),()=>{tonight().visits.push(new Visit(getPlayerByName(Id('action2choices').value),getPlayerByName(Id('action2choices2').value),"kill"))});
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
clearNomination=p=>{
    if (tonight().nominated!=p){p.nominations=0;
    let v=p.voteBox;
    v.nominateBtn.disabled=!(v.secondBtn.disabled=(v.clearBtn.disabled=1));}
}
nominate=p=>{
    p.nominations=1;
    let v=p.voteBox;
    v.nominateBtn.disabled=!(v.secondBtn.disabled=(v.clearBtn.disabled=0));
}
second=p=>{
    p.nominations=2;
    let v=p.voteBox;
    v.nominateBtn.disabled=(v.secondBtn.disabled=(v.clearBtn.disabled=1));
    let n=tonight().block.push(p);
    if (n==blockSize) {
        Id('endBlock').disabled=livePlayers().forEach(p=>{
            p.voteBox.clearBtn.disabled=p.voteBox.nominateBtn.disabled=p.voteBox.secondBtn.disabled=1;
        });
    } else if (n==blockSize-1) {
        let a=tonight().accused;
        a&&(tonight().block.includes(a)||second(alert(a.name+' was added to the block!')||a));
    }
    Id('blocklist').innerText=tonight().block.map(p=>p.name).join(', ');
}
startNominations=()=>{
    let live=livePlayers().length;
    blockSize=live<8?2:3;
    try {getPlayerByRole('Hangman').alive&&blockSize++}catch{}
    Id('block').show();
    Id('votes').innerHTML='';
    tonight().block=[];
    Id('blocklist').innerText='No one';
    if (live>3) {
        Id('endBlock').disabled=Id('blockSize').innerText=`Proceed to defenses when ${blockSize} people are on the block.`;
        for (let p of livePlayers()) {
            p.nominations=0+(tonight().nominated==p);
            let v=document.createElement('div');
            v.style.display='inline-block';
            v.style.border='1px white solid';
            v.style.width='46%';
            let n=document.createElement('label');
            n.style.margin=((p.voteBox=v).style.margin='2px');
            n.innerText=(v.player=p).name;
            v.appendChild(n);
            n=document.createElement('button');
            n.innerText='Clear nomination';
            n.disabled=1;
            n.style.background='#8f8';
            n.addEventListener('click',()=>{clearNomination(v.player)});
            v.appendChild(v.clearBtn=n);
            n=document.createElement('button');
            n.innerText='Nominate';
            n.disabled=p.nominations;
            n.style.background='#ff8';
            n.addEventListener('click',()=>{nominate(v.player)});
            v.appendChild(v.nominateBtn=n);
            n=document.createElement('button');
            n.innerText='Second';
            n.disabled=!p.nominations;
            n.style.background='#f88';
            n.addEventListener('click',()=>{second(v.player)});
            v.appendChild(v.secondBtn=n);
            Id('votes').appendChild(v)
        }
    } else {
        Id('blockSize').innerText='Too few players to make a block. Voting is done by mob rule.';
        Id('endBlock').disabled=tonight().block=null;
    }
}
startVotes=info=>{
    Id('day').show();
    info?(Id('voteInfo').innerHTML=info,Id('voteInfo').style.display=''):Id('voteInfo').style.display='none';
    let v=Id('vote');
    v.innerHTML='<optgroup label="No execution"><option value="">No-vote motion passed</option><option>3 consecutive ties</option></optgroup>';
    for (let c of (tonight().block&&tonight().block.filter(p=>p.alive)||livePlayers()).map(p=>p.name)) {
        v.innerHTML+=`<option>${c}</option>`;
    }
    Id('reblock').disabled=(Id('vote').disabled=(Id('confirm').disabled=!(Id('night').disabled=1)));
}
vote=()=>{
    let voted=getPlayerByName(Id('vote').value);
    voted&&tonight().voted.push(voted);
    tonight().block&&tonight().voted.length&&tonight().block.includes(tonight().framed)&&(tonight().voted.push(voted=tonight().framed));
    voted&&((voted.role.name=="Escape Artist"&&livePlayers().filter(p=>p.role.side=='Mafia').length>1&&(nightNum()<2||(voted.role.wasVoted=1)))||(voted.dying=!(voted.alive=0)));
    showInfo((voted?voted.alive?`${voted.name} survived being voted out!`:`${voted.name} was voted out and turned out to be the ${roleSpan(voted)}!`+(voted.role.name=='Jester'?'<br>Jester wins!':''):((Id('vote').value==''&&skipCount++),'The town abstained.'))+'<br>'+tonight().wounds.map(p=>p.name+' died! '+p.name+(p.dying%2?' was the '+roleSpan(p):"'s role was not revealed")+'.').join('<br>')+'<br>'+checkWinner());
    Id('skipCount').innerText=`The town has no-voted ${skipCount} time(s).`;
    let h=getPlayerByRole('Hangman');
    if (h&&h.alive&&tonight().voted.length==1) {
        return startVotes('<span class="mafia">The Hangman demands another execution.</span>');
    }
    tonight().alive.forEach(p=>{delete p.voteBox});
    Id('night').disabled=!(Id('reblock').disabled=(Id('vote').disabled=(Id('confirm').disabled=true)));
}
endDay=()=>{
    Id('day').close();
    nextNight();
}
checkWinner=()=>{
    gameOver=1;
    let msg;
    let l=livePlayers();
    if (l.length<1) msg='Everyone died! Stalemate!';
    else if (l.every(p=>p.role.side=='Town'||lawfulEvil.includes(p.role.name))) msg='<span class="town">Town victory!</span>';
    else if (l.every(p=>p.role.side!='Third Party'||lawfulEvil.includes(p.role.name))) {
        let b=getPlayerByRole('Backstabber')
        if (b) {
            (l.filter(p=>p.role.side=="Mafia").length+1<l.length/2||((b.role=new Role('Serial Killer')).bulletproof=1));
        } else {
            if (l.filter(p=>p.role.side=="Mafia").length>=l.length/2) msg='<span class="mafia">Mafia victory!</span>';
        }
    } else {
        let winning3rds;
        if (l.every(p=>p.role.side=='Third Party')) {
            if (l.length==1) {
                winning3rds=l.map(p=>p.role.name);
            } else {
                let a=allied3rd.find(a=>l.every(p=>a.includes(p.role.name)));
                a&&(winning3rds=a.filter(w=>players.some(p=>p.role.name==w)));
            }
            if (winning3rds) {msg=`<span class="third">${winning3rds.join(', ')} victory!</span>`};
        }
    }
    if (msg) {
        return msg+'<br><button onclick="showInfo(gameLog())">Click to see game log</button>';
    }
    gameOver=0;
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
        this.bulletproof=getBulletproof(this);
        this.uses=getUses(this);
        this.guilt=appearingGuilty.includes(this.name)?true:appearingInnocent.includes(this.name)?false:this.side!="Town";
    }
}
class Night {
    constructor() {
        this.voted=[];
        this.visits=[];
        this.alive=livePlayers();
        this.actionQueue=[];
        this.announcements=[];
        this.wounds=[];
        this.roles=[];
    }
    /*Changes to roles that should occur before waking
    them to avoid arbitrariness from wakeup order*/
    handleRoleChanges() {
        for (let p of this.alive) {
            if (p.role.zombied) {
                delete p.role.zombied;
                let o=structuredClone(p.role);
                (p.role=new Role('Zombie')).bulletproof=0;
                p.role.zombifiedBy=o.zombifiedBy;
                delete o.zombifiedBy;
                p.originalRole=o;
                this.actionQueue.push({player:p,action:()=>tellPlayer('You were zombified! You win and die with the original Zombie.')})
            } else if (p.role.shrunk) {
                p.role.side=='Third Party'&&(p.role=new Role('Townie'))&&this.actionQueue.push({player:p,action:()=>tellPlayer('You became a Townie and now win with the Town.')});
            } else if (p.role.extorted) {
                p.role.side=='Town'&&(p.role=new Role('Traitor'))&&this.actionQueue.push({player:p,action:()=>tellPlayer('You became a Traitor and now win with the Mafia.')});
            } else {
                p.role.tinkered==nightNum()&&((p.role.uses=getUses(p.role)),(p.role.bulletproof=getBulletproof(p.role)));
            }
            this.roles[p.name]=p.role;
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
            i.forEach(c=>this.visitsFrom(c.to).forEach(v=>v.to==samplePlayer||(v.to=s)))
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
        if (s&&this.wasRoleRoleblocked('Veteran')||this.visitsFromRole('Veteran').length) {
            this.visits=this.visits.filter(v=>v.from.role.name!='Veteran');
            this.visitsTo(s,1).forEach(v=>{
            let a=new Visit(s,v.from,'kill');
            a.invis=1;
            this.visits.push(a)});
        };
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
        s=this.visits.find(v=>(v.from.role.name=="King"&&(v.to==samplePlayer)));
        if (s) {
            this.visits=this.visits.filter(v=>v!=s);
            let q=getPlayerByRole('Queen');
            this.announcements.push(`No one may talk${q&&q.alive?` except ${q.name}`:''}!`)
        };
    }
    /*Roles affecting others' actions*/
    handleActChanges() {
        //Arms Dealer makes someone kill
        let b=this.visits.find(v=>v.act=='arm');
        b&&this.visitsFrom(b.to,1).forEach(v=>v.act='kill');
        //If Virgin "visited anyone" aka used ability, delete Virgin's visit and bard everyone
        if (this.visitsFromRole('Virgin').length) {this.visits=this.visits.filter(v=>v.from.role.name!="Virgin");this.alive.forEach(p=>{let v=new Visit(samplePlayer,p,'save');v.strong=(v.invis=1);this.visits.push(v)})}
        else {
            (b=getPlayerByRole('Bard'))&&this.visitsFrom(b,1).forEach(v=>this.visitsFrom(v.to,1).forEach(k=>killingVisits.includes(k.act)&&!k.strong&&(k.act='')));
        }
    }
    handleMisc() {
        for (let v of this.visits) {
            switch (v.act) {
                case 'tinker':
                    v.to.role.tinkered=nightNum()+1;break;
                case 'shrink':
                    v.to.role.shrunk=1;break;
                case 'zombify':
                    let z=v.to.role;
                    if (z.name!='Zombie'&&!this.visitsTo(v.to,2).some(v=>savingVisits.includes(v.act))) {
                        z.zombied=1;
                        z.zombifiedBy=v.from.name;
                    }
                    break;
                case 'frame':
                    this.actionQueue.push({player:v.to,action:()=>tellPlayer('You are framed! If you are on the block today, you die even if someone else has majority vote.')});
                case 'accuse':
                case 'nominate':
                    this[v.act+'d']=v.to;break;
                case 'poison':
                    this.actionQueue.push({player:v.to,action:()=>tellPlayer("You are poisoned! You'll die next night if not saved.")});
                    v.to.poison==nightNum()||(v.to.poison=nightNum()+1);break;
                case 'extort':
                    v.to.role.extorted=1;break;
            }
        }
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
        //Agoraphobe, Glass Cannon tentative kills
        this.visitsByType('agora').forEach(v=>v.act=(this.visitsTo(v.to).length>1?'':'kill'));
        this.visitsByType('glass').forEach(v=>v.act=(this.visitsTo(v.from).length>0?(this.visits.push({to:v.from,from:samplePlayer,act:'kill',invis:5,strong:5}),''):'kill'));
        this.visits.forEach(v=>killingVisits.includes(v.act)?this.kills.push(v):savingVisits.includes(v.act)?this.saves.push(v.to):v.act=='douse'&&(v.to.doused=1));
        //Arsonist ignition
        let i=this.visits.find(v=>["Arsonist","Douser"].includes(v.from.role.name)&&v.act=='burn');
        i&&(this.visits=this.visits.filter(v=>v!=i),this.alive.forEach(p=>p.doused&&(this.saves.includes(p)||this.burnPlayer(p))));
        //Delayed kills
        this.alive.forEach(p=>p.poison==nightNum()?this.saves.includes(p)?this.visitsTo(p).find(v=>v.act=='poison')&&(p.poison=nightNum()+1):p.dying=5:p.doom==nightNum()&&this.kills.push(new Visit(samplePlayer,p,'kill')));
        //Normal kills
        this.kills.forEach(k=>k.to&&(this.saves.includes(k.to)&&!k.strong||(k.act=='burn'?this.burnPlayer(k.to):k.act=='poison'?1:k.act=='snipe'?k.to.doom=nightNum()+1:this.killPlayer(k))));
        //Witch fate inversion and zombie cure
        this.visitsFromRole('Witch').forEach(v=>v.to.role.name=="Zombie"&&v.to.role.originalRole?(v.to.dying=0,v.to.role=v.role.originalRole):v.to.dying=v.to.dying?0:1);
        //Converted zombies die with the original
        let originalZombie=players.find(p=>p.role.name=="Zombie"&&!p.role.zombifiedBy);
        originalZombie&&((!originalZombie.dying&&originalZombie.role.name=="Zombie")||livePlayers().forEach(p=>{
            let v={to:p,from:samplePlayer,act:'kill',invis:1,strong:2};
            p.role.name=='Zombie'&&this.killPlayer(v)&&tonight().visits.push(v);
        }))
        this.alive.forEach(p=>p.dying&&(p.alive=0));
    }
    run() {
        turn=0;
        this.handleRoleChanges();
        let wakingMafia=this.alive.filter(x=>x.role.action1);
        if (wakingMafia.length) {
            for (let m=0;m<wakingMafia.length-1;m++) {
                this.actionQueue.push({player:wakingMafia[m],action:()=>{
                    window.currentActionHandler=()=>{};
                    action('The device will be passed around until all living Mafia are awake. Nothing to do for now. Pass the device on but do not sleep even if the next screen tells you to.'+(nightNum()==1&&(getPlayerByRole('Traitor')||getPlayerByRole('Traitor+'))?'<br>A Traitor is in the game.':''))
                }});
            }
            this.actionQueue.push({player:wakingMafia[wakingMafia.length-1],action:mafiaKill});
        }
        this.actionQueue=this.actionQueue.concat(this.alive.filter(x=>getSkill(x.role)).map(p=>({player:p,action:getSkill(p.role)})));
        this.nextAction();
    }
    nextAction() {
        let a=this.actionQueue[turn++];
        if (a) {wake(a.player,a.action)}
        else {
            turn--;
            this.action2done=1;
            {
                this.handleReflects();
                this.handleRoleblocks();
                this.handleInvis();
                this.handleVisitChanges();
                this.handleFakeVisits();
                this.handleActChanges();
                this.handleMisc();
                this.mafiaKillEffects();
                this.handleKills();
            }
            this.action3s();
        }
    }
    action3s() {
        this.actionQueue=this.actionQueue.concat(this.alive.filter(x=>getInfo(x.role)).map(p=>({player:p,action:getInfo(p.role)})));
        this.nextAction3();
    }
    nextAction3() {
        let a=this.actionQueue[turn++];
        a?wake(a.player,a.action):wake((livePlayers().length?livePlayers():players).getRandom(),()=>{Id('morn').show()});
    }
    whatToAnnounce() {
        let shouldWound=getPlayerByRole('General');
        shouldWound=shouldWound&&shouldWound.alive&&!this.wasRoleRoleblocked('General');
        for (let p of this.alive) {
            switch (p.dying) {
                case 1:
                case 2:
                    if (shouldWound) {
                        this.announcements.push(p.name+' is mortally wounded and will die after the vote!');
                        this.wounds.push(p);
                    }
                    else this.announcements.push(p.name+' died! '+p.name+(p.dying%2?' was the '+roleSpan(p):"'s role was not revealed")+'.');
                    break;
                case 3:
                case 4:
                    this.announcements.push(p.name+' burned to death! '+p.name+(p.dying%2?' was the '+roleSpan(p):"'s role was not revealed")+'.');
                    break;
                case 5:
                    this.announcements.push(p.name+' died of poisoning! '+p.name+' was the '+roleSpan(p)+'.');
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
                case "nominate":
                    this.announcements.push(v.to.name+" has a nomination!");break;
            }
        }
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
    skipCount=0;
    reblockCount=0;
    window.autoRoles||getAutoRoles();
    afterAnnouncements=Id('useBlock').checked?(Id('reblock').style.display='',startNominations):(Id('reblock').style.display='none',startVotes);
    nights=[];
    let names=Id('names').value.split('\n').map(n=>n.trim());
    if (names.length<4) {return alert('At least 4 players needed')}
    for (let i=0;i<names.length;i++) {
        for (let j=0;j<i;j++) {
            if (names[i].length<1) return alert('No blank names')
            if (names[i].length>49) names[i]=names[i].substr(0,50);
            if (names[i]==names[j]) return alert('No duplicate names')
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
        let pool=getFactions(players.length);
        let tierCopy={town:autoTiers[tier].town.flat(),mafia:autoTiers[tier].mafia.flat(),third:autoTiers[tier].third.flat()};
        Id('noBoring').checked&&(tierCopy.town=tierCopy.town.filter(x=>!boring.includes(x)));
        let br=x=>!blockRoles.includes(x);
        Id('useBlock').checked||(tierCopy.town=tierCopy.town.filter(br),tierCopy.mafia=tierCopy.mafia.filter(br));
        pool=rolesOverride??pool.map((f)=>tierCopy[f].getRandom(true)||tierCopy['town'].getRandom(true)||'Townie').sort(()=>Math.random()-0.5);
        pool.includes("Spy")&&(spyInfo=tierCopy['town'].getRandom(1));
        pool=pool.map(r=>new Role(r));
        if (pool.every(r=>r.side!='Mafia'||nonWakingMafia.includes(r.name))) {
            for (let i=0;i<pool.length;i++) {
                let n=pool[i].name;
                (n=="Backstabber"||nonWakingMafia.includes(n))&&(pool[i]=new Role(tierCopy['mafia'].getRandom(1)));
                lawfulEvil.includes(n)&&(pool[i]=new Role(tierCopy['third'].getRandom(1)));
            }
        }
        /*If only 1 Mafia role, make sure it's not one that can't work solo*/
        pool.filter(r=>r.side=="Mafia"&&!nonWakingMafia.includes(r.name)).length==1&&pool.forEach((r,i)=>{
            if (r.side=="Mafia"&&!nonWakingMafia.includes(r.name)) {
                while (noSoloMafia.includes(pool[i].name)) pool[i]=new Role(tierCopy.mafia.getRandom(1))
            }
        })
        for (let i=0;i<pool.length;i++) {
            let s=sidekicks.find(k=>k[1]==pool[i].name);
            s&&(pool.some(q=>q.name==s[0])||(pool[i]=new Role(s[0])));
        }
        pool.forEach((r,i)=>players[i].role=r);
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
        for (let r of roles) {
            let s=sideClass(r);
            autoRoles[s]&&autoRoles[s].includes(r.name)&&(Id('roleList').innerHTML+=`<li class="${s}" title="${r.description}" style="cursor:help;width:fit-content">${r.name}</li>`);
        }
    }
}
roleSpan=(player,nightIndex)=>{
    let role=nightIndex!=undefined?(nights[nightIndex].roles[player.name]||player.role):player.role;
    return `<span class="${sideClass(role)}">${role.name}</span>`};
logPlayer=(player,nightIndex)=>player.name+` (${roleSpan(player,nightIndex)})`;
gameLog=()=>`<h3>Roles:</h3><ul>`+players.map(p=>`<li>${p.name}: ${roleSpan(p,0)}</li>`).join('')+`</ul>`+nights.map((n,i)=>`<h3>Night ${i+1}</h3><ul>${n.visits.length?n.visits.map(v=>`<li>${logPlayer(v.from,i)} used ${(v.invis?'INVISIBLE ':'')+(v.strong?'INFALLIBLE ':'')+(v.act||'NOTHING').toUpperCase()} on ${logPlayer(v.to,i)}</li>`).join(''):'No visits.'}</ul><h3>Day ${i+1}</h3><ul>${n.announcements.length?`<li>${n.announcements.join('</li><li>')}</li>`:''}${n.block?'<li>'+n.block.map(q=>logPlayer(q,i)).join(', ')+" were on the block.</li>":''}<li>Executed: ${`${n.voted.length?n.voted.map(q=>logPlayer(q,i)).join(', '):'No one'}.`}</li></ul>`).join('')+`<h4>${checkWinner().split('<br>')[0]}</h4>`;
init=()=>{
    Id('tier').value='all';
    getAutoRoles();
    (samplePlayer=new Player('Automod')).role={name:"Mod",side:"Fourth Party"};
}