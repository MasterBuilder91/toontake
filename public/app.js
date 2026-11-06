(()=>{
const $=id=>document.getElementById(id);
const FPS=30,SR=48000;
const S={me:null,chars:[],sel:null,file:null,voice:null,music:null,lines:[],spkMap:{},plan:null,mix:null,env:null,busy:false};
try{S.chars=JSON.parse(localStorage.getItem('tt_chars')||'[]');}catch(e){}
if(!S.chars.length)S.chars=[{...Toon.DEFAULT_TRAITS,id:'c1',name:'Abu Salman',headwear:'beanie',hwColor:'#c9b08e',beard:'jaw',eyes:'heavy'},{...Toon.DEFAULT_TRAITS,id:'c2',name:'Darnell',skin:'#5a3a26',hair:'fro',glasses:true,top:'hoodie',topColor:'#2f7d4a',pants:'jeans',pantsColor:'#3a5a8a',build:'big'}];
const saveChars=()=>localStorage.setItem('tt_chars',JSON.stringify(S.chars));
const charById=id=>S.chars.find(c=>c.id===id);

// ---------- account, login and billing (no login needed to start) ----------
let wantUpgrade=false;
async function api(path,body){
  const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  let d;try{d=await r.json();}catch(e){throw new Error(`Server error ${r.status}`);}
  if(r.status===429&&d.code==='upgrade'){upgrade(d.error);refreshAccount();throw new Error(d.error);}
  if(r.status===401){wantUpgrade=true;showGate('authBox');throw new Error(d.error||'Please log in');}
  if(!r.ok)throw new Error(d.error||`Error ${r.status}`);
  return d;
}
const gateMsg=(t,ok)=>{$('gateMsg').className=ok?'ok':'err';$('gateMsg').textContent=t||'';};
function showGate(which){$('gate').style.display=which?'flex':'none';['authBox','subBox','resetBox'].forEach(b=>$(b).style.display=b===which?'block':'none');if(!which)gateMsg('');}
$('closeGate').onclick=()=>showGate(null);
function upgrade(why){
  wantUpgrade=true;
  const u=S.me&&S.me.user;
  if(!u){$('authWhy').textContent=(why?why+' ':'')+'Create a free account or log in, then go unlimited for $9.99/month.';showGate('authBox');}
  else{$('subWhy').textContent=why||'';showGate('subBox');}
}
async function refreshAccount(){
  let d;try{d=await (await fetch('/api/me',{credentials:'same-origin'})).json();}catch(e){d={user:null,usage:null};}
  S.me=d;const u=d.user,us=d.usage;const paid=u&&(u.admin||['trialing','active'].includes(u.status));
  $('logoutBtn').style.display=u?'inline-block':'none';
  $('signinBtn').style.display=u?'none':'inline-block';
  $('billingBtn').style.display=u&&!u.admin&&(paid||u.status==='past_due')?'inline-block':'none';
  $('upBtn').style.display=paid?'none':'inline-block';
  let line=u?`${u.email} · `:'';
  if(u&&u.admin)line+='owner';
  else if(paid)line+=`unlimited · AI directs ${us.used.plan}/${us.limit.plan} this month`;
  else if(us)line+=`free today: export ${us.used.render}/${us.limit.render}, AI direct ${us.used.plan}/${us.limit.plan}`;
  $('acct').textContent=line;
  if(u&&wantUpgrade&&!paid&&$('gate').style.display!=='none')showGate('subBox');
  if(paid&&$('gate').style.display!=='none'&&$('subBox').style.display!=='none')showGate(null);
}
$('upBtn').onclick=()=>upgrade('');
$('signinBtn').onclick=()=>{wantUpgrade=false;$('authWhy').textContent='Free: 1 export and 1 AI-directed episode a day. Unlimited: $9.99/month, no watermark, cancel anytime.';showGate('authBox');};
$('loginBtn').onclick=async()=>{gateMsg('');try{await NI.login($('email').value.trim(),$('password').value);showGate(null);await refreshAccount();}catch(e){gateMsg(e.message||'Login failed');}};
$('signupBtn').onclick=async()=>{gateMsg('');const pw=$('password').value;if(pw.length<8)return gateMsg('Use at least 8 characters for your password.');
  try{const u=await NI.signup($('email').value.trim(),pw);if(u&&u.confirmedAt){showGate(null);await refreshAccount();}else gateMsg('Check your email to confirm your account, then log in.',true);}catch(e){gateMsg(e.message||'Signup failed');}};
$('password').onkeydown=e=>{if(e.key==='Enter')$('loginBtn').click();};
$('forgot').onclick=async e=>{e.preventDefault();const em=$('email').value.trim();if(!em)return gateMsg('Type your email first.');try{await NI.requestPasswordRecovery(em);gateMsg('Password reset email sent.',true);}catch(err){gateMsg(err.message);}};
$('resetBtn').onclick=async()=>{try{await NI.updateUser({password:$('newPass').value});gateMsg('Password saved.',true);history.replaceState(null,'','/');setTimeout(()=>showGate(null),800);await refreshAccount();}catch(e){gateMsg(e.message);}};
const doLogout=async()=>{try{await NI.logout();}catch(e){}location.href='/';};
$('logoutBtn').onclick=$('logoutBtn2').onclick=doLogout;
$('trialBtn').onclick=async()=>{gateMsg('');$('trialBtn').disabled=true;try{const d=await api('/api/checkout',{});location.href=d.url;}catch(e){gateMsg(e.message);$('trialBtn').disabled=false;}};
$('billingBtn').onclick=$('billingBtn2').onclick=async()=>{try{const d=await api('/api/portal',{});location.href=d.url;}catch(e){alert(e.message);}};
(async()=>{
  try{const r=await NI.handleAuthCallback();if(r&&r.type==='recovery'){showGate('resetBox');return;}if(r)history.replaceState(null,'','/');}catch(e){}
  if(new URLSearchParams(location.search).get('checkout')==='success'){history.replaceState(null,'','/');$('acct').textContent='Activating your plan…';for(let i=0;i<8;i++){await refreshAccount();const u=S.me.user;if(u&&['trialing','active'].includes(u.status))break;await new Promise(r=>setTimeout(r,1500));}}
  else refreshAccount();
})();

// ---------- cast ----------
const OPTS={hair:['bald','buzz','curly','fro','locs','braids','long','bun'],headwear:['none','beanie','cap','kufi','durag','turban','hijab'],beard:['none','jaw','full','goatee'],eyes:['normal','heavy'],brows:['arched','straight','thin'],top:['tee','hoodie','suit','abaya'],pants:['joggers','jeans'],build:['slim','regular','big']};
const COLORS=['skin','hairColor','hwColor','facialColor','topColor','pantsColor','shoes'];
const LABEL={skin:'Skin',hair:'Hair',hairColor:'Hair color',headwear:'Headwear',hwColor:'Headwear color',beard:'Facial hair',mustache:'Mustache',facialColor:'Facial hair color',glasses:'Glasses',eyes:'Eyes',brows:'Brows',top:'Top',topColor:'Top color',pants:'Pants',pantsColor:'Pants color',shoes:'Shoe color',build:'Build'};
const svgURL=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
function renderCast(){
  const el=$('cast');el.innerHTML='';
  S.chars.forEach(c=>{const d=document.createElement('div');d.className='card'+(S.sel===c.id?' sel':'');d.innerHTML=`<img src="${svgURL(Toon.portrait(c,170,306))}"><div>${esc(c.name)}</div>`;d.onclick=()=>{S.sel=c.id;renderCast();renderEditor();};el.appendChild(d);});
  const a=document.createElement('div');a.className='card add';a.textContent='+';a.title='Add character';
  a.onclick=()=>{const c={...Toon.DEFAULT_TRAITS,id:'c'+Date.now().toString(36),name:'New character'};S.chars.push(c);S.sel=c.id;saveChars();renderCast();renderEditor();};
  el.appendChild(a);
  refreshSpeakerMap();
}
function renderEditor(){
  const c=charById(S.sel);$('editor').style.display=c?'block':'none';if(!c)return;
  $('e_name').value=c.name;$('e_name').oninput=()=>{c.name=$('e_name').value;saveChars();renderCastSoon();};
  const f=$('fields');f.innerHTML='';
  const keys=['skin','hair','hairColor','headwear','hwColor','beard','mustache','facialColor','glasses','eyes','brows','top','topColor','pants','pantsColor','shoes','build'];
  keys.forEach(k=>{const l=document.createElement('label');l.textContent=LABEL[k];let i;
    if(OPTS[k]){i=document.createElement('select');OPTS[k].forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;i.appendChild(op);});i.value=c[k];}
    else if(COLORS.includes(k)){i=document.createElement('input');i.type='color';i.value=c[k]||'#000000';}
    else{i=document.createElement('input');i.type='checkbox';i.checked=!!c[k];}
    i.oninput=()=>{c[k]=i.type==='checkbox'?i.checked:i.value;saveChars();renderCastSoon();};
    l.appendChild(i);f.appendChild(l);});
}
let rcT;function renderCastSoon(){clearTimeout(rcT);rcT=setTimeout(renderCast,120);}
$('delChar').onclick=()=>{if(S.chars.length<=1)return;S.chars=S.chars.filter(c=>c.id!==S.sel);S.sel=null;saveChars();renderCast();renderEditor();};
$('selfie').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const c=charById(S.sel);if(!c)return;
  $('selfieMsg').textContent='Reading your photo…';
  try{
    const img=await createImageBitmap(file);const k=Math.min(1,768/Math.max(img.width,img.height));
    const cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
    const d=await api('/api/analyze',{image:cv.toDataURL('image/jpeg',.85)});
    for(const[k2,v]of Object.entries(d.traits||{}))if(k2 in Toon.DEFAULT_TRAITS&&k2!=='name')c[k2]=v;
    saveChars();renderCast();renderEditor();$('selfieMsg').textContent='Done. Tweak anything below.';
  }catch(err){$('selfieMsg').innerHTML=`<span class="err">${esc(err.message)}</span>`;}
  e.target.value='';
};

