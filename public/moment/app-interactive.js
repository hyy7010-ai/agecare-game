const app = document.querySelector('#app');

const state = {
  view: 'welcome', previous: 'welcome', name: 'Mary', controller: false,
  session: { id:null, connected:false }, controllerStep:'connect', tutorialStep:0, tutorialFeedback:null,
  motion: { enabled:false, permission:'unknown', baseline:null, lastEvent:0 },
  fishing: { stage: 'ready', caught: 0, bait: 3, progress: 0, started:null },
  memory: { open: [], matched: [], moves: 0, hints: 1, seconds: 155, locked: false },
  settings: { sound: true, motion: true, text: 'Comfortable' },
  staticDemo: location.hostname.endsWith('github.io'), momentStarted: null
};
const query = new URLSearchParams(location.search);
const API_BASE=location.protocol==='file:'?'http://localhost:4173':'';
const APP_PATH=location.pathname.includes('/moment/')?location.pathname.slice(0,location.pathname.indexOf('/moment/')+7):'';
if(query.has('session')){ state.controller=true; state.session.id=query.get('session').toUpperCase(); state.controllerStep='connect'; }

const flowers = [
  ['rose','rose'],['lavender','lavender'],['sunflower','sunflower'],['camellia','camellia'],
  ['hydrangea','hydrangea'],['rose','rose'],['sunflower','sunflower'],['camellia','camellia'],
  ['lavender','lavender'],['hydrangea','hydrangea'],['daisy','daisy'],['daisy','daisy']
].sort(() => .5 - Math.random());

function icon(name, cls=''){ return `<svg class="icon ${cls}" aria-hidden="true"><use href="assets/icons.svg#${name}"></use></svg>`; }
const icons = { play:icon('flower'), explore:icon('spark'), talk:icon('flower'), relax:icon('star'), report:icon('flower'), settings:icon('star') };

function sun(stateName='idle', small=false){
  return `<div class="sunny ${stateName} ${small?'small':''}" aria-label="Sunny, your MOMENT companion"><img src="assets/art/sunny-companion.png" alt=""></div>`;
}

function logo(){ return `<button class="wordmark" data-go="welcome" aria-label="MOMENT home"><span>${sun('idle',true)}</span>MOMENT</button>`; }
function button(label, go, kind='primary', extra=''){ return `<button class="btn ${kind}" ${go?`data-go="${go}"`:''} ${extra}>${label}</button>`; }
function back(){ return `<button class="back" data-back aria-label="Go back">${icon('back')} <span>Back</span></button>`; }
function companion(message, mode='encouraging'){
  return `<div class="companion-row">${sun(mode)}<div class="speech">${message}<em>♡</em></div></div>`;
}
function nav(){
 return `<nav class="topnav">${logo()}<div class="navlinks">
  <button data-go="activities">Activities</button><button data-go="daily">Reports</button><button data-go="family">Family</button><button data-go="settings" aria-label="Settings">⚙</button>
 </div><button class="controller-chip" data-controller>${state.controller?'Large screen':'Phone controller'}</button></nav>`;
}
function shell(content, cls=''){ return `<main class="shell ${cls}">${content}</main>`; }

function welcome(){
 return `<main class="home-dashboard">
  <nav class="dashboard-nav"><button class="dashboard-brand" data-go="welcome">${icon('flower')}<span><b>MOMENT</b><small>Your companion, every day.</small></span></button><div><button class="active" data-go="welcome">${icon('star')} Home</button><button data-go="activities">${icon('flower')} Activities</button><button data-go="daily">${icon('lotus')} Reports</button><button data-go="family">${icon('hand')} Family</button></div><button class="dashboard-controller" data-controller>${icon('hand')} Phone controller <i></i></button></nav>
  <section class="dashboard-stage"><div class="dashboard-copy"><h1>Good afternoon,<br>${state.name}</h1><p>Let’s make today a wonderful day. <span>♡</span></p></div>
   <div class="robot-speech"><b>Hello, ${state.name}.</b><span>I’m here to keep you<br>company today. ♡</span></div>
   <div class="dashboard-cards">
    ${dashboardCard('fishing','Go Fishing','Enjoy a relaxing fishing adventure','pairing',icon('fish'))}
    ${dashboardCard('garden','Explore','Discover beautiful places and things','explore',icon('flower'))}
    ${dashboardCard('memories','Talk','Share memories and stories','talk',icon('hand'))}
    ${dashboardCard('music','Relax','Listen to music and relax your mind','relax',icon('sound'))}
   </div>
   <button class="dashboard-voice" data-go="listening"><span class="voice-mic">${icon('sound')}</span><span><b>You can say what you’d like</b><small>“I would like to go fishing”</small></span><i class="voice-wave"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i></button>
   <div class="dashboard-today"><div>${icon('lotus')}<span><b>Today</b><small>Friday, 17 July 2026</small></span></div><hr><div>${icon('star')}<span><b>18°C</b><small>Sunny</small></span></div></div>
  </section>
 </main>`;
}
function dashboardCard(cls,title,sub,go,cardIcon){return `<button class="dashboard-card ${cls}" data-go="${go}"><span class="card-picture"><i></i></span><span class="card-round-icon">${cardIcon}</span><b>${title}</b><small>${sub}</small></button>`}
function activityButton(icon,title,sub,go){ return `<button class="activity-choice ${icon}" data-go="${go}"><span>${icons[icon]}</span><b>${title}</b><small>${sub}</small></button>`; }

function activities(){
 return `${nav()}${shell(`<div class="page-heading">${back()}<span><span class="eyebrow">CHOOSE A MOMENT</span><h1>What feels good today?</h1><p>There is no rush. Choose anything that sounds pleasant.</p></span></div>
 <div class="feature-grid">
  <article class="feature-card lake-card" data-go="pairing"><div class="mini-scene"><span class="mini-fish"><img src="assets/art/fish-orange.png" alt=""></span></div><div><span class="pill">A PEACEFUL MOMENT</span><h2>Sunny’s Peaceful Fishing</h2><p>Enjoy a peaceful day by the lake and see what little fish may come to visit.</p>${button('Visit the lake','pairing')}</div></article>
  <article class="feature-card flower-card" data-go="memory"><div class="flower-cluster">🌹 🪻<br>🌻 🌺</div><div><span class="pill">MEMORY & FOCUS</span><h2>Flower Memory Match</h2><p>Find beautiful flower pairs at your own pace.</p>${button('Match flowers →','memory','secondary')}</div></article>
 </div><h2 class="section-title">More ways to spend a moment</h2><div class="calm-grid">${activityButton('explore','Explore','Gardens, places and stories','explore')}${activityButton('talk','Talk','A conversation with Sunny','talk')}${activityButton('relax','Relax','Breathe, listen and unwind','relax')}</div>`, 'page')}`;
}

