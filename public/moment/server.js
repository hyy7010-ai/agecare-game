const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const root = __dirname;
const dataDir = path.join(root, 'data');
const profileFile = path.join(dataDir, 'profile.json');
const reportsFile = path.join(dataDir, 'reports.json');
const sessions = new Map();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-sol';
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
fs.mkdirSync(dataDir,{recursive:true});
if(!fs.existsSync(profileFile))fs.writeFileSync(profileFile,JSON.stringify({name:'Mary',interests:[],memories:[],updatedAt:null},null,2));
if(!fs.existsSync(reportsFile))fs.writeFileSync(reportsFile,'[]');

function json(res,value,code=200){res.writeHead(code,{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS'});res.end(JSON.stringify(value));}
function body(req){return new Promise(resolve=>{let b='';req.on('data',c=>{b+=c;if(b.length>4_000_000)req.destroy()});req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch{resolve({})}})})}
function readJson(file,fallback){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
function writeJson(file,value){const temp=`${file}.tmp`;fs.writeFileSync(temp,JSON.stringify(value,null,2));fs.renameSync(temp,file)}
function fallbackIntent(transcript){const text=transcript.toLowerCase();if(/fish|lake|fishing/.test(text))return{intent:'fishing',reply:'A lovely choice. Let’s visit the lake together.'};if(/music|relax|quiet|piano|rain/.test(text))return{intent:'relax',reply:'That sounds peaceful. Let’s enjoy a quiet moment together.'};if(/explore|garden|flower|place|travel/.test(text))return{intent:'explore',reply:'That sounds lovely. Let’s explore something beautiful together.'};if(/talk|chat|story|memory/.test(text))return{intent:'talk',reply:'Of course. I’m here and ready to listen.'};return{intent:'unknown',reply:'I’m listening. Would you like fishing, music, exploring, or a little conversation?'}}
function cleanJson(text){const match=String(text||'').match(/\{[\s\S]*\}/);if(!match)throw new Error('OpenAI did not return JSON');return JSON.parse(match[0])}
async function openAIJson(system,user){
 if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is not configured');
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:OPENAI_MODEL,temperature:.35,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:typeof user==='string'?user:JSON.stringify(user)}]})});
 if(!response.ok)throw new Error(`OpenAI request failed (${response.status})`);
 const result=await response.json();return cleanJson(result.choices?.[0]?.message?.content);
}
async function openAIPhotoJson(image,context=''){
 if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is not configured');
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:OPENAI_MODEL,response_format:{type:'json_object'},messages:[{role:'system',content:'You are Sunny, a gentle companion looking at an older photograph with an older adult. Do not identify people, infer sensitive traits, or claim certainty. Notice one visible, non-sensitive detail and ask one short, warm, open question that may invite a story. Return strict JSON: {"reply":"..."}.'},{role:'user',content:[{type:'text',text:`The person would like to tell a story about this photo. Optional context: ${context}`},{type:'image_url',image_url:{url:image,detail:'low'}}]}]})});
 if(!response.ok)throw new Error(`OpenAI image request failed (${response.status})`);const result=await response.json();return cleanJson(result.choices?.[0]?.message?.content)
}
function sessionFacts(session){return{sessionId:session.id,name:'Mary',activity:'fishing',startedAt:session.metrics.startedAt,endedAt:session.metrics.endedAt,durationSeconds:session.metrics.durationSeconds||0,fishCaught:session.metrics.fishCaught||0,fishTypes:session.metrics.fishTypes||[],tutorialCorrect:session.metrics.tutorialCorrect||0,tutorialWrong:session.metrics.tutorialWrong||0,conversationTurns:session.aiMessages.filter(message=>message.role==='user').length,wellnessDimensions:['movement','focus',...(session.aiMessages.some(message=>message.role==='user')?['expression']:[])],interests:session.summary?.interests||[],memory_note:session.summary?.memory_note||'',mood:session.summary?.mood||'neutral'}}
function persistProfile(summary={}){const profile=readJson(profileFile,{name:'Mary',interests:[],memories:[],moments:[]});profile.interests=[...new Set([...(profile.interests||[]),...(Array.isArray(summary.interests)?summary.interests:[]).filter(Boolean)])].slice(-20);if(summary.memory_note&&!(profile.memories||[]).includes(summary.memory_note))profile.memories=[...(profile.memories||[]),summary.memory_note].slice(-12);if(summary.moment)profile.moments=[...(profile.moments||[]),{...summary.moment,recordedAt:new Date().toISOString()}].slice(-30);profile.updatedAt=new Date().toISOString();writeJson(profileFile,profile);return profile}