// ---------- audio ----------
let actx;const AC=()=>actx||(actx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:SR}));
async function decode(file){const buf=await file.arrayBuffer();return await AC().decodeAudioData(buf);}
$('audio').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;S.file=f;$('audioMsg').textContent='Loading…';
  try{S.voice=await decode(f);$('audioMsg').innerHTML=`<span class="ok">${fmt(S.voice.duration)} loaded</span>`;$('transcribeBtn').disabled=false;S.env=envelope(S.voice);}
  catch(err){$('audioMsg').innerHTML=`<span class="err">Couldn't read that file. Try MP3, WAV or M4A.</span>`;}
};
$('music').onchange=async e=>{const f=e.target.files[0];S.music=f?await decode(f):null;S.mix=null;};
$('musicVol').oninput=()=>{S.mix=null;};

function envelope(buf){
  const n=Math.ceil(buf.duration*FPS),hop=buf.sampleRate/FPS,ch=[];for(let c=0;c<buf.numberOfChannels;c++)ch.push(buf.getChannelData(c));
  const raw=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0,cnt=0;const a=Math.floor(i*hop),b=Math.min(ch[0].length,Math.floor((i+1)*hop));for(let j=a;j<b;j+=2){let v=0;for(const c of ch)v+=c[j];v/=ch.length;s+=v*v;cnt++;}raw[i]=Math.sqrt(s/Math.max(1,cnt));}
  const sorted=[...raw].sort((a,b)=>a-b),lo=sorted[Math.floor(n*.25)]||0,hi=sorted[Math.floor(n*.95)]||1;
  const out=new Float32Array(n);let prev=0;
  for(let i=0;i<n;i++){let v=Math.max(0,Math.min(1,(raw[i]-lo)/Math.max(1e-6,hi-lo)));v=v>prev?prev+(v-prev)*.7:prev+(v-prev)*.45;out[i]=prev=v;}
  return out;
}