function activityHeader(title, subtitle, metric){ return `<header class="activity-header">${back()}<div><h1>${title}</h1><p>${subtitle}</p></div>${metric}</header>`; }

function fishing(){
 const f=state.fishing; const instruction = {ready:'A lovely day for fishing — cast your line when you’re ready',waiting:'Let’s wait patiently for a little fish to visit',bite:'Something is nibbling! Lift your phone gently',left:'Our little fish is swimming left — tilt gently',right:'Now it’s swimming right — follow it slowly',reeling:'Turn your phone gently to bring our visitor closer',caught:'Wonderful! You caught a beautiful Golden Lotus Fish'}[f.stage];
 const dialogue={ready:`Let’s go fishing together,<br>${state.name}.`,waiting:'The lake is so peaceful today.<br>Let’s see who comes to visit.',bite:'Oh! I think a little fish<br>is interested in our bait.',left:'The fish is swimming left.<br>You’re doing wonderfully.',right:'Now gently to the right.<br>Perfect — you’ve got it.',reeling:'Turn slowly and gently.<br>It’s almost here!',caught:'What a beautiful little fish!<br>You did a wonderful job.'}[f.stage];
 const linePath={ready:'M526,230 Q625,265 720,392',waiting:'M526,230 Q625,265 720,392',bite:'M579,258 Q650,285 720,392',left:'M526,230 Q625,265 720,392',right:'M526,230 Q625,265 720,392',reeling:'M422,206 Q565,245 720,392',caught:'M422,206 Q565,245 720,392'}[f.stage];
 return shell(`${activityHeader('Sunny’s Peaceful Fishing','Enjoy a peaceful day by the lake and see what fish you can discover today.',`<div class="metric">${icon('lotus')}<small>Little visitors</small><b>${f.caught}</b></div>`)}
 <section class="fishing-scene" data-fish-scene><div class="ambient-light"></div><div class="cloud-soft cloud-a"></div><div class="cloud-soft cloud-b"></div><div class="water-sheen"></div><div class="butterfly"><i></i><i></i></div><div class="fish fish1"><img src="assets/art/fish-orange.png" alt=""></div><div class="fish fish2 blue"><img src="assets/art/fish-orange.png" alt=""></div><div class="fish fish3 yellow"><img src="assets/art/fish-orange.png" alt=""></div><span class="ripples ripple-one"></span><span class="ripples ripple-two"></span><div class="dock"><i></i><i></i></div><div class="rod ${f.stage}"><i class="reel"></i><i class="handle"></i></div><svg class="line" viewBox="0 0 1000 600" preserveAspectRatio="none"><path d="${linePath}"/></svg>
 ${companion(dialogue,f.stage==='caught'?'celebrating':f.stage==='waiting'?'speaking':'encouraging')}
 <div class="fishing-hud"><span>${icon('bait')}<small>Bait</small><b>${f.bait}</b></span><hr><span>${icon('star')}<small>Level</small><b>1</b></span></div>
 <button class="instruction ${f.stage}" data-cast><span>${icon(f.stage==='caught'?'spark':'hand')}</span><b>${instruction}</b></button>
 ${f.progress?`<div class="reel-progress"><span style="width:${f.progress}%"></span></div>`:''}</section>
 <footer class="activity-footer">${button(`${icon('sound')} Music`,null,'purple','data-sound')}${button(`${icon('bait')} Use bait`,null,'green','data-bait')}${button(`${icon('exit')} Exit activity`,'activities','danger')}</footer>`, 'activity-shell fishing-shell');
}

function memory(){
 let cards=flowers.map((f,i)=>`<button class="memory-card ${state.memory.open.includes(i)||state.memory.matched.includes(i)?'flipped':''} ${state.memory.matched.includes(i)?'matched':''}" data-card="${i}" aria-label="${state.memory.open.includes(i)?f[0]:'Hidden flower card'}"><span class="card-inner"><span class="card-back">${icon('flower')}</span><span class="card-front"><b class="botanical ${f[1]}"><i></i><i></i><i></i><i></i><i></i><i></i></b><small>${f[0]}</small></span></span></button>`).join('');
 return shell(`${activityHeader('Flower Memory Match','Find all the matching flower pairs!',`<div class="metric">${icon('flower')}<small>Matches</small><b>${state.memory.matched.length/2} / 6</b></div>`)}
 <div class="memory-top">${companion(state.memory.matched.length?`Lovely work, ${state.name}!<br>Keep going.`:`Take your time, ${state.name}.<br>Every turn is a fresh start.`)}<div class="stat-row"><div>◉<small>Moves</small><b>${state.memory.moves}</b></div><div>◷<small>Time</small><b>${formatTime(state.memory.seconds)}</b></div><div>♧<small>Hints</small><b>${state.memory.hints}</b></div></div></div>
 <div class="memory-grid">${cards}</div><footer class="activity-footer">${button('↻  Restart',null,'green','data-restart')}${button('💡  Hint',null,'yellow','data-hint')}${button('↪  Exit activity','activities','danger')}</footer>`, 'activity-shell memory-shell');
}
function formatTime(n){ return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }

const experiences = {
 explore:{kicker:'A LITTLE DISCOVERY',title:'Let’s explore somewhere beautiful',body:'Take a gentle visit to gardens, coastlines and favourite places — with Sunny beside you.',cards:[['🌿','A walk through Monet’s garden'],['🏞️','The lakes of New Zealand'],['🐦','Meet the birds in your garden']]},
 talk:{kicker:'A CONVERSATION WITH SUNNY',title:'I’m here to listen',body:'Share a story, remember someone special, or simply talk about your day. This is your space.',cards:[['♡','A favourite family tradition'],['♫','Music that brings back memories'],['☕','The best part of today']]},
 relax:{kicker:'A PEACEFUL PAUSE',title:'Let’s make room to breathe',body:'Settle into a calming sound, a gentle breathing moment, or a quiet nature scene.',cards:[['🌧️','Soft rain on leaves'],['🌊','Waves along the shore'],['🎹','Quiet afternoon piano']]}
};
function experience(type){ const x=experiences[type]; return `${nav()}${shell(`<div class="page-heading">${back()}<span><span class="eyebrow">${x.kicker}</span><h1>${x.title}</h1><p>${x.body}</p></span></div><div class="experience-hero ${type}">${companion(type==='talk'?`What’s on your mind, ${state.name}?`:`We can enjoy this together.`,'speaking')}<div class="orb">${icons[type]}</div></div><div class="story-cards">${x.cards.map((c,i)=>`<button data-story="${type}:${i}"><span>${c[0]}</span><b>${c[1]}</b><small>${i?'About 5 minutes':'Recommended for you'} · Open →</small></button>`).join('')}</div>`, 'page')}`; }

function guidedMoment(){const {type,index}=state.momentSelection;const x=experiences[type],item=x.cards[index];const copy={explore:['Let’s look around together','Sunny will gently guide you through the scene. Pause whenever something catches your eye.'],talk:['This is your space','Share as much or as little as you like. Sunny will listen without rushing you.'],relax:['Settle in comfortably','Breathe naturally and let the sound create a quiet moment around you.']}[type];return shell(`<div class="guided-moment ${type}">${sun('speaking')}<span class="eyebrow">${type.toUpperCase()} WITH SUNNY</span><h1>${item[1]}</h1><p class="lead">${copy[0]}</p><div class="guided-panel"><div class="guided-visual">${icons[type]}<i></i><i></i><i></i></div><div><h2>${copy[1]}</h2><p>This moment is about five minutes. There is no score and nothing you need to finish.</p><div class="guided-actions">${button('Begin this moment',null,'primary','data-begin-moment')}${button('Choose another',type,'secondary')}</div></div></div></div>`, 'state-shell guided-shell')}

function momentPlaying(){const {type,index}=state.momentSelection;const item=experiences[type].cards[index];const prompts={explore:'Notice one colour or detail that feels beautiful to you.',talk:'Take your time. Sunny is listening whenever you feel ready to share.',relax:'Breathe naturally. Let your shoulders rest and enjoy the quiet.'};return shell(`<div class="guided-moment ${type} active-moment">${sun('speaking')}<span class="eyebrow">ENJOYING THIS MOMENT WITH SUNNY</span><h1>${item[1]}</h1><p class="lead">${prompts[type]}</p><div class="guided-panel"><div class="guided-visual">${icons[type]}<i></i><i></i><i></i></div><div><h2>This moment is now playing.</h2><p>Stay for as long as feels comfortable. You can finish whenever you are ready.</p><div class="guided-actions">${button(type==='talk'?'I’ve shared my story':'Finish this moment',null,'primary','data-finish-moment')}${button('Pause and choose another',type,'secondary')}</div></div></div></div>`, 'state-shell guided-shell')}

function momentComplete(){const {type,index}=state.momentSelection;const item=experiences[type].cards[index];return shell(`<div class="center-state">${sun('celebrating')}<span class="eyebrow">A LOVELY MOMENT</span><h1>Thank you for spending this time with Sunny.</h1><p>You enjoyed “${item[1]}”. There was no score and nothing to get right.</p><div class="button-row">${button('Choose another moment',type)}${button('Return home','welcome','secondary')}</div></div>`, 'state-shell')}

function listening(){ return shell(`<div class="center-state">${logo()}<div class="listening-orb"><i></i><i></i><i></i><span>●</span></div><span class="eyebrow">SUNNY IS LISTENING</span><h1>Tell me what sounds lovely today.</h1><p>You might say, “I’d like to spend some time by the lake.”</p>${button('Let’s go fishing','pairing')}${button('Go back','welcome','ghost')}</div>`, 'state-shell'); }

function pairing(){
 const id=state.session.id||'••••'; const phoneBase=state.session.phoneBase||(location.protocol==='file:'?'http://localhost:4173':location.origin);const url=state.session.id?`${phoneBase}${APP_PATH}/index.html?session=${id}`:'';
 if(state.staticDemo&&!state.session.id)return shell(`<div class="pair-layout demo-pairing"><div>${logo()}<span class="eyebrow">GITHUB PAGES DEMO</span><h1>Let’s go fishing<br>together.</h1><p>This hosted preview cannot run the live pairing server, but every part of the fishing experience can still be tried on this screen.</p><div class="button-row">${button('Start the fishing guide',null,'primary','data-demo-fishing')}${button('Preview the phone controller',null,'secondary','data-demo-controller')}</div><div class="status good"><i></i>Interactive demo is ready</div></div><div class="pair-art qr-panel">${sun('helping')}<p><b>Want real two-device pairing?</b><small>Deploy the Express server to Render or Railway.</small></p></div></div>`, 'pair-shell');
 return shell(`<div class="pair-layout"><div>${logo()}<span class="eyebrow">A SIMPLE CONNECTION</span><h1>Let’s connect<br>your phone.</h1><p>Scan the code below with your phone’s camera. MOMENT will open and connect for you.</p><div class="pair-code">${id.split('').map(x=>`<span>${x}</span>`).join('')}</div><div class="status ${state.session.connected?'good connected-now':'good'}"><i></i>${state.session.connected?'Your phone is connected — continue on your phone.':'Waiting gently for your phone…'}</div></div><div class="pair-art qr-panel"><div id="qr" data-url="${url}"></div><p><b>Scan to begin</b><small>No typing needed</small></p>${sun(state.session.connected?'celebrating':'helping')}</div></div>`, 'pair-shell');
}