http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS'});return res.end()}
  if(url.pathname==='/api/session'&&req.method==='POST'){
    const id=Math.random().toString(36).slice(2,6).toUpperCase();
    const host=req.headers.host||'';const forwarded=req.headers['x-forwarded-proto'];
    const localIp=Object.values(os.networkInterfaces()).flat().find(x=>x&&x.family==='IPv4'&&!x.internal)?.address||'localhost';
    const phoneBase=/^(localhost|127\.0\.0\.1)/.test(host)?`http://${localIp}:${host.split(':')[1]||4173}`:`${forwarded||'http'}://${host}`;
    sessions.set(id,{id,connected:false,event:null,eventSeq:0,lastClientSeq:{display:0,controller:0},lastControllerSeen:0,updated:Date.now(),phoneBase,aiMessages:[{role:'assistant',content:'Did being by the lake bring back a happy memory?'}],summary:null,report:null,metrics:{startedAt:null,endedAt:null,durationSeconds:0,fishCaught:0,fishTypes:[],tutorialCorrect:0,tutorialWrong:0}});return json(res,{id,phoneBase});
  }
  if(url.pathname==='/api/ai/intent'&&req.method==='POST'){
    const data=await body(req),transcript=String(data.transcript||'').trim();if(!transcript)return json(res,{error:'Transcript is required'},400);
    const fallback=fallbackIntent(transcript);
    try{const answer=await openAIJson('You are Sunny, a warm patient companion for an older adult. Classify the request. Return strict JSON only: {"intent":"fishing"|"explore"|"talk"|"relax"|"unknown","reply":"one short warm confirmation sentence"}. Never give medical advice.',transcript);return json(res,{...fallback,...answer,source:'openai'})}catch(error){return json(res,{...fallback,source:'fallback',notice:error.message})}
  }
  if(url.pathname==='/api/ai/chat'&&req.method==='POST'){
    const data=await body(req),session=sessions.get(String(data.sessionId||'').toUpperCase());if(!session)return json(res,{error:'Session not found'},404);
    const supplied=Array.isArray(data.messages)?data.messages.filter(item=>item&&item.role==='user').at(-1)?.content:data.message;const text=String(supplied||'').trim();if(!text)return json(res,{error:'Message is required'},400);
    session.aiMessages.push({role:'user',content:text});
    const fallbackReply=session.aiMessages.filter(item=>item.role==='user').length===1?'That sounds like a very special memory. What do you remember most clearly about that time?':'Thank you for sharing that with me. I’m glad we could remember it together.';
    try{const answer=await openAIJson('You are Sunny, a warm, patient companion speaking with an older adult after a peaceful fishing activity. Respond with no more than 2 short sentences. Acknowledge what they said and ask at most one gentle relevant question. Never pressure, diagnose, rate memory or thinking ability, or give medical advice. Return strict JSON: {"reply":"..."}.',session.aiMessages);const reply=String(answer.reply||fallbackReply);session.aiMessages.push({role:'assistant',content:reply});return json(res,{reply,turns:session.aiMessages.filter(item=>item.role==='user').length,source:'openai'})}catch(error){session.aiMessages.push({role:'assistant',content:fallbackReply});return json(res,{reply:fallbackReply,turns:session.aiMessages.filter(item=>item.role==='user').length,source:'fallback',notice:error.message})}
  }
  if(url.pathname==='/api/ai/companion'&&req.method==='POST'){
    const data=await body(req),text=String(data.message||'').trim();if(!text)return json(res,{error:'Message is required'},400);
    const messages=Array.isArray(data.messages)?data.messages.slice(-8):[{role:'user',content:text}],fallback='Thank you for sharing that with me. I’m happy to sit with this memory beside you.';
    const fallbackSummary={interests:[String(data.topic||data.activity||'conversation')].filter(Boolean),memory_note:text,mood:'neutral'};
    try{const answer=await openAIJson('You are Sunny, a calm companion speaking with an older adult. Reply in no more than 2 short warm sentences. Also extract only facts explicitly shared by the person; do not infer. Never pressure, diagnose, rate ability, or give medical advice. Return strict JSON: {"reply":"...","interests":["short explicit topics"],"memory_note":"one factual sentence or empty string","mood":"positive|neutral"}.',messages);persistProfile({interests:Array.isArray(answer.interests)?answer.interests:[],memory_note:String(answer.memory_note||''),mood:answer.mood});return json(res,{reply:String(answer.reply||fallback),source:'openai',remembered:Boolean(answer.memory_note)})}catch(error){persistProfile(fallbackSummary);return json(res,{reply:fallback,source:'fallback',remembered:true,notice:error.message})}
  }
  if(url.pathname==='/api/ai/moment'&&req.method==='POST'){
    const data=await body(req),activity=String(data.activity||'').trim(),title=String(data.title||'').trim();if(!activity||!title)return json(res,{error:'Activity and title are required'},400);
    if(!new Set(['explore','talk','relax']).has(activity))return json(res,{error:'Unknown activity'},400);
    const summary={interests:activity==='talk'?[]:[title],memory_note:String(data.shared||'').trim(),moment:{activity,title,durationSeconds:Math.max(0,Number(data.durationSeconds)||0)}};
    persistProfile(summary);return json(res,{ok:true,remembered:Boolean(summary.memory_note||summary.interests.length)});
  }
  if(url.pathname==='/api/ai/photo'&&req.method==='POST'){
    const data=await body(req),image=String(data.image||'');if(!/^data:image\/(jpeg|png|webp);base64,/.test(image)||image.length>3_500_000)return json(res,{error:'Please choose a JPG, PNG, or WebP photo under 2.5 MB.'},400);
    const fallback='This looks like a meaningful photograph. What would you like to tell me about the moment it holds?';
    try{const answer=await openAIPhotoJson(image,String(data.context||''));return json(res,{reply:String(answer.reply||fallback),source:'openai'})}catch(error){return json(res,{reply:fallback,source:'fallback',notice:error.message})}
  }
  if(url.pathname==='/api/ai/summary'&&req.method==='POST'){
    const data=await body(req),session=sessions.get(String(data.sessionId||'').toUpperCase());if(!session)return json(res,{error:'Session not found'},404);
    const firstMemory=session.aiMessages.find(item=>item.role==='user')?.content||'Mary enjoyed the peaceful water.',lowerMemory=firstMemory.toLowerCase(),fallbackInterests=['fishing'];if(/family|father|mother|dad|mum|parent|child/.test(lowerMemory))fallbackInterests.push('family');if(/garden|flower/.test(lowerMemory))fallbackInterests.push('gardens');const fallback={interests:fallbackInterests,memory_note:firstMemory,mood:'neutral'};
    try{session.summary=await openAIJson('Extract only explicitly shared facts from this older-adult companion conversation. No diagnosis or inference. Return strict JSON: {"interests":["short topics"],"memory_note":"one factual sentence about what was shared","mood":"positive"|"neutral"}.',session.aiMessages)}catch{session.summary=fallback}
    persistProfile(session.summary);return json(res,session.summary);
  }
  if(url.pathname==='/api/ai/report'&&req.method==='POST'){
    const data=await body(req),session=sessions.get(String(data.sessionId||'').toUpperCase());if(!session)return json(res,{error:'Session not found'},404);
    session.metrics.endedAt=session.metrics.endedAt||new Date().toISOString();if(session.metrics.startedAt&&!session.metrics.durationSeconds)session.metrics.durationSeconds=Math.max(1,Math.round((Date.parse(session.metrics.endedAt)-Date.parse(session.metrics.startedAt))/1000));
    const facts=sessionFacts(session),minutes=Math.max(1,Math.round(facts.durationSeconds/60));
    const fishList=facts.fishTypes.length?` The visitors were ${facts.fishTypes.join(', ')}.`:'',fallback={resident:`You spent ${minutes} lovely minute${minutes===1?'':'s'} by the lake and welcomed ${facts.fishCaught} little fish.${fishList} Thank you for sharing this peaceful moment with Sunny.`,family:facts.memory_note?`Mary enjoyed ${minutes} minutes of gentle movement while fishing and shared: “${facts.memory_note}”`:`Mary spent ${minutes} minutes following gentle fishing movements and welcomed ${facts.fishCaught} fish.${fishList}`};
    // Family reporting describes participation only, without rating ability or making clinical claims.
    try{session.report={...await openAIJson('Write two warm factual activity highlights using only supplied facts. resident is second person and celebratory. family is third person and may describe wellness dimensions only in everyday participation language (for example gentle arm movement or sharing memories). Never rate ability, compare performance, diagnose, or claim that any ability became better or worse; never mention cognition or health. Each is at most 2 sentences. Return strict JSON: {"resident":"...","family":"..."}.',facts),facts,createdAt:new Date().toISOString()}}catch{session.report={...fallback,facts,createdAt:new Date().toISOString()}}
    const reports=readJson(reportsFile,[]);reports.push(session.report);writeJson(reportsFile,reports.slice(-100));return json(res,session.report);
  }
  if(url.pathname==='/api/ai/latest'&&req.method==='GET'){const reports=readJson(reportsFile,[]);return json(res,{profile:readJson(profileFile,{name:'Mary',interests:[],memories:[]}),report:reports.at(-1)||null})}
  if(url.pathname==='/api/ai/greeting'&&req.method==='GET'){
    const profile=readJson(profileFile,{name:'Mary',interests:[],memories:[]}),memory=(profile.memories||[]).at(-1),interest=(profile.interests||[])[0];
    if(!memory&&!interest)return json(res,{personalized:false,greeting:'I’m here to keep you company today.',suggestion:'What feels lovely today?'});
    const fallback={personalized:true,greeting:memory?`I remember you shared: “${memory}”`:`I remember that you enjoy ${interest}.`,suggestion:interest==='fishing'?'Would you like to visit the lake together again?':'Would you like to enjoy another gentle moment together?'};
    try{return json(res,{...fallback,...await openAIJson('Write a warm remembered greeting for Mary using only the supplied profile facts. Never imply facts not present. Keep each field to one short sentence. Return strict JSON: {"greeting":"...","suggestion":"..."}.',profile),personalized:true})}catch{return json(res,fallback)}
  }
  if(url.pathname.startsWith('/api/session/')){
    const [, , ,id,action]=url.pathname.split('/');const session=sessions.get(String(id||'').toUpperCase());if(!session)return json(res,{error:'Session not found'},404);
    if(req.method==='GET'){if(url.searchParams.get('role')==='controller'){session.lastControllerSeen=Date.now();session.connected=true}session.connected=Date.now()-session.lastControllerSeen<5000;return json(res,{id:session.id,connected:session.connected,event:session.event,eventSeq:session.eventSeq,updated:session.updated,phoneBase:session.phoneBase,chatMessages:session.aiMessages,chatTurns:session.aiMessages.filter(message=>message.role==='user').length,report:session.report})}
    const data=await body(req);
    if(action==='connect'){session.connected=true;session.lastControllerSeen=Date.now();session.event='connected';session.eventSeq++}
    if(action==='event'){const role=data.role==='controller'?'controller':'display',clientSeq=Number(data.seq)||0;if(!clientSeq||clientSeq>session.lastClientSeq[role]){session.lastClientSeq[role]=Math.max(session.lastClientSeq[role],clientSeq);session.event=data.event;session.eventSeq++;session.updated=Date.now()}}
    if(action==='metrics')session.metrics={...session.metrics,...data};
    return json(res,{ok:true,id:session.id});
  }
  let file=url.pathname==='/'?'/index.html':url.pathname;if(file==='/controller')file='/index.html';
  const target=path.join(root,path.normalize(file).replace(/^\.\.(\/|\\)/,''));
  fs.readFile(target,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream'});res.end(data)});
 }catch(error){console.error(error);json(res,{error:'MOMENT could not complete that request. Please try again.'},500)}
}).listen(process.env.PORT||4173,()=>{
 const port=process.env.PORT||4173;console.log(`MOMENT ready on http://localhost:${port}`);console.log(process.env.OPENAI_API_KEY?'OpenAI is connected.':'OPENAI_API_KEY is not set — gentle fallback responses are active.');Object.values(os.networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).forEach(x=>console.log(`Phone-ready address: http://${x.address}:${port}`));
});