// ---------- find voices (all on-device) ----------
async function resample(buf,rate){const n=Math.ceil(buf.duration*rate);const ctx=new OfflineAudioContext(1,n,rate);const src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start();const r=await ctx.startRendering();return r.getChannelData(0);}
function segmentsFrom(x,rate){
  const hop=Math.round(rate/100),n=Math.floor(x.length/hop),e=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let j=i*hop;j<(i+1)*hop;j++)s+=x[j]*x[j];e[i]=Math.sqrt(s/hop);}
  const so=[...e].sort((a,b)=>a-b),lo=so[Math.floor(n*.1)],hi=so[Math.floor(n*.95)],thr=lo+(hi-lo)*.15;
  const on=new Uint8Array(n);for(let i=0;i<n;i++)on[i]=e[i]>thr?1:0;
  // close gaps < 0.2 s
  for(let i=0;i<n;){if(!on[i]){let j=i;while(j<n&&!on[j])j++;if(i>0&&j<n&&j-i<20)for(let k=i;k<j;k++)on[k]=1;i=j;}else i++;}
  const segs=[];for(let i=0;i<n;){if(on[i]){let j=i;while(j<n&&on[j])j++;if(j-i>=20)segs.push({start:i/100,end:j/100});i=j;}else i++;}
  return segs;
}
function features(x,rate,seg){ // x at 8 kHz
  const W=256,H=128,a=Math.floor(seg.start*rate),b=Math.floor(seg.end*rate);const f0s=[];let z=0,zc=0;
  for(let p=a;p+W+160<b;p+=H){
    let e0=0;for(let i=0;i<W;i++)e0+=x[p+i]*x[p+i];if(e0<1e-6)continue;
    const R=new Float32Array(161);let best=0;for(let L=20;L<=160;L++){let c=0,e1=0;for(let i=0;i<W;i++){c+=x[p+i]*x[p+i+L];e1+=x[p+i+L]*x[p+i+L];}R[L]=c/Math.sqrt(e0*e1+1e-9);if(R[L]>best)best=R[L];}
    if(best>.5){let lag=0;for(let L=21;L<160;L++)if(R[L]>=.88*best&&R[L]>=R[L-1]&&R[L]>=R[L+1]){lag=L;break;}if(lag)f0s.push(Math.log(rate/lag));}
    for(let i=1;i<W;i++)if((x[p+i]>=0)!==(x[p+i-1]>=0))z++;zc+=W;
  }
  f0s.sort((a,b)=>a-b);
  return{f0:f0s.length?f0s[Math.floor(f0s.length/2)]:null,zcr:zc?z/zc:0};
}
function kmeans(pts,k){
  if(k<=1)return pts.map(()=>0);
  const order=pts.map((p,i)=>i).sort((a,b)=>pts[a][0]-pts[b][0]);
  let C=Array.from({length:k},(_,j)=>pts[order[Math.floor((j+.5)/k*order.length)]].slice());
  let lab=pts.map(()=>0);
  for(let it=0;it<30;it++){
    lab=pts.map(p=>{let bi=0,bd=1e9;C.forEach((c,j)=>{const d=c.reduce((s,v,q)=>s+(v-p[q])**2,0);if(d<bd){bd=d;bi=j;}});return bi;});
    C=C.map((c,j)=>{const m=pts.filter((_,i)=>lab[i]===j);return m.length?c.map((_,q)=>m.reduce((s,p)=>s+p[q],0)/m.length):c;});
  }
  return lab;
}
function runWhisper(audio16){
  return new Promise((res,rej)=>{
    const w=new Worker('asr-worker.js',{type:'module'});
    w.onmessage=e=>{const m=e.data;
      if(m.type==='progress'&&m.pct!=null)$('trMsg').textContent=`Downloading speech model… ${Math.round(m.pct)}%`;
      else if(m.type==='status')$('trMsg').textContent=m.text;
      else if(m.type==='done'){w.terminate();res(m.words);}
      else if(m.type==='error'){w.terminate();rej(new Error(m.message));}};
    w.onerror=e=>{w.terminate();rej(new Error(e.message||'Speech model failed to start'));};
    w.postMessage({audio:audio16});
  });
}
$('transcribeBtn').onclick=async()=>{
  if(!S.voice)return;const btn=$('transcribeBtn');btn.disabled=true;
  try{
    $('trMsg').textContent='Finding the lines…';
    const x16=await resample(S.voice,16000),x8=await resample(S.voice,8000);
    const segs=segmentsFrom(x16,16000);
    if(!segs.length)throw new Error('No speech found. Is the recording silent or very quiet?');
    let k=+$('nspk').value||2;
    if($('format').value==='monologue'&&$('nspk').value==='0')k=1;
    $('trMsg').textContent='Telling the voices apart…';await new Promise(r=>setTimeout(r,20));
    const F=segs.map(s=>features(x8,8000,s));
    const vf=F.filter(f=>f.f0!=null),mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),sd=(a,m)=>Math.sqrt(mean(a.map(v=>(v-m)**2)))||1;
    const mf=mean(vf.map(f=>f.f0)),sf=sd(vf.map(f=>f.f0),mf),mz=mean(F.map(f=>f.zcr)),sz=sd(F.map(f=>f.zcr),mz);
    const pts=F.map(f=>[f.f0==null?0:2*(f.f0-mf)/sf,(f.zcr-mz)/sz]);
    const lab=kmeans(pts,Math.min(k,segs.length));
    segs.forEach((s,i)=>s.spk='speaker_'+lab[i]);
    // merge neighbours from the same voice
    const lines=[];for(const s of segs){const L=lines[lines.length-1];if(L&&L.spk===s.spk&&s.start-L.end<.6&&s.end-L.start<9)L.end=s.end;else lines.push({spk:s.spk,start:s.start,end:s.end,text:'',fx:'none'});}
    if($('doWords').checked){
      try{const words=await runWhisper(x16);
        for(const w of words){const mid=(w.start+w.end)/2;let best=null,bd=1e9;for(const l of lines){const d=mid<l.start?l.start-mid:mid>l.end?mid-l.end:0;if(d<bd){bd=d;best=l;}}if(best&&bd<1.5)best.text=(best.text+' '+w.text.trim()).trim();}
      }catch(err){$('trMsg').innerHTML=`<span class="err">Couldn't catch the words (${esc(err.message)}). Voices were still split.</span>`;await new Promise(r=>setTimeout(r,1500));}
    }
    S.lines=lines;
    const spks=[...new Set(lines.map(l=>l.spk))].sort();
    S.spkMap={};spks.forEach((s,i)=>S.spkMap[s]=(S.chars[i%S.chars.length]||{}).id);
    S.lines.forEach(l=>l.char=S.spkMap[l.spk]);
    renderLines();
    const hasText=S.lines.some(l=>l.text);
    $('trMsg').innerHTML=`<span class="ok">${S.lines.length} lines, ${spks.length} voice${spks.length>1?'s':''}${hasText?'':' (no words, so captions and AI directing are off)'}</span>`;
    $('planBtn').disabled=!hasText;$('autoBtn').disabled=false;
  }catch(err){$('trMsg').innerHTML=`<span class="err">${esc(err.message)}</span>`;}
  btn.disabled=false;
};
function refreshSpeakerMap(){
  const el=$('spkMap');if(!S.lines.length){el.innerHTML='';return;}
  const spks=Object.keys(S.spkMap).sort();el.innerHTML='';
  spks.forEach((s,i)=>{const l=document.createElement('label');l.innerHTML=`Voice ${i+1} → `;const sel=charSelect(S.spkMap[s]);sel.onchange=()=>{S.spkMap[s]=sel.value;S.lines.forEach(x=>{if(x.spk===s)x.char=sel.value;});renderLines();invalidate();};l.appendChild(sel);el.appendChild(l);});
}
function charSelect(v){const sel=document.createElement('select');S.chars.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;sel.appendChild(o);});sel.value=v;return sel;}
const FXS=['none','far','wall','phone','outside','echo','room'];
function renderLines(){
  refreshSpeakerMap();
  const el=$('lines');el.innerHTML='';
  S.lines.forEach((l,i)=>{const d=document.createElement('div');d.className='line';
    d.innerHTML=`<span class="muted">${fmt(l.start)}</span>`;const cs=charSelect(l.char);cs.onchange=()=>{l.char=cs.value;invalidate();};d.appendChild(cs);
    const tx=document.createElement('input');tx.type='text';tx.value=l.text;tx.placeholder=`(${(l.end-l.start).toFixed(1)} s line, type the words for captions)`;tx.oninput=()=>{l.text=tx.value;$('planBtn').disabled=!S.lines.some(x=>x.text);};d.appendChild(tx);
    const fx=document.createElement('select');FXS.forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent='🔊 '+f;fx.appendChild(o);});fx.value=l.fx||'none';fx.onchange=()=>{l.fx=fx.value;S.mix=null;};d.appendChild(fx);
    el.appendChild(d);});
}