const tutorialSteps=[
  {title:'Lift your phone gently',body:'Just a small, comfortable lift.',motion:'↑',event:'lift'},
  {title:'Tilt a little to the left',body:'Perfect — only as far as feels comfortable.',motion:'←',event:'left'},
  {title:'Now tilt a little to the right',body:'That’s it. You’ve got it.',motion:'→',event:'right'},
  {title:'Turn your phone gently',body:'A small turning motion reels in the line.',motion:'↻',event:'rotate'}
];
function tutorial(){ const t=tutorialSteps[state.tutorialStep],fb=state.tutorialFeedback;const sunnyMessage=fb?.kind==='correct'?`Perfect, ${state.name}!<br>You’ve got it.`:fb?.kind==='wrong'?`Almost there.<br>Let’s try that movement again.`:state.tutorialStep?`You’re doing wonderfully,<br>${state.name}.`:`We’ll take it slowly, ${state.name}.`;return shell(`${activityHeader('Let’s practise together','Sunny will guide you one gentle movement at a time.',`<div class="metric">${icon('hand')}<small>Your progress</small><b>${state.tutorialStep+1} of 4</b></div>`)}<section class="tutorial-scene ${fb?`has-feedback ${fb.kind}`:''}">${companion(sunnyMessage,fb?.kind==='correct'?'celebrating':'encouraging')}<div class="tutorial-motion"><span>${fb?.kind==='correct'?'✓':fb?.kind==='wrong'?'↺':t.motion}</span><h1>${fb?.kind==='correct'?'That was just right!':fb?.kind==='wrong'?'Let’s try once more':t.title}</h1><p>${fb?.message||t.body}</p>${fb?.kind==='correct'?'':button(fb?.kind==='wrong'?'Try this movement again':'I’ve done this',null,'primary',`data-tutorial="${t.event}"`)}</div>${fb?`<div class="practice-feedback ${fb.kind}">${fb.kind==='correct'?icon('spark'):icon('hand')}<span><b>${fb.kind==='correct'?'Wonderful!':'Not quite yet'}</b><small>${fb.message}</small></span></div>`:''}</section>`, 'activity-shell tutorial-shell'); }

function fishingIntro(){return shell(`${activityHeader('Before we visit the lake','Sunny will show you everything first. There is no hurry.',`<div class="metric">${icon('spark')}<small>About</small><b>1 minute</b></div>`)}<section class="intro-scene">${companion(`Let me show you how<br>we’ll fish together, ${state.name}.`,'speaking')}<div class="intro-copy"><span class="eyebrow">SUNNY’S GENTLE GUIDE</span><h1>Fishing is simple<br>and peaceful.</h1><p>We will make one comfortable movement at a time.</p></div><div class="intro-steps"><article><span>1</span>${icon('hand')}<h2>Cast the line</h2><p>Tap once to send the line gently into the lake.</p></article><article><span>2</span><b class="step-arrow">↑</b><h2>Lift when it nibbles</h2><p>When Sunny notices a fish, lift your phone gently.</p></article><article><span>3</span><b class="step-arrow">↔</b><h2>Follow the fish</h2><p>Tilt left or right, only as far as feels comfortable.</p></article><article><span>4</span><b class="step-arrow">↻</b><h2>Reel it closer</h2><p>Turn your phone slowly to welcome the fish.</p></article></div><div class="intro-reassure">${icon('flower')} <span><b>You cannot do it wrong.</b> Sunny will wait and help whenever you need.</span></div><div class="button-row intro-actions">${button('Practise the movements',null,'primary','data-start-practice')}${button('Go straight to the lake','fishing','secondary')}</div></section>`, 'activity-shell intro-shell')}

function conversation(){ return shell(`<div class="conversation-scene">${sun('speaking')}<span class="eyebrow">A MOMENT WITH SUNNY</span><h1>That was lovely, ${state.name}.</h1><div class="conversation-bubble"><p>Did being by the lake bring back a happy memory?</p><button data-memory="family">Yes, it reminded me of family</button><button data-memory="peaceful">I simply enjoyed the peaceful water</button></div><p class="gentle-note">You can also answer aloud. Sunny is listening.</p></div>`, 'state-shell'); }

function reports(weekly=false){
 return `${nav()}${shell(`<div class="page-heading compact"><div><span class="eyebrow">${weekly?'YOUR WEEK TOGETHER':'TODAY’S MOMENTS'}</span><h1>${weekly?'A gentle look at Mary’s week':'Mary had a lovely day'}</h1><p>Shared with care — focused on enjoyment, interests and connection.</p></div><div class="segmented"><button data-go="daily" class="${!weekly?'active':''}">Daily</button><button data-go="weekly" class="${weekly?'active':''}">Weekly</button></div></div>
 <div class="report-highlight"><div><span class="date">${weekly?'13–19 July':'Thursday, 16 July'}</span><h2>${weekly?'A week filled with nature, stories and music':'Fishing brought the biggest smile today.'}</h2><p>${weekly?'Mary especially enjoyed peaceful outdoor activities and spoke warmly about family holidays near the water.':'Mary caught three fish and shared a happy memory about fishing with her father as a child.'}</p><div class="tags"><span>Nature</span><span>Family memories</span><span>Fishing</span></div></div>${sun('celebrating')}</div>
 <div class="report-grid"><article><span>☀</span><small>Moments enjoyed</small><b>${weekly?'12':'3'}</b><p>Comfortable, self-paced activities</p></article><article><span>◷</span><small>Time together</small><b>${weekly?'4h 20m':'42 min'}</b><p>Across play, talk and relaxation</p></article><article><span>♡</span><small>Bright spot</small><b>${weekly?'Tuesday':'Fishing'}</b><p>${weekly?'Music and garden stories':'“It reminded me of Dad.”'}</p></article></div>
 <section class="timeline"><h2>${weekly?'Favourite moments':'Today’s gentle rhythm'}</h2>${timelineItem('10:15','Sunny’s Peaceful Fishing','Caught 3 fish · 18 minutes','🐟')}${timelineItem('10:38','A conversation about family','Mary remembered lakeside holidays.','♡')}${timelineItem('3:20','Quiet afternoon piano','A calm way to finish the day.','♫')}</section>`, 'page report-page')}`;
}

