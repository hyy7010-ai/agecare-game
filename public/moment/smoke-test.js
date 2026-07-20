const fs=require('fs');
const vm=require('vm');

const appNode={innerHTML:'',insertAdjacentHTML(_where,html){this.innerHTML+=html}};
const document={
 querySelector(selector){return selector==='#app'?appNode:null},
 getElementById(){return null},
 addEventListener(){},
 createElement(){return{className:'',textContent:'',dataset:{},append(){},remove(){}}},
 body:{append(){}}
};
const context={
 console,document,location:{search:'',protocol:'https:',hostname:'example.test',origin:'https://example.test',pathname:'/'},
 URLSearchParams,FormData:class{},fetch:async()=>({ok:false,json:async()=>({})}),navigator:{},
 setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},requestAnimationFrame(fn){fn()},
 window:{isSecureContext:true,scrollTo(){},addEventListener(){},removeEventListener(){},speechSynthesis:{getVoices(){return[]},cancel(){},speak(){}}},
 SpeechSynthesisUtterance:function(text){this.text=text}
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync('app-interactive.js','utf8'),context);

function expect(condition,message){if(!condition)throw new Error(message)}
function html(expression){return vm.runInContext(expression,context)}

vm.runInContext("state.momentSelection={type:'explore',index:0};state.moment={step:0,started:Date.now(),paused:false,messages:[],busy:false}",context);
expect(html('momentPlaying()').includes('data-moment-choice'),'Explore must offer real choices');
vm.runInContext('state.moment.step=2',context);
expect(html('momentPlaying()').includes('Choose a favourite detail'),'Explore must reach its final step');

vm.runInContext("state.momentSelection={type:'talk',index:0};state.moment={step:0,started:Date.now(),paused:false,messages:[],busy:false}",context);
const talk=html('momentPlaying()');
expect(talk.includes('data-moment-chat')&&talk.includes('data-moment-speech'),'Talk must support text and speech');
vm.runInContext("state.momentSelection={type:'talk',index:3};state.moment={step:0,started:Date.now(),paused:false,messages:[],busy:false,photo:null,photoBusy:false}",context);
expect(html('momentPlaying()').includes('data-photo-input'),'Talk must include the photo-story experience');

vm.runInContext("state.momentSelection={type:'relax',index:0};state.moment={step:0,started:Date.now(),paused:false,messages:[],busy:false}",context);
const relax=html('momentPlaying()');
expect(relax.includes('breathing-orb')&&relax.includes('data-toggle-pause')&&relax.includes('data-finish-moment'),'Relax must breathe, pause and finish');

expect(html("modal('Wonderful work','All flowers matched')").includes('data-restart'),'Memory completion must restart Memory');
vm.runInContext("state.controller=true;state.controllerStep='tutorial';state.motion.enabled=false;state.tutorialStep=1",context);
expect(html('phone()').includes('Phone movement is off on this link'),'Phone visual fallback must explain that motion is off');
expect(html('FISH_TYPES.length')===7,'Fishing must expose seven visitors including the Grand Lake Carp');
vm.runInContext("state.controller=false;state.view='fishing';state.fishing.activeFish=FISH_TYPES.find(fish=>fish.size==='large');state.fishing.struggle=['left','right'];state.fishing.stage='bite';advanceFishing()",context);
expect(html('state.fishing.stage')==='biglift','A large visitor must enter the comfortable hold stage');
expect(html('fishing()').includes('grand-shadow'),'A large visitor must render the special lake animation');
vm.runInContext('state.fishing.caught=2',context);
expect(html("chooseFish().name")==='Grand Lake Carp','The third catch must guarantee the magnificent visitor');
vm.runInContext("state.session.error='Static preview';state.session.id=null",context);
expect(html('pairing()').includes('Start without a phone'),'Static pairing failure must offer a playable demo path');
expect(html('pairing()').includes('data-retry-pair'),'A temporary pairing failure must offer an immediate retry');
expect(html('fishingIntro()').includes('data-demo-tutorial'),'Fishing introduction must expose a clear practice button');
expect(html("window.speechSynthesis.getVoices=()=>[{name:'Basic Voice',lang:'en-US',localService:true},{name:'Ava Premium',lang:'en-AU',localService:true}];sunnyVoice().name")==='Ava Premium','Sunny must prefer a natural premium system voice');
expect(!html('family()').includes('88%'),'Family view must not display percentage scores');
vm.runInContext("state.controller=false;state.view='welcome';state.fishing.stage='caught';handleRemote('fish-again')",context);
expect(html('state.fishing.stage')==='caught','Remote fishing actions must not mutate an unrelated view');
vm.runInContext("state.report=null;state.latestReport=null;state.momentHistory=[]",context);
expect(html('reports(false)').includes('No activities have been recorded yet'),'Reports must not invent activity data');
vm.runInContext("state.momentHistory=[{type:'relax',title:'Soft rain on leaves',durationSeconds:120,shared:''}]",context);
expect(html('reports(false)').includes('Soft rain on leaves'),'Completed moments must appear in reports');

console.log('MOMENT smoke test passed');