// ---------- direction ----------
$('planBtn').onclick=async()=>{
  const btn=$('planBtn');btn.disabled=true;$('planMsg').textContent='The director is reading your script… (15–50 s)';
  try{
    const cast=[...new Set(S.lines.map(l=>l.char))].map(id=>{const c=charById(id);return{id,name:c.name,look:`${c.headwear!=='none'?c.headwear+', ':''}${c.top}`};});
    const d=await api('/api/plan',{format:$('format').value,aspect:$('aspect').value,cast,lines:S.lines.map(l=>({start:l.start,end:l.end,char:l.char,text:l.text})),duration:S.voice.duration,notes:$('notes').value});
    applyPlan(d.plan);$('planMsg').innerHTML='<span class="ok">Directed. Review the plan below.</span>';refreshAccount();
  }catch(err){$('planMsg').innerHTML=`<span class="err">${esc(err.message)}</span> Using quick auto-direct instead.`;applyPlan(autoPlan());}
  btn.disabled=false;
};
$('autoBtn').onclick=()=>{applyPlan(autoPlan());$('planMsg').innerHTML='<span class="ok">Auto-directed.</span>';};
function autoPlan(){
  const fmtv=$('format').value,vertical=$('aspect').value==='9:16';
  const cast=[...new Set(S.lines.map(l=>l.char))];
  const set={bit:'living_room',monologue:'void',confessional:'living_room',news:'newsdesk'}[fmtv];
  const scenes=[{start:0,set,cast}];const shots=[];
  S.lines.forEach((l,i)=>{const long=l.end-l.start>2.2;const close=vertical?(i%3!==2):(long&&i%2===0)||cast.length===1&&i%2===0;shots.push({start:Math.max(0,l.start-.1),type:close?'close':'wide',on:l.char});});
  return{title:'',scenes,shots,fx:[],props:[],cards:[],notes:'Quick auto-direct: one set, cuts follow whoever is talking.'};
}
function applyPlan(p){
  const ids=new Set(S.chars.map(c=>c.id));
  S.plan={title:p.title||'',scenes:(p.scenes||[]).filter(s=>Toon.SETS[s.set]).map(s=>({start:+s.start||0,set:s.set,cast:(s.cast||[]).filter(id=>ids.has(id))})),shots:(p.shots||[]).map(s=>({start:+s.start||0,type:s.type==='close'?'close':'wide',on:s.on})).sort((a,b)=>a.start-b.start),props:(p.props||[]).filter(x=>x.emoji),cards:(p.cards||[])};
  if(!S.plan.scenes.length)S.plan.scenes=[{start:0,set:'living_room',cast:[...new Set(S.lines.map(l=>l.char))]}];
  S.plan.scenes.sort((a,b)=>a.start-b.start);S.plan.scenes[0].start=0;
  for(const f of(p.fx||[]))if(S.lines[f.line]&&FXS.includes(f.fx))S.lines[f.line].fx=f.fx;
  $('title').value=S.plan.title;$('planNotes').textContent=p.notes||'';
  renderLines();renderScenes();invalidate();
  $('playBtn').disabled=$('renderBtn').disabled=$('addScene').disabled=false;
  drawAt(0);
}
function renderScenes(){
  const el=$('scenes');el.innerHTML='';
  S.plan.scenes.forEach((s,i)=>{const d=document.createElement('div');d.className='scene';
    const t=document.createElement('input');t.type='text';t.value=s.start.toFixed(1);t.size=5;t.disabled=i===0;t.onchange=()=>{s.start=parseFloat(t.value)||0;S.plan.scenes.sort((a,b)=>a.start-b.start);renderScenes();drawAt(s.start);};d.appendChild(t);
    const st=document.createElement('select');Object.entries(Toon.SETS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v.label;st.appendChild(o);});st.value=s.set;st.onchange=()=>{s.set=st.value;drawAt(s.start+.5);};d.appendChild(st);
    const cs=document.createElement('span');S.chars.forEach(c=>{const l=document.createElement('label');l.style.marginRight='10px';const cb=document.createElement('input');cb.type='checkbox';cb.checked=s.cast.includes(c.id);cb.onchange=()=>{s.cast=cb.checked?[...s.cast,c.id]:s.cast.filter(x=>x!==c.id);drawAt(s.start+.5);};l.appendChild(cb);l.append(' '+c.name);cs.appendChild(l);});d.appendChild(cs);
    const del=document.createElement('button');del.className='sec';del.textContent='×';del.style.padding='2px 8px';del.disabled=i===0;del.onclick=()=>{S.plan.scenes.splice(i,1);renderScenes();};d.appendChild(del);
    el.appendChild(d);});
  const pr=S.plan.props.length?`<p class="muted">Pop-ups: ${S.plan.props.map(p=>`${esc(p.emoji)} ${esc(p.label||'')} @${fmt(p.start)}`).join(' · ')}</p>`:'';
  el.insertAdjacentHTML('beforeend',pr);
}
$('addScene').onclick=()=>{const last=S.plan.scenes[S.plan.scenes.length-1];S.plan.scenes.push({start:Math.min(S.voice.duration-1,last.start+10),set:'kitchen',cast:[...last.cast]});renderScenes();};
$('title').oninput=()=>{if(S.plan)S.plan.title=$('title').value;};
$('aspect').onchange=()=>{invalidate();if(S.plan)drawAt(0);};
$('captions').onchange=()=>{if(S.plan)drawAt(0);};
function invalidate(){S.mix=null;}