function fishingReport(){return `${nav()}${shell(`<div class="report-celebration">${sun('celebrating')}<span class="eyebrow">TODAY’S FISHING ADVENTURE</span><h1>Thank you for spending<br>this moment with Sunny.</h1><p class="lead">You brought patience, gentle movement and a lovely smile to the lake today.</p></div><div class="warm-report"><article><small>TIME BY THE LAKE</small><b>8 minutes</b><p>A calm little pause in your day.</p></article><article><small>BEAUTIFUL FISH DISCOVERED</small><b>${Math.max(1,state.fishing.caught)}</b><p>Each one came to visit at just the right time.</p></article><article><small>TODAY FELT</small><b>Warmly engaged</b><p>You followed every movement with confidence.</p></article><blockquote><span>${icon('flower')}</span><div><small>A WONDERFUL MOMENT</small><p>“${state.memoryNote==='peaceful'?'I enjoyed the peaceful water.':'It reminded me of time spent with family.'}”</p></div></blockquote></div><div class="report-actions">${button('Go fishing again','fishing')}${button('Explore something new','activities','secondary')}${button('Share with family','family','ghost')}</div>`, 'page fishing-report')}`}
function timelineItem(time,title,sub,icon){ return `<div><time>${time}</time><span>${icon}</span><p><b>${title}</b><small>${sub}</small></p></div>`; }

function family(){ return `${nav()}${shell(`<div class="page-heading compact"><div><span class="eyebrow">FAMILY CIRCLE</span><h1>Good afternoon, Anna.</h1><p>Here’s a warm glimpse of Mum’s day — no scores, no judgement.</p></div>${button('Call Mary  ♡',null,'secondary','data-toast="Calling is available in the full experience"')}</div>
 <div class="family-grid"><section class="family-main"><div class="report-highlight mini"><div><span class="date">TODAY’S BRIGHT SPOT</span><h2>“It reminded me of fishing with Dad.”</h2><p>Mary shared this while playing Sunny’s Peaceful Fishing this morning.</p></div><span class="photo">🌳</span></div><div class="section-head"><h2>Recent moments</h2><button data-go="daily">See full report →</button></div><div class="moment-list">${timelineItem('Today','Peaceful fishing','Mary stayed engaged and caught 3 fish.','🐟')}${timelineItem('Yesterday','Garden exploration','Roses brought back a favourite story.','🌹')}${timelineItem('Monday','Music and relaxation','Mary chose piano music after lunch.','♫')}</div></section>
 <aside class="family-side"><div>${sun('idle',true)}<h3>Mary’s interests</h3><p>Growing gently from the moments she chooses to share.</p><div class="interest-bars"><span><b style="width:88%"></b>Nature</span><span><b style="width:74%"></b>Music</span><span><b style="width:64%"></b>Family stories</span></div></div><div><h3>Next lovely idea</h3><p>Sunny could explore Australian native gardens with Mary tomorrow.</p>${button('Save suggestion',null,'green','data-toast="Suggestion saved"')}</div></aside></div>`, 'page family-page')}`; }

function settings(){ return `${nav()}${shell(`<div class="page-heading">${back()}<span><span class="eyebrow">MAKE MOMENT YOURS</span><h1>Comfort and settings</h1><p>Simple choices to make every moment feel just right.</p></span></div><div class="settings-grid"><section><h2>Experience</h2>${setting('🔊','Sound & spoken guidance','Sunny speaks instructions aloud','sound')}${setting('〰','Gentle motion','Use phone movement in activities','motion')}${setting('Aa','Text size','Currently: Comfortable','text')}</section><section><h2>Connection</h2><button class="setting-row" data-go="pairing"><span>▣</span><p><b>Pair a phone controller</b><small>Connect with a four-digit code</small></p><i>→</i></button><button class="setting-row" data-go="demo"><span>▷</span><p><b>Demo mode</b><small>Explore MOMENT without a controller</small></p><i>→</i></button><button class="setting-row" data-go="error"><span>?</span><p><b>Connection help</b><small>Friendly steps if something is not working</small></p><i>→</i></button></section></div>`, 'page')}`; }
function setting(icon,title,sub,key){ return `<button class="setting-row" data-setting="${key}"><span>${icon}</span><p><b>${title}</b><small>${sub}</small></p><i class="toggle ${state.settings[key]===true?'on':''}"></i></button>`; }

function demo(){ return shell(`<div class="center-state demo-state">${sun('speaking')}<span class="pill">DEMO MODE</span><h1>Explore every MOMENT</h1><p>Choose a screen to preview. Activities work with touch or mouse when a phone is not connected.</p><div class="demo-grid">${['welcome','activities','pairing','fishing','memory','explore','talk','relax','daily','weekly','family','settings','loading','error'].map(v=>button(v[0].toUpperCase()+v.slice(1),v,'secondary')).join('')}</div></div>`, 'state-shell'); }
function loading(){ return shell(`<div class="center-state">${sun('waiting')}<div class="leaf-loader"><i>⌁</i><i>⌁</i><i>⌁</i></div><h1>Preparing a peaceful moment…</h1><p>Sunny is getting everything ready for you.</p></div>`, 'state-shell'); }
function error(){ return shell(`<div class="center-state">${sun('helping')}<span class="pill warm">LET’S TRY THAT AGAIN</span><h1>Your phone took a little pause.</h1><p>Nothing is lost. Make sure both devices are nearby, then reconnect when you’re ready.</p><div class="button-row">${button('Reconnect','pairing')}${button('Not now','settings','ghost')}</div></div>`, 'state-shell'); }

