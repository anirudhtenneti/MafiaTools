//Mafia that do not wake with the others
nonWakingMafia=["Traitor","Traitor+"/*,"Lawyer"*/];
//Roles that appear innocent initially
appearingInnocent=["Godfather","Frontman","Backstabber"];
//Roles that appear guilty initially
appearingGuilty=["Miller","Tree-Hat"];
//What Bard prevents and Sage cannot reflect
killingVisits=["kill","burn","agora","dig","snipe"];
//3rd parties winning together
allied3rd=[["Serial Killer","Admirer"],["Arsonist","Douser"]];
//Roles that take over for others.
sidekicks=[["Serial Killer","Admirer"],["Sheriff","Deputy"],["Arsonist","Douser"]];
//Roles that cannot burn.
fireproof=["Fireproof Townie","Fireproof Mafia","Backstabber"];
savingVisits=['save','jail'];
blockingVisits=['roleblock','jail','waterboard'];
delayedKills=['snipe']
//Evils who don't block the town/mafia win condition
lawfulEvil=["Traitor",/*"Lawyer",*/"Jester"/*,"Monk"*/,"Backstabber"]
//Abilities other than mafia kill
getSkill=(role)=>{
    switch (role.name) {
        case "Serial Killer":
            return ()=>{
                //SK is automatically assumed to have picked 1-shot innocent invisible if having <2 bulletproof.
                if (nightNum()==1) {
                    visit1Player(`Choose your first victim (left) and buff for the game (right).<br>There is ${getPlayerByRole('Admirer')?'an':'no'} Admirer.`,0,'kill',['Infinite bulletproof','1-shot bulletproof, innocent, invisible'],()=>Id('action2choices2').value.startsWith(1)&&(role.bulletproof=1,role.guilt=0));
               } else {visit1Player("Kill whom?",0,"kill")}
            };
        case "Madman":
            return ()=>tonight().visits[0].from.role.name!='Madman'?visit1Player("Kill whom?",0,"kill"):tellPlayer('You performed the mafia kill. No extra kill.');
        case "Traitor+":
            if (tonight().alive.length>3) return null;
        case "1-Shot Vigilante":
        case "2-Shot Vigilante":
            return role.uses?()=>visit1Player(`Do you want to kill?<br>${role.uses} use(s) left.`,1,"kill",null,()=>Id('action2skip').checked||((role.uses-=1)&&turn--)):null;
        case "Milkman":
            return ()=>visit1Player("Who gets milk?",0,"milk");
        case "Deputy":
            let s=getPlayerByRole('Sheriff');
            if (s&&s.alive) return null/*()=>tellPlayer("The Sheriff is alive. Your work has not begun.")*/;
        case "Sheriff":
            return ()=>visit1Player("Investigate whom?",0,"info");
        case "Bootlegger":
        case "Bartender":
            return ()=>visit1Player("Roleblock whom?",0,"roleblock");
        case "Consigliere":
            return ()=>visit1Player("See whose role?",0,"info");
        case "Tracker":
            return ()=>visit1Player("Track whom?",0,"info");
        case "Watcher":
            return ()=>visit1Player("Watch whom?",0,"info");
        case "Scenic":
            return ()=>visit1Player("Whom will you APPEAR to visit?",0,"fake");
        case "Bard":
            return ()=>visit1Player("Whom will you prevent from killing?",0,"bard");
        case "Arms Dealer":
            return role.uses?()=>visit1Player("Do you want to arm someone?",1,"arm",null,()=>Id('action2skip').checked||role.uses--):null;
        case "Igniter":
            return role.uses?()=>action(`Turn the Mafia kill into a burn?<br>${role.uses} use(s) left.`,0,["No","Yes"],null,()=>Id('action2choices').value=="No"||(tonight().visits[0].act='burn',role.uses--)):null;
        case "Strongman":
            return ()=>tonight().visits[0].from.role.name=='Strongman'&&role.uses?action("Make kill unblockable?",0,["No","Yes"],null,()=>Id('action2choices').value=="No"||(tonight().visits[0].strong=1,role.uses--)):tellPlayer(`Either you did not perform the kill or your ability has no more uses.`);
        case "Gossiper":
            return ()=>visit2Players("Compare whose alignments?",0,"info",null,1);
        case "Admirer":
            let k=getPlayerByRole('Serial Killer');
            return k&&k.alive?nightNum()==1?tellPlayer(`Take over if ${k.name}, the Serial Killer, dies.`):null:()=>visit1Player("Kill whom?",0,"kill");
        case "Witch":
            return ()=>visit1Player("Will you invert someone's fate?",1,"witch");
        case "Hooker":
            return ()=>visit1Player("Silence whom?",0,"hook");
        case "Waterboarder":
            let a=getPlayerByRole('Agoraphobe');
            return ()=>action(`There is ${a?'an':'no'} Agoraphobe.<br>Pick someone to roleblock and see their role (left), and someone to kill (right).`,0,liveNames(),liveNames(),()=>{push1Visit('waterboard');pushVisit2('kill')});
        case "Agoraphobe":
            let w=getPlayerByRole('Waterboarder');
            return ()=>visit1Player(`There is ${w?'a':'no'} Waterboarder.<br>Attempt to kill whom?`,0,"agora");
        case "Tree-Hat":
            return role.bulletproof>0?()=>visit1Player("Visit whom?",0,"info"):()=>(role.guilt=0,tellPlayer("You lost your bulletproof and cannot visit."));
        case "Jailor":
            return ()=>visit1Player("Jail whom?",0,"jail",null,null,1);
        case "Arsonist":
            return ()=>visit1Player('Pick someone to douse or check Do Nothing to ignite all doused people.'+(nightNum()==1?`<br>There is ${getPlayerByRole('Douser')?'a':'no'} Douser.`:''),1,"douse",null,()=>Id('action2skip').checked&&tonight().visits.push(new Visit(currentPlayer,null,'burn')));
        case "Virgin":
            return role.uses?()=>action("Prevent all kills tonight?",0,["No","Yes"],null,()=>Id('action2choices').value=="No"||(push1Visit('save'),role.uses--)):null;
        case "Priest":
            return role.uses?()=>visit1Player(`Will you save someone?<br>${role.uses} use(s) left.`,1,"save",null,()=>Id('action2skip').checked||((role.uses-=1)&&turn--)):null;
        case "Doctor":
            return ()=>action("Save whom?",0,liveNames().filter(n=>n!=role.prevSave),null,()=>{push1Visit('save');role.prevSave=Id('action2choices').value;});
        case "Douser":
            let f=getPlayerByRole('Arsonist');
            return ()=>visit1Player(f&&f.alive?((nightNum()==1?f.name+' is the Arsonist.<br>':'')+'Douse whom?'):'Pick someone to douse or check Do Nothing to ignite all doused people. You can only ignite ONCE.',!(f&&f.alive)&&role.uses,"douse",null,()=>Id('action2skip').checked&&(role.uses--,tonight().visits.push(new Visit(currentPlayer,null,'burn'))));
        case "Veteran":
            return role.uses?()=>action("Keep watch tonight?",0,["No","Yes"],null,()=>Id('action2choices').value=="No"||(push1Visit('kill'),role.uses--)):null;
        case "Illusionist":
            return ()=>action("Swap visits to which two players?",0,liveNames(),liveNames(),()=>{push1Visit('illude');pushVisit2('illude')});
        case "Siren":
            return ()=>visit1Player("Force someone to visit you.",0,"charm");
        case "Bodyguard":
            return ()=>visit1Player("Guard whom?",0,"guard");
        case "Amnesiac":
            return ()=>action("Become a dead role, or check Do Nothing to wait. If the dropdown is empty, there are no dead roles to take.",1,players.filter(p=>!p.alive).map(p=>p.role.name),null,()=>{Id('action2skip').checked||(role.remember=new Role(Id('action2choices').value),tonight().announcements.push('The Amnesiac has remembered a role!'),tonight().actionQueue.push({player:getPlayerByRole('Amnesiac'),action:()=>(tellPlayer(`You are now a ${role.remember.name} and will win on that side!`,getPlayerByRole('Amnesiac').role=role.remember))}))});
        case "Escape Artist":
            return role.wasVoted&&nightNum()>2?()=>visit1Player("Roleblock whom?",role.wasVoted=0,"roleblock"):null;
        case "King":
            return role.uses?()=>action("Silence everyone today?",0,["No","Yes"],null,()=>Id('action2choices').value=="No"||(tonight().visits.push(new Visit(currentPlayer,null,'silence')),role.uses--)):null;
        case "Tactician":
            return ()=>visit1Player("Pick a backup Mafia target. If the original target is visited by another killing role, the Mafia will kill this person instead.",0,"tactic");
        case "Tinker":
            return ()=>visit1Player("Will you replenish someone's ability uses and bulletproof?",1,"tinker",null,null,role.tinkered);
        case "Shrink":
            return ()=>visit1Player("Convert whom to Townie if they are 3rd party?",0,"shrink");
        default:
            return null;
}}
/*Roleblock message*/
roleblockMessage=()=>tellPlayer(`Something went wrong with your visit—you received no info. Usually this means you were roleblocked.`);
//Roles waking again to see info
getInfo=(role)=>{
    let checkedPlayer;
    try {
        checkedPlayer=tonight().visits.find(v=>v.from.role.name==role.name&&v.act=='info').to;
    } catch {}
    switch (role.name) {
        case "Deputy":
            let s=getPlayerByRole('Sheriff');
            if (s&&s.alive) return null;
        case "Sheriff":
            if (checkedPlayer) return ()=>tellPlayer(`Your target is ${checkedPlayer.role.guilt?'':'not '}guilty.`);
        case "Consigliere":
            if (checkedPlayer) return ()=>tellPlayer(`Your target is the ${checkedPlayer.role.name}.`);
        case "Tracker":
            if (checkedPlayer) return ()=>tellPlayer(`Your target visited:<br>${tonight().visitsFrom(checkedPlayer).map(v=>v.to.name).sort().join(', ')||'No one'}`);
        case "Watcher":
            if (checkedPlayer) return ()=>tellPlayer(`Your target was visited by:<br>${tonight().visitsTo(checkedPlayer).map(v=>v.from.name).sort().join(', ')||'No one'}`);
        return roleblockMessage;
        case "Gossiper":
            try {
                let checked2=tonight().visits.filter(v=>v.from.role.name=="Gossiper"&&v.act=='info')[1].to;
                if (checkedPlayer&&checked2) {
                    let s1=checkedPlayer.role.side;
                    let s2=checked2.role.side;
                    return ()=>tellPlayer(`Your targets are ${(s1==s2&&['Mafia','Town'].includes(s1))||allied3rd.some(t=>t.includes(checkedPlayer.role.name)&&t.includes(checked2.role.name))?'':'not '}on the same side.`)};
            } finally {return roleblockMessage}
        case "Waterboarder":
            try {
                checkedPlayer=tonight().visits.find(v=>v.from.role.name=='Waterboarder'&&v.act=='waterboard').to;
                return ()=>tellPlayer(`The player you roleblocked is the ${checkedPlayer.role.name}.`);
            } finally {return roleblockMessage}
        case "Tree-Hat":
            if (role.bulletproof<1) return null;
            return checkedPlayer?()=>tellPlayer(`Your target ${tonight().visitsFrom(checkedPlayer)||checkedPlayer.role.action1||getSkill(checkedPlayer.role)||getInfo(checkedPlayer.role)?'woke':'did not wake'} up.`):roleblockMessage;
        case "Mathematician":
            return ()=>tellPlayer(tonight().wasRoleRoleblocked('Mathematician')?"You were roleblocked. No info tonight.":`There were ${tonight().visits.filter(v=>!v.invis).length} visits tonight.`);
        case "Gravedigger":
            return ()=>tellPlayer(tonight().visits[0].act=='dig'&&tonight().visits[0].to.dying?`Your victim was a ${tonight().visits[0].to.role.name}.`:"Either your victim survived or you were not the killer. You do not see their role.");
        case "Prophet":
            return nightNum()==1?()=>tellPlayer(tonight().wasRoleRoleblocked('Prophet')?"You were roleblocked. No info.":`There is a(n) ${livePlayers().map(p=>p.role.name).filter(n=>n!='Prophet').getRandom()} in the game.`):null;
        case "Spy":
            return nightNum()==1?()=>(tellPlayer(tonight().wasRoleRoleblocked('Spy')?"You were roleblocked. No info.":`There is no ${spyInfo} in the game.`),delete spyInfo):null;
        case "Queen":
            return nightNum()==1?()=>tellPlayer(tonight().wasRoleRoleblocked('Queen')?"You were roleblocked. No info.":`There is ${getPlayerByRole('King')?'a':'no'} King and ${getPlayerByRole('Jester')?'a':'no'} Jester in the game.`):null;
        case "Night Crawler":
            return ()=>tellPlayer(tonight().wasRoleRoleblocked('Night Crawler')?"You were roleblocked. No info.":`You were visited by these evil roles:<br>${tonight().visitsTo(getPlayerByRole('Night Crawler')).filter(v=>v.from.role.side!="Town").map(v=>v.from.role.name).sort().join(', ')||'None'}`);
        case "Tactician":
            try {
                checkedPlayer=tonight().visits.find(v=>v.from.role.name=='Tactician'&&v.act=='tactic').to;
            }
            catch {checkedPlayer=0}
            return ()=>tellPlayer(`The Mafia target was${tonight().visits[0].from.role.side=="Mafia"&&checkedPlayer&&tonight().visits[0].to==checkedPlayer?'':' not'} changed.`);
        case "Miner":
            return ()=>tellPlayer(role.bulletproof?tonight().wasRoleRoleblocked('Miner')?"You were roleblocked. No info.":`You were visited by:<br>${tonight().visitsTo(getPlayerByRole('Miner')).map(v=>v.from.name).sort().join(', ')||'No one'}`:"You lost your bulletproof. No info.");
        default:
            return null;
}}
//How many shots a role can survive
getBulletproof=(role)=>{
    switch (role.name) {
        case "1-Shot Bulletproof Mafia":
        case "King":
        case "Siren":
        case "Traitor+":
        case "Amnesiac":
        case "Apprentice":
        case "Arsonist":
        case "Backstabber":
        case "Barista":
        case "Joker":
        case "Zombie":
        case "1-Shot Bulletproof Townie":
        case "Bodyguard":
        case "Hunter":
        case "Miner":
        case "Queen":
        case "Tinker":
        case "Tree-Hat":
            return 1;
        case "Agoraphobe":
        case "Matchmaker":
        case "Serial Killer":
            /*SK is "initially" infinite bulletproof but "becomes" 1-shot bulletproof, innocent, unnoticeable if they choose that.*/
            return 99;
        default:
            return 0
    
}}
//How many times a role's ability can be used. 9=no limit.
getUses=(role)=>{
    switch (role.name) {
        case "Arms Dealer":
        case "King":
        case "Strongman":
        case "Traitor+":
        case "Apprentice":
        case "Douser":
        case "Matchmaker":
        case "1-Shot Vigilante":
        case "Clairvoyant":
        case "Electrician":
        case "Hunter":
        case "Revenant":
        case "Tinker":
        case "Trapper":
        case "Veteran":
        case "Virgin":
            return 1;
        case "Igniter":
        case "2-Shot Vigilante":
        case "Priest":
            return 2;
        default:
            return 9
}}