function episode(W,H){
  const cast={};S.chars.forEach(c=>cast[c.id]=c);
  return{W,H,cast,lines:S.lines.map((l,i)=>({start:l.start,end:l.end,char:l.char,text:l.text||'',idx:i})),scenes:S.plan.scenes,shots:S.plan.shots,props:S.plan.props,cards:S.plan.cards,title:S.plan.title,captions:$('captions').checked,env:S.env};
}
function dims(){return $('aspect').value==='9:16'?[720,1280]:[1280,720];}

// ---------- audio mix with per-line effects ----------
function impulse(ctx,sec,decay){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
function fxChain(ctx,fx,dest,irShort,irLong){
  const inp=ctx.createGain();const out=ctx.createGain();out.connect(dest);
  const filt=(type,f,q)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;return b;};
  const wet=(ir,amt)=>{const cv=ctx.createConvolver();cv.buffer=ir;const g=ctx.createGain();g.gain.value=amt;inp.connect(cv);cv.connect(g);g.connect(out);};
  switch(fx){
    case'far':{const lp=filt('lowpass',2400);const g=ctx.createGain();g.gain.value=.42;inp.connect(lp);lp.connect(g);g.connect(out);wet(irLong,.28);break;}
    case'wall':{const lp=filt('lowpass',520);const g=ctx.createGain();g.gain.value=.95;inp.connect(lp);lp.connect(g);g.connect(out);break;}
    case'phone':{const hp=filt('highpass',450),lp=filt('lowpass',3200),pk=filt('peaking',1500,1);pk.gain.value=6;const ws=ctx.createWaveShaper();const cu=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cu[i]=Math.tanh(x*2.2);}ws.curve=cu;const g=ctx.createGain();g.gain.value=.8;inp.connect(hp);hp.connect(lp);lp.connect(pk);pk.connect(ws);ws.connect(g);g.connect(out);break;}
    case'outside':{const hp=filt('highpass',140),lp=filt('lowpass',7000);const g=ctx.createGain();g.gain.value=.8;inp.connect(hp);hp.connect(lp);lp.connect(g);g.connect(out);wet(irLong,.08);break;}
    case'echo':{const d=ctx.createDelay(2);d.delayTime.value=.28;const fb=ctx.createGain();fb.gain.value=.38;inp.connect(out);inp.connect(d);d.connect(fb);fb.connect(d);d.connect(out);wet(irLong,.2);break;}
    case'room':{inp.connect(out);wet(irShort,.45);break;}
    default:inp.connect(out);
  }
  return inp;
}
async function buildMix(){
  if(S.mix)return S.mix;
  const dur=S.voice.duration+0.6,ctx=new OfflineAudioContext(2,Math.ceil(dur*SR),SR);
  const master=ctx.createGain();master.connect(ctx.destination);
  const irShort=impulse(ctx,.5,3),irLong=impulse(ctx,1.6,2.5);
  const lines=[...S.lines].sort((a,b)=>a.start-b.start);
  const cuts=[0];for(let i=1;i<lines.length;i++)cuts.push((lines[i-1].end+lines[i].start)/2);cuts.push(S.voice.duration);
  const regions=lines.length?lines.map((l,i)=>({a:cuts[i],b:cuts[i+1],fx:l.fx||'none'})):[{a:0,b:S.voice.duration,fx:'none'}];
  for(const r of regions){
    const len=r.b-r.a;if(len<=0)continue;
    const src=ctx.createBufferSource();src.buffer=S.voice;const g=ctx.createGain();
    g.gain.setValueAtTime(0,r.a);g.gain.linearRampToValueAtTime(1,r.a+.01);g.gain.setValueAtTime(1,Math.max(r.a+.01,r.b-.01));g.gain.linearRampToValueAtTime(0,r.b+.01);
    src.connect(g);g.connect(fxChain(ctx,r.fx,master,irShort,irLong));src.start(r.a,r.a,len+.02);
  }
  if(S.music){const m=ctx.createBufferSource();m.buffer=S.music;m.loop=true;const g=ctx.createGain();g.gain.value=+$('musicVol').value;g.gain.setValueAtTime(+$('musicVol').value,Math.max(0,dur-1.2));g.gain.linearRampToValueAtTime(0,dur);m.connect(g);g.connect(ctx.destination);m.start(0);}
  S.mix=await ctx.startRendering();
  return S.mix;
}