function phone(){
 const f=state.fishing;
 const sensorCapable=window.isSecureContext||['localhost','127.0.0.1'].includes(location.hostname);
 if(state.controllerStep==='connect')return `<main class="phone-shell"><header>${logo()}</header><section class="phone-home">${sun('celebrating')}<span class="eyebrow">CONNECTED SUCCESSFULLY</span><h1>You’re ready to go fishing with Sunny.</h1><p>Your large screen and phone are now together.</p>${button('See how fishing works',null,'primary','data-phone-step="intro"')}</section></main>`;
 if(state.controllerStep==='intro')return `<main class="phone-shell intro-phone"><header>${logo()}<span class="connected"><i></i> With Sunny</span></header><section class="phone-action"><span class="eyebrow">BEFORE WE BEGIN</span><h1>Here’s how we’ll fish together.</h1><div class="phone-intro-list"><div><i>1</i><b>Tap to cast</b><small>Send the line into the lake</small></div><div><i>2</i><b>Lift gently</b><small>When a little fish nibbles</small></div><div><i>3</i><b>Tilt left and right</b><small>Follow our little visitor</small></div><div><i>4</i><b>Turn slowly</b><small>Bring the fish closer</small></div></div><p class="intro-kind">There is no score and no rush. Sunny will be with you.</p>${button('Let’s practise',null,'primary','data-phone-step="ready"')}</section></main>`;
 if(state.controllerStep==='ready')return `<main class="phone-shell"><header>${logo()}<span class="connected"><i></i> Connected</span></header><section class="phone-home">${icon('hand','phone-hand')}<span class="eyebrow">GET COMFORTABLE</span><h1>Hold your phone comfortably.</h1><p>There is no hurry. Use both hands if that feels better.</p>${state.motion.error?`<div class="motion-warning"><b>Motion sensors have not started.</b><span>${state.motion.error}</span></div>`:''}${sensorCapable?button('Allow motion & begin',null,'primary','id="startBtn"'):button('Start visual practice',null,'primary','data-phone-step="tutorial"')}<small class="permission-note">${sensorCapable?'Tap the button once, then choose Allow in Safari.':'This page is HTTP. Open the ngrok HTTPS link to test real motion sensors.'}</small>${motionReadout()}</section></main>`;
 if(state.controllerStep==='tutorial'){const t=tutorialSteps[state.tutorialStep],fb=state.tutorialFeedback;return `<main class="phone-shell practice-phone ${fb?`has-feedback ${fb.kind}`:''}"><header>${logo()}<span class="connected"><i></i> ${state.motion.enabled?'Motion connected':'Visual practice'}</span></header><section class="phone-action"><span class="eyebrow">PRACTICE ${state.tutorialStep+1} OF 4</span><div class="motion-demo motion-${t.event}"><div class="demo-phone"><span>MOMENT</span></div><i>${fb?.kind==='correct'?'✓':fb?.kind==='wrong'?'↺':t.motion}</i></div><h1>${fb?.kind==='correct'?'Wonderful!':fb?.kind==='wrong'?'Almost — try again':t.title}</h1><p>${fb?.message||(state.motion.enabled?'Move your phone gently — Sunny will notice.':'Follow the picture, then tap the button when it feels comfortable.')}</p>${fb?.kind==='correct'?'<div class="phone-success">Sunny felt the correct movement.</div>':state.motion.enabled?'<div class="sensor-listening"><i></i> Listening for your movement</div>':''}${motionReadout()}${fb?.kind==='correct'?'':button(state.motion.enabled?'Use button instead':'I practised this movement',null,state.motion.enabled?'ghost':'primary',`data-motion="${t.event}"`)}</section></main>`}
 if(state.controllerStep==='complete')return `<main class="phone-shell"><header>${logo()}<span class="connected"><i></i> With Sunny</span></header><section class="phone-home">${sun('celebrating')}<span class="eyebrow">THAT WAS LOVELY</span><h1>You caught a beautiful little fish.</h1><p>Take a moment with Sunny on your large screen.</p></section></main>`;
 const words={ready:['Tap to cast','A gentle tap sends the line into the lake.','cast'],waiting:['Wait with Sunny','Let’s see who comes to visit us.','wait'],bite:['Lift your phone gently','Something is nibbling on the line!','lift'],left:['Tilt a little left','Follow the little fish comfortably.','left'],right:['Tilt a little right','Lovely — you are doing so well.','right'],reeling:['Turn your phone gently','Slowly bring our visitor closer.','rotate'],caught:['Wonderful!','You caught a beautiful Golden Lotus Fish.','caught']}[f.stage];
 return `<main class="phone-shell"><header>${logo()}<span class="connected"><i></i> With Sunny</span></header><section class="phone-action"><span class="eyebrow">SUNNY’S PEACEFUL FISHING</span><div class="motion-icon">${f.stage==='bite'?'↑':f.stage==='left'?'←':f.stage==='right'?'→':f.stage==='reeling'?'↻':f.stage==='caught'?icon('spark'):'○'}</div><h1>${words[0]}</h1><p>${words[1]}</p>${f.stage!=='waiting'?button(f.stage==='caught'?'Spend a moment with Sunny':'Done gently',null,'primary',`data-motion="${words[2]}"`):''}<div class="phone-reassure">Only move as far as feels comfortable.</div></section></main>`;
}

function modal(title,body){ return `<div class="modal-wrap"><div class="modal">${sun('celebrating')}<span class="eyebrow">A LOVELY MOMENT</span><h1>${title}</h1><p>${body}</p><div class="button-row">${button('Play again','fishing')}${button('Finish','daily','secondary')}</div></div></div>`; }
function toast(message){ const old=document.querySelector('.toast'); if(old)old.remove(); const el=document.createElement('div'); el.className='toast'; el.textContent=message; document.body.append(el); setTimeout(()=>el.remove(),2600); }

function render(){
 const pages={welcome,activities,fishing,fishingIntro,tutorial,conversation,fishingReport,guidedMoment,momentPlaying,momentComplete,memory,explore:()=>experience('explore'),talk:()=>experience('talk'),relax:()=>experience('relax'),listening,pairing,daily:()=>reports(false),weekly:()=>reports(true),family,settings,demo,loading,error};
 app.innerHTML=state.controller?phone():(pages[state.view]||welcome)();
 if(!state.controller&&state.view==='pairing') preparePairing();
 if(!state.controller&&state.view==='fishing') requestAnimationFrame(alignFishingLine);
 bindMotionPermissionButton();
 updateMotionReadout();
 window.scrollTo(0,0);
}

function alignFishingLine(){
 const scene=document.querySelector('.fishing-scene'),rod=scene?.querySelector('.rod'),path=scene?.querySelector('.line path');
 if(!scene||!rod||!path)return;
 const style=getComputedStyle(rod),match=style.transform.match(/matrix\(([^)]+)\)/);
 const values=(match?match[1]:'1,0,0,1,0,0').split(',').map(Number),origin=style.transformOrigin.split(' ').map(value=>Number.parseFloat(value));
 const [a,b,c,d]=values,ox=rod.offsetLeft+origin[0],oy=rod.offsetTop+origin[1],vx=rod.offsetWidth-origin[0],vy=rod.offsetHeight/2-origin[1];
 const tipX=ox+a*vx+c*vy,tipY=oy+b*vx+d*vy,startX=tipX/scene.clientWidth*1000,startY=tipY/scene.clientHeight*600;
 const endX=720,endY=392,controlX=startX+(endX-startX)*.55,controlY=Math.min(startY+50,endY-38);
 path.setAttribute('d',`M${startX.toFixed(1)},${startY.toFixed(1)} Q${controlX.toFixed(1)},${controlY.toFixed(1)} ${endX},${endY}`);
}
window.addEventListener('resize',()=>{if(state.view==='fishing')requestAnimationFrame(alignFishingLine)});

document.addEventListener('click', e=>{
 const go=e.target.closest('[data-go]'); if(go){ state.previous=state.view; state.view=go.dataset.go; render(); return; }
 if(e.target.closest('[data-back]')){ state.view=state.previous==='fishing'||state.previous==='memory'?'activities':state.previous; render(); return; }
 if(e.target.closest('[data-controller]')){ state.controller=!state.controller; render(); return; }
 if(e.target.closest('[data-card]')) flipCard(+e.target.closest('[data-card]').dataset.card);
 if(e.target.closest('[data-restart]')){ state.memory={open:[],matched:[],moves:0,hints:1,seconds:0,locked:false}; render(); }
 if(e.target.closest('[data-hint]')) hint();
 if(e.target.closest('[data-cast]')) advanceFishing();
 const phoneStep=e.target.closest('[data-phone-step]');if(phoneStep){state.controllerStep=phoneStep.dataset.phoneStep;if(state.controllerStep==='intro')sendSessionEvent('intro');if(state.controllerStep==='tutorial')sendSessionEvent('start');render();return;}
 const motion=e.target.closest('[data-motion]');if(motion){sendSessionEvent(motion.dataset.motion);if(state.controllerStep==='tutorial'){showTutorialSuccess()}else if(state.controllerStep==='fishing'){if(motion.dataset.motion==='caught'){state.controllerStep='complete';render()}else advanceFishing()}return;}
 const tut=e.target.closest('[data-tutorial]');if(tut){showTutorialSuccess();return;}
 const memoryChoice=e.target.closest('[data-memory]');if(memoryChoice){state.memoryNote=memoryChoice.dataset.memory;state.view='fishingReport';render();return;}
 if(e.target.closest('[data-bait]')){ if(state.fishing.bait){state.fishing.bait--; toast('Bait added — let’s see who visits'); render();} }
 if(e.target.closest('[data-sound]')){state.settings.sound=!state.settings.sound;toast(state.settings.sound?'Gentle lake music is on':'Music is paused');render();return;}
 const t=e.target.closest('[data-toast]'); if(t) toast(t.dataset.toast);
 const story=e.target.closest('[data-story]');if(story){const [type,index]=story.dataset.story.split(':');state.momentSelection={type,index:+index};state.previous=type;state.view='guidedMoment';render();return;}
 const begin=e.target.closest('[data-begin-moment]');if(begin){state.momentStarted=Date.now();state.view='momentPlaying';render();return;}
 if(e.target.closest('[data-finish-moment]')){state.view='momentComplete';render();return;}
 if(e.target.closest('[data-demo-fishing]')){state.view='fishingIntro';state.previous='activities';render();return;}
 if(e.target.closest('[data-demo-controller]')){state.controller=true;state.session.id='DEMO';state.controllerStep='connect';render();return;}
 if(e.target.closest('[data-start-practice]')){state.tutorialStep=0;state.tutorialFeedback=null;state.view='tutorial';render();return;}
 const s=e.target.closest('[data-setting]'); if(s){ const k=s.dataset.setting; if(k==='text'){ state.settings.text=state.settings.text==='Comfortable'?'Extra large':'Comfortable'; document.documentElement.classList.toggle('extra-large'); } else state.settings[k]=!state.settings[k]; render(); }
});

function flipCard(i){ const m=state.memory;if(m.locked||m.open.includes(i)||m.matched.includes(i))return;m.open.push(i);render();if(m.open.length===2){m.moves++;m.locked=true;setTimeout(()=>{const[a,b]=m.open;if(flowers[a][0]===flowers[b][0])m.matched.push(a,b);m.open=[];m.locked=false;render();if(m.matched.length===flowers.length)setTimeout(()=>{app.insertAdjacentHTML('beforeend',modal('Wonderful work, Mary!','You found every flower pair. Take a moment to enjoy what you did.'));},300);},750);}}
function hint(){ const m=state.memory;if(!m.hints)return;const first=flowers.findIndex((f,i)=>!m.matched.includes(i));const second=flowers.findIndex((f,i)=>i!==first&&!m.matched.includes(i)&&f[0]===flowers[first][0]);m.hints--;m.open=[first,second];m.locked=true;render();setTimeout(()=>{m.open=[];m.locked=false;render();},1200);}
function advanceFishing(){const f=state.fishing;if(f.stage==='ready'){f.started=Date.now();f.stage='waiting';render();setTimeout(()=>{if(f.stage==='waiting'){f.stage='bite';render()}},3500)}else if(f.stage==='bite'){f.stage='left';render()}else if(f.stage==='left'){f.stage='right';render()}else if(f.stage==='right'){f.stage='reeling';f.progress=30;render()}else if(f.stage==='reeling'){f.progress+=35;if(f.progress>=100){f.progress=100;f.stage='caught';f.caught++;render()}else render()}else if(f.stage==='caught'){state.view='conversation';render()}}