// ---------- drawing ----------
const stage=$('stage'),sctx=stage.getContext('2d');
function svgImage(svg){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));img.onload=()=>{URL.revokeObjectURL(url);res(img);};img.onerror=e=>{URL.revokeObjectURL(url);rej(new Error('frame draw failed'));};img.src=url;});}
async function drawAt(t){if(!S.plan)return;const[W,H]=dims();if(stage.width!==W){stage.width=W;stage.height=H;}stage.style.maxWidth=H>W?'400px':'960px';const img=await svgImage(Toon.frame(episode(W,H),t));sctx.drawImage(img,0,0,W,H);}
let playing=null;
$('playBtn').onclick=async()=>{
  stopPlay();$('renderMsg').textContent='Mixing audio…';const mix=await buildMix();$('renderMsg').textContent='';
  const ctx=AC();await ctx.resume();const src=ctx.createBufferSource();src.buffer=mix;src.connect(ctx.destination);const t0=ctx.currentTime+.1;src.start(t0);
  const [W,H]=dims();const ep=episode(W,H);let drawing=false;
  playing={src,raf:0};$('stopBtn').disabled=false;
  const loop=async()=>{if(!playing)return;const t=ctx.currentTime-t0;if(t>mix.duration){stopPlay();return;}
    if(!drawing&&t>=0){drawing=true;try{const img=await svgImage(Toon.frame(ep,t));sctx.drawImage(img,0,0,W,H);}catch(e){}drawing=false;}
    $('prog').style.width=(100*Math.max(0,t)/mix.duration)+'%';playing&&(playing.raf=requestAnimationFrame(loop));};
  loop();
};
function stopPlay(){if(playing){try{playing.src.stop();}catch(e){}cancelAnimationFrame(playing.raf);playing=null;}$('stopBtn').disabled=true;}
$('stopBtn').onclick=stopPlay;