function advanceTutorial(){state.tutorialFeedback=null;if(state.tutorialStep<3){state.tutorialStep++;render()}else{state.tutorialStep=0;state.fishing.stage='ready';if(state.controller)state.controllerStep='fishing';else state.view='fishing';render()}}
function showTutorialSuccess(){if(state.tutorialFeedback?.kind==='correct')return;state.tutorialFeedback={kind:'correct',message:'That was the correct movement. Moving to the next step…'};render();setTimeout(advanceTutorial,1050)}
function showTutorialWrong(detected){state.tutorialFeedback={kind:'wrong',message:`Try ${tutorialSteps[state.tutorialStep].title.toLowerCase()}. Keep the movement small and comfortable.`};render();setTimeout(()=>{if(state.tutorialFeedback?.kind==='wrong'){state.tutorialFeedback=null;render()}},1800)}
async function sendSessionEvent(event){if(!state.session.id)return;try{await fetch(`${API_BASE}/api/session/${state.session.id}/event`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event})})}catch{}}
async function preparePairing(){
 if(state.staticDemo&&!state.session.id)return;
 if(!state.session.id){try{const r=await fetch(`${API_BASE}/api/session`,{method:'POST'});if(!r.ok)throw new Error();state.session=await r.json();render();return}catch{toast('Start MOMENT with npm start, then reopen pairing.');return}}
 const qr=document.querySelector('#qr');if(qr&&!qr.children.length&&window.qrcode){const code=qrcode(0,'M');code.addData(qr.dataset.url);code.make();qr.innerHTML=code.createSvgTag({cellSize:5,margin:2,scalable:true})}
}
let lastSessionUpdate=0;
setInterval(async()=>{if(!state.session.id)return;try{const r=await fetch(`${API_BASE}/api/session/${state.session.id}`);if(!r.ok)return;const s=await r.json();if(!state.controller&&s.connected&&!state.session.connected){state.session.connected=true;render()}if(!state.controller&&s.updated>lastSessionUpdate&&s.event){lastSessionUpdate=s.updated;handleRemote(s.event)}}catch{}},500);
function handleRemote(event){if(event==='intro'){state.view='fishingIntro';render();return}if(event==='start'){state.view='tutorial';state.tutorialStep=0;state.tutorialFeedback=null;render();return}if(state.view==='tutorial'&&event.startsWith('wrong:')){showTutorialWrong(event.split(':')[1]);return}if(state.view==='tutorial'&&tutorialSteps[state.tutorialStep]?.event===event){showTutorialSuccess();return}if(state.view==='fishing'){advanceFishing()}}
if(state.controller&&state.session.id){fetch(`${API_BASE}/api/session/${state.session.id}/connect`,{method:'POST'}).catch(()=>{});}

function motionReadout(){return `<section class="motion-readout" aria-live="polite"><header><b>Live motion data</b><span id="motionStatus">${state.motion.enabled?'Receiving sensor data':'Waiting to start'}</span></header><div><label>X <strong id="motionX">0.00</strong></label><label>Y <strong id="motionY">0.00</strong></label><label>Z <strong id="motionZ">0.00</strong></label></div></section>`}
function updateMotionReadout(values){
 if(values)state.motion.values=values;
 const v=state.motion.values||{x:0,y:0,z:0};
 const x=document.getElementById('motionX'),y=document.getElementById('motionY'),z=document.getElementById('motionZ'),status=document.getElementById('motionStatus');
 if(x)x.textContent=Number(v.x||0).toFixed(2);if(y)y.textContent=Number(v.y||0).toFixed(2);if(z)z.textContent=Number(v.z||0).toFixed(2);if(status)status.textContent=state.motion.enabled?'Receiving sensor data':'Waiting to start';
}
function bindMotionPermissionButton(){
 const startBtn=document.getElementById('startBtn');
 if(startBtn)startBtn.addEventListener('click',requestMotionPermission,{once:true});
}
async function requestMotionPermission(){
 try{
  if(!window.isSecureContext&&!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('iPhone motion sensors require a secure HTTPS link. The current local HTTP address can only use the button fallback.');
  // Both permission calls are created immediately inside this direct button-click handler.
  const requests=[];
  if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function')requests.push(DeviceMotionEvent.requestPermission());
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function')requests.push(DeviceOrientationEvent.requestPermission());
  const results=await Promise.all(requests);
  if(results.some(result=>result!=='granted'))throw new Error('Please choose Allow when Safari asks for Motion & Orientation access.');
  startListening();
  state.controllerStep='tutorial';sendSessionEvent('start');render();
 }catch(err){state.motion.error=err.message||'Motion access could not be enabled.';state.motion.permission='denied';render()}
}
function startListening(){
  state.motion.enabled=true;state.motion.permission='granted';state.motion.error=null;state.motion.baseline=null;
  window.removeEventListener('deviceorientation',onOrientation);
  window.removeEventListener('devicemotion',onMotion);
  window.addEventListener('deviceorientation',onOrientation,{passive:true});
  window.addEventListener('devicemotion',onMotion,{passive:true});
}
function onOrientation(e){
 if(!state.motion.enabled||e.beta==null||e.gamma==null)return;
 if(!state.motion.baseline){state.motion.baseline={beta:e.beta,gamma:e.gamma,alpha:e.alpha||0};return}
 const now=Date.now();if(now-state.motion.lastEvent<1100)return;
 const b=e.beta-state.motion.baseline.beta,g=e.gamma-state.motion.baseline.gamma,a=Math.abs((e.alpha||0)-state.motion.baseline.alpha);
 const expected=expectedMotion();let detected=null;
 if(Math.min(a,360-a)>38)detected='rotate';
 else if(g<-18)detected='left';
 else if(g>18)detected='right';
 else if(b<-18||b>24)detected='lift';
 if(detected===expected)acceptMotion(detected,e);else if(detected&&state.controllerStep==='tutorial')rejectMotion(detected,e);
}
function onMotion(e){const a=e.accelerationIncludingGravity;if(!a)return;updateMotionReadout({x:a.x,y:a.y,z:a.z});if(Date.now()-state.motion.lastEvent<1100)return;if(expectedMotion()==='lift'&&Math.abs(a.z||0)>14)acceptMotion('lift')}
function expectedMotion(){if(state.controllerStep==='tutorial')return tutorialSteps[state.tutorialStep]?.event;if(state.controllerStep==='fishing')return {bite:'lift',left:'left',right:'right',reeling:'rotate'}[state.fishing.stage];return null}
function acceptMotion(event,e){
 state.motion.lastEvent=Date.now();if(e)state.motion.baseline={beta:e.beta,gamma:e.gamma,alpha:e.alpha||0};
 if(navigator.vibrate)navigator.vibrate(80);sendSessionEvent(event);toast('Wonderful — Sunny felt that movement!');
 if(state.controllerStep==='tutorial')showTutorialSuccess();else if(state.controllerStep==='fishing')advanceFishing();
}
function rejectMotion(event,e){state.motion.lastEvent=Date.now();if(e)state.motion.baseline={beta:e.beta,gamma:e.gamma,alpha:e.alpha||0};if(navigator.vibrate)navigator.vibrate([40,50,40]);sendSessionEvent(`wrong:${event}`);showTutorialWrong(event)}

render();