// ---------- MP4 export (WebCodecs + mp4-muxer) ----------
async function pickVideo(W,H){for(const codec of['avc1.640028','avc1.4d0028','avc1.42E028','avc1.42001f']){const cfg={codec,width:W,height:H,bitrate:3_500_000,framerate:FPS};try{const s=await VideoEncoder.isConfigSupported(cfg);if(s.supported)return cfg;}catch(e){}}return null;}
async function pickAudio(){for(const[codec,mux]of[['mp4a.40.2','aac'],['opus','opus']]){const cfg={codec,sampleRate:SR,numberOfChannels:2,bitrate:160000};try{const s=await AudioEncoder.isConfigSupported(cfg);if(s.supported)return{cfg,mux};}catch(e){}}return null;}
$('renderBtn').onclick=async()=>{
  if(S.busy)return;stopPlay();
  if(!('VideoEncoder' in window)||!('AudioEncoder' in window)){$('renderMsg').innerHTML='<span class="err">This browser can\'t export video. Use Chrome or Edge on a computer.</span>';return;}
  S.busy=true;$('renderBtn').disabled=true;$('out').innerHTML='';
  try{
    const[W,H]=dims();const vcfg=await pickVideo(W,H),acfg=await pickAudio();
    if(!vcfg||!acfg)throw new Error('Video encoding is not supported on this device.');
    const ticket=await api('/api/render-start',{});
    $('renderMsg').textContent='Mixing audio…';const mix=await buildMix();
    const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:W,height:H},audio:{codec:acfg.mux,numberOfChannels:2,sampleRate:SR},fastStart:'in-memory'});
    let encErr=null;
    const ve=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>encErr=e});ve.configure(vcfg);
    const ae=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>encErr=e});ae.configure(acfg.cfg);
    // audio
    const L=mix.getChannelData(0),R=mix.getChannelData(1),CH=SR;for(let i=0;i<L.length;i+=CH){const n=Math.min(CH,L.length-i);const data=new Float32Array(n*2);data.set(L.subarray(i,i+n),0);data.set(R.subarray(i,i+n),n);ae.encode(new AudioData({format:'f32-planar',sampleRate:SR,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(i/SR*1e6),data}));}
    // video
    const cv=new OffscreenCanvas(W,H),cx=cv.getContext('2d');const ep=episode(W,H);ep.watermark=!!ticket.watermark;
    const N=Math.ceil(mix.duration*FPS),t0=performance.now();
    for(let i=0;i<N;i++){
      if(encErr)throw encErr;
      const img=await svgImage(Toon.frame(ep,i/FPS));cx.drawImage(img,0,0,W,H);
      const vf=new VideoFrame(cv,{timestamp:Math.round(i*1e6/FPS),duration:Math.round(1e6/FPS)});ve.encode(vf,{keyFrame:i%(FPS*2)===0});vf.close();
      while(ve.encodeQueueSize>8)await new Promise(r=>setTimeout(r,5));
      if(i%15===0){const el=(performance.now()-t0)/1000,eta=el/(i+1)*(N-i-1);$('prog').style.width=(100*i/N)+'%';$('renderMsg').textContent=`Rendering ${Math.round(100*i/N)}% · about ${fmt(eta)} left`;if(i%60===0)sctx.drawImage(img,0,0,stage.width,stage.height);}
    }
    await ve.flush();await ae.flush();if(encErr)throw encErr;muxer.finalize();
    const blob=new Blob([muxer.target.buffer],{type:'video/mp4'}),url=URL.createObjectURL(blob);
    const name=(S.plan.title||'toontake-episode').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.mp4';
    $('out').innerHTML=`<video src="${url}" controls style="max-height:520px"></video><p><a href="${url}" download="${name}"><button>⬇ Download ${esc(name)}</button></a> <span class="muted">${(blob.size/1e6).toFixed(1)} MB</span></p>`;
    $('prog').style.width='100%';$('renderMsg').innerHTML='<span class="ok">Done!</span>'+(ticket.watermark?' <span class="muted">Free exports carry a small watermark.</span>':'');refreshAccount();
  }catch(err){console.error(err);$('renderMsg').innerHTML=`<span class="err">${esc(err.message||String(err))}</span>`;}
  S.busy=false;$('renderBtn').disabled=false;
};

function fmt(s){s=Math.max(0,s);const m=Math.floor(s/60),x=Math.floor(s%60);return`${m}:${String(x).padStart(2,'0')}`;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
renderCast();
window._S=S;window._applyPlan=applyPlan;window._decode=decode;window._envelope=envelope;
})();
