// ToonTake engine: characters, sets, camera and frame rendering as SVG strings.
(function(){
const OL='#1a1210';
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function shade(h,a){const[r,g,b]=hex2rgb(h);const f=v=>Math.max(0,Math.min(255,Math.round(a<0?v*(1+a):v+(255-v)*a)));return'#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function lerp(a,b,k){return a+(b-a)*k;}
function curly(pts,r){let d=`M${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<pts.length;i++){const[x,y]=pts[i];d+=` A${r} ${r} 0 0 0 ${x} ${y}`;}return d;}

const DEFAULT_TRAITS={name:'Character',skin:'#8d5a3b',hair:'buzz',hairColor:'#1d130e',headwear:'none',hwColor:'#c9b08e',beard:'none',mustache:false,facialColor:'#140d0a',glasses:false,eyes:'normal',brows:'arched',top:'tee',topColor:'#1c1c1f',pants:'joggers',pantsColor:'#2b2d33',shoes:'#e8e8ec',build:'regular'};

// ---------- HEAD ----------
function hairBack(t){
  const c=t.hairColor;
  if(t.headwear==='hijab')return'';
  if(t.hair==='fro')return`<ellipse cx="0" cy="-150" rx="175" ry="140" fill="${c}" stroke="${OL}" stroke-width="7"/>`;
  if(t.hair==='long')return`<path d="M-120 -120 C-140 -250 140 -250 120 -120 L136 250 C80 270 -80 270 -136 250Z" fill="${c}" stroke="${OL}" stroke-width="7"/>`;
  if(t.hair==='locs'){let g='';for(let i=0;i<11;i++){const x=-130+i*26,len=170+((i*37)%50);g+=`<rect x="${x-11}" y="-160" width="22" height="${len+60}" rx="11" fill="${c}" stroke="${OL}" stroke-width="5"/>`;}return g;}
  if(t.hair==='braids'){let g='';for(const s of[-1,1])for(let k=0;k<3;k++){const x=s*(112+k*14);g+=`<path d="M${x} -90 L${x+s*6} 160" stroke="${OL}" stroke-width="22" stroke-linecap="round"/><path d="M${x} -90 L${x+s*6} 160" stroke="${c}" stroke-width="14" stroke-linecap="round" stroke-dasharray="14 6"/>`;}return g;}
  return'';
}
function hairFront(t){
  const c=t.hairColor;
  if(t.headwear==='hijab'||t.hair==='bald')return'';
  const cap=`M-110 -70 C-116 -175 -58 -226 0 -226 C58 -226 116 -175 110 -70 C96 -112 70 -132 36 -140 C14 -134 -14 -134 -36 -140 C-70 -132 -96 -112 -110 -70Z`;
  if(t.hair==='buzz')return`<path d="${cap}" fill="${c}" opacity=".78"/>`;
  if(t.hair==='curly')return`<path d="${curly([[-112,-70],[-118,-120],[-104,-165],[-76,-200],[-40,-222],[0,-230],[40,-222],[76,-200],[104,-165],[118,-120],[112,-70]],16)} C96 -112 70 -132 36 -140 C14 -134 -14 -134 -36 -140 C-70 -132 -96 -112 -112 -70Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`;
  if(t.hair==='fro')return`<path d="M-118 -60 C-130 -150 -80 -200 0 -200 C80 -200 130 -150 118 -60 C100 -110 60 -130 0 -128 C-60 -130 -100 -110 -118 -60Z" fill="${c}"/>`;
  if(t.hair==='braids'){let g=`<path d="${cap}" fill="${c}"/>`;for(let i=-3;i<=3;i++)g+=`<path d="M${i*28} -138 C${i*30} -180 ${i*24} -210 ${i*14} -226" stroke="${shade(c,.25)}" stroke-width="5" fill="none" stroke-dasharray="10 6"/>`;return g;}
  if(t.hair==='long')return`<path d="M-118 -40 C-126 -180 -60 -232 0 -232 C60 -232 126 -180 118 -40 C110 -120 60 -150 4 -160 C-50 -150 -108 -120 -118 -40Z" fill="${c}" stroke="${OL}" stroke-width="6"/>`;
  if(t.hair==='locs')return`<path d="M-116 -70 C-122 -180 -60 -232 0 -232 C60 -232 122 -180 116 -70 C100 -120 60 -140 0 -138 C-60 -140 -100 -120 -116 -70Z" fill="${c}" stroke="${OL}" stroke-width="6"/>`;
  if(t.hair==='bun')return`<path d="${cap}" fill="${c}"/><circle cx="0" cy="-252" r="46" fill="${c}" stroke="${OL}" stroke-width="6"/>`;
  return`<path d="${cap}" fill="${c}" opacity=".78"/>`;
}
function headwear(t){
  const H=t.hwColor||'#c9b08e',H1=shade(H,-.1),H2=shade(H,-.25);
  switch(t.headwear){
    case'beanie':return`<path d="M-122 -96 C-130 -210 -60 -250 0 -250 C60 -250 130 -210 122 -96 Z" fill="${H}" stroke="${OL}" stroke-width="7"/><path d="M-126 -96 L126 -96 L122 -140 L-122 -140Z" fill="${H1}" stroke="${OL}" stroke-width="6"/>`+Array.from({length:12},(_,i)=>`<line x1="${-110+i*20}" y1="-140" x2="${-110+i*20}" y2="-96" stroke="${H2}" stroke-width="4"/>`).join('');
    case'cap':return`<path d="M-118 -110 C-124 -220 -60 -246 0 -246 C60 -246 124 -220 118 -110Z" fill="${H}" stroke="${OL}" stroke-width="7"/><path d="M-120 -110 C-60 -128 60 -128 120 -110 C150 -100 190 -86 200 -70 C120 -96 -60 -98 -120 -110Z" fill="${H1}" stroke="${OL}" stroke-width="6"/><circle cx="0" cy="-244" r="9" fill="${H2}"/>`;
    case'kufi':return`<path d="M-100 -140 C-96 -210 -50 -232 0 -232 C50 -232 96 -210 100 -140 Z" fill="${H}" stroke="${OL}" stroke-width="6"/>`+Array.from({length:6},(_,i)=>`<path d="M${-80+i*32} -150 l8 -14 l8 14" stroke="${H2}" stroke-width="3" fill="none"/>`).join('');
    case'durag':return`<path d="M-116 -90 C-124 -210 -60 -238 0 -238 C60 -238 124 -210 116 -90 C80 -110 -80 -110 -116 -90Z" fill="${H}" stroke="${OL}" stroke-width="7"/><path d="M110 -120 C150 -60 160 40 140 140 L120 140 C130 40 120 -40 96 -100Z" fill="${H1}" stroke="${OL}" stroke-width="5"/><path d="M-90 -110 C-40 -126 40 -126 90 -110" stroke="${H2}" stroke-width="5" fill="none"/>`;
    case'turban':return`<path d="M-128 -104 C-140 -240 -60 -270 0 -270 C60 -270 140 -240 128 -104 C80 -130 -80 -130 -128 -104Z" fill="${H}" stroke="${OL}" stroke-width="7"/><path d="M-118 -140 C-40 -190 60 -186 120 -150 M-110 -180 C-30 -220 60 -216 110 -190" stroke="${H2}" stroke-width="10" fill="none"/>`;
    case'hijab':return`<path d="M-150 -40 C-160 -230 -70 -262 0 -262 C70 -262 160 -230 150 -40 C150 60 120 130 60 168 L-60 168 C-120 130 -150 60 -150 -40Z M-104 -40 C-108 50 -70 128 0 144 C70 128 108 50 104 -40 C104 -150 60 -196 0 -196 C-60 -196 -104 -150 -104 -40Z" fill="${H}" fill-rule="evenodd" stroke="${OL}" stroke-width="7"/><path d="M-104 -40 C-104 -150 -60 -196 0 -196 C60 -196 104 -150 104 -40" stroke="${H2}" stroke-width="5" fill="none"/>`;
  }
  return'';
}
function hijabBack(t){return t.headwear==='hijab'?`<path d="M-170 0 C-190 -240 190 -240 170 0 L190 300 L-190 300Z" fill="${t.hwColor}" stroke="${OL}" stroke-width="7"/>`:'';}

function head(t,s){
  s=s||{};const SK=t.skin,SK2=shade(SK,-.18),FC=t.facialColor||'#140d0a';const look=s.look||0;
  let g='';
  if(t.headwear!=='hijab')g+=`<ellipse cx="-118" cy="-20" rx="22" ry="38" fill="${SK}" stroke="${OL}" stroke-width="6"/><ellipse cx="118" cy="-20" rx="22" ry="38" fill="${SK}" stroke="${OL}" stroke-width="6"/>`;
  g+=`<path d="M-112 -40 C-120 -170 -60 -228 0 -228 C60 -228 120 -170 112 -40 C108 40 80 120 0 150 C-80 120 -108 40 -112 -40Z" fill="${SK}" stroke="${OL}" stroke-width="7"/>`;
  if(!['beanie','kufi','turban','cap','durag'].includes(t.headwear))g+=hairFront(t);
  g+=`<ellipse cx="-30" cy="-150" rx="34" ry="12" fill="${shade(SK,.22)}" opacity=".5"/>`;
  // facial hair
  if(t.beard==='jaw'||t.beard==='full'){
    const outer=[[-114,-24],[-113,10],[-106,46],[-94,80],[-74,112],[-48,136],[-22,150],[0,154],[22,150],[48,136],[74,112],[94,80],[106,46],[113,10],[114,-24]];
    let bd=curly(outer,8);
    bd+=t.beard==='full'?` L96 -24 C86 30 60 50 30 52 L-30 52 C-60 50 -86 30 -96 -24 Z`:` L104 -24 C100 20 92 52 74 80 C60 98 42 108 22 112 L-22 112 C-42 108 -60 98 -74 80 C-92 52 -100 20 -104 -24 Z`;
    g+=`<path d="${bd}" fill="${FC}" stroke="${OL}" stroke-width="4"/>`;
  }
  if(t.beard==='goatee')g+=`<path d="M-30 92 C-30 130 -14 150 0 152 C14 150 30 130 30 92 C16 104 -16 104 -30 92Z" fill="${FC}"/>`;
  const must=t.mustache||t.beard==='jaw'||t.beard==='full'||t.beard==='goatee';
  if(must)g+=`<path d="M-42 64 C-30 52 -12 52 0 55 C12 52 30 52 42 64 C44 70 42 76 40 78 C34 70 22 64 0 64 C-22 64 -34 70 -40 78 C-42 76 -44 70 -42 64Z" fill="${FC}"/>`;
  if(t.beard==='jaw')g+=`<path d="M-10 92 C-6 100 6 100 10 92 C6 106 -6 106 -10 92Z" fill="${FC}"/>`;
  // mouth
  const lip=shade(SK,-.3),open=s.open||0;
  if(open>.06){const h=8+open*30;
    g+=`<path d="M-32 70 C-16 62 16 62 32 70 C24 ${74+h} -24 ${74+h} -32 70Z" fill="${lip}" stroke="${OL}" stroke-width="4"/><path d="M-24 72 C-12 68 12 68 24 72 C16 ${70+h} -16 ${70+h} -24 72Z" fill="#2a0a0a"/><path d="M-18 72 C-8 70 8 70 18 72 L16 77 C6 75 -6 75 -16 77Z" fill="#f4eee0"/>`;
  }else g+=`<path d="M-34 70 C-20 64 20 64 34 70 C24 ${s.frown?80:90} -24 ${s.frown?80:90} -34 70Z" fill="${lip}" stroke="${OL}" stroke-width="4"/><path d="M-32 71 C-12 ${s.frown?68:76} 12 ${s.frown?68:76} 32 71" stroke="${OL}" stroke-width="3" fill="none"/>`;
  // nose
  g+=`<path d="M-9 -24 C-11 -4 -16 8 -30 16 C-36 30 -20 38 -8 32 C-2 38 2 38 8 32 C20 38 36 30 30 16 C16 8 11 -4 9 -24" fill="${SK2}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="-14" cy="26" rx="6" ry="4" fill="${OL}"/><ellipse cx="14" cy="26" rx="6" ry="4" fill="${OL}"/>`;
  // eyes
  const blink=s.blink;
  [-46,46].forEach(x=>{
    g+=`<path d="M${x-28} -62 C${x-16} -80 ${x+16} -80 ${x+28} -62 C${x+16} -48 ${x-16} -48 ${x-28} -62Z" fill="#fff" stroke="${OL}" stroke-width="4"/>`;
    g+=`<circle cx="${x+look}" cy="-62" r="10" fill="#2a160c"/><circle cx="${x+3+look}" cy="-65" r="3" fill="#fff"/>`;
    const lidY=blink?-46:(t.eyes==='heavy'?-70:-78);
    if(blink||t.eyes==='heavy')g+=`<path d="M${x-30} -64 C${x-16} -84 ${x+16} -84 ${x+30} -64 C${x+16} ${lidY} ${x-16} ${lidY} ${x-30} -64Z" fill="${SK2}" stroke="${OL}" stroke-width="4"/>`;
  });
  if(t.glasses)g+=`<rect x="-82" y="-86" width="70" height="50" rx="16" fill="#cfe6f5" fill-opacity=".25" stroke="${OL}" stroke-width="7"/><rect x="12" y="-86" width="70" height="50" rx="16" fill="#cfe6f5" fill-opacity=".25" stroke="${OL}" stroke-width="7"/><path d="M-12 -64 L12 -64 M-82 -64 L-112 -70 M82 -64 L112 -70" stroke="${OL}" stroke-width="6"/>`;
  // brows
  const b=s.brow||0,bc=t.headwear==='hijab'?FC:(t.hair==='bald'?FC:t.hairColor===undefined?FC:FC);
  const arch=t.brows==='straight'?-96:-112, w=t.brows==='thin'?7:11;
  const by=s.angry?8:0;
  g+=`<path d="M-82 ${-88-b} Q-56 ${arch-b+by} -20 ${-94-b*.6+by*1.6}" stroke="${bc}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M20 ${-94-b*.6+by*1.6} Q56 ${arch-b+by} 82 ${-88-b}" stroke="${bc}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  g+=headwear(t);
  return g;
}

// ---------- BODY ----------
const POSES={idle:{l:[-128,400,-128,520],r:[128,400,128,520]},point:{l:[-128,400,-128,520],r:[170,300,250,215]},shrug:{l:[-180,370,-215,285],r:[180,370,215,285]},hips:{l:[-185,380,-100,420],r:[185,380,100,420]},wave:{l:[-128,400,-128,520],r:[190,250,220,130]}};
function mixPose(a,b,k){const A=POSES[a]||POSES.idle,B=POSES[b]||POSES.idle;return{l:A.l.map((v,i)=>lerp(v,B.l[i],k)),r:A.r.map((v,i)=>lerp(v,B.r[i],k))};}
function body(t,pose){
  pose=pose||POSES.idle;const SK=t.skin;let g='';
  const wide=t.build==='big'?1.25:(t.build==='slim'?.9:1);
  const top=t.top||'tee',tc=t.topColor||'#1c1c1f',pc=t.pantsColor||'#2b2d33';
  const sleeve=(top==='tee')?SK:tc;
  // legs
  if(top==='abaya'){
    g+=`<path d="M${-78*wide} 200 L${-110*wide} 712 L${110*wide} 712 L${78*wide} 200Z" fill="${tc}" stroke="${OL}" stroke-width="7"/>`;
    g+=`<ellipse cx="-40" cy="720" rx="40" ry="16" fill="#3a3a3a" stroke="${OL}" stroke-width="5"/><ellipse cx="40" cy="720" rx="40" ry="16" fill="#3a3a3a" stroke="${OL}" stroke-width="5"/>`;
  }else{
    g+=`<path d="M${-80*wide} 330 L-64 668 L-14 668 L-4 400 L4 400 L14 668 L64 668 L${80*wide} 330 Z" fill="${pc}" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>`;
    if(t.pants==='joggers'){g+=`<path d="M${-76*wide} 340 L-62 660 M${76*wide} 340 L62 660" stroke="${shade(pc,.45)}" stroke-width="6"/><rect x="-66" y="650" width="54" height="26" rx="8" fill="${shade(pc,-.3)}" stroke="${OL}" stroke-width="5"/><rect x="12" y="650" width="54" height="26" rx="8" fill="${shade(pc,-.3)}" stroke="${OL}" stroke-width="5"/>`;}
    else g+=`<path d="M-36 340 L-40 660 M36 340 L40 660" stroke="${shade(pc,.25)}" stroke-width="3" stroke-dasharray="8 6"/>`;
    const sc=t.shoes||'#e8e8ec';
    [[-40,-1],[40,1]].forEach(([x,f])=>{g+=`<g transform="translate(${x},700) scale(${f},1)"><path d="M-34 -24 C-30 -34 8 -36 20 -24 C34 -18 52 -10 52 4 L52 12 L-38 12 L-38 -6 Z" fill="${sc}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><path d="M-38 6 L52 6 L52 16 L-38 16Z" fill="#fff" stroke="${OL}" stroke-width="4"/><path d="M-14 -20 C0 -14 14 -10 30 -12" stroke="#d23a2a" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;});
  }
  // torso
  const W=80*wide,S=120*wide;
  if(top!=='abaya')g+=`<path d="M${-W} 190 L${-S} 230 L${-S+16} 300 L${-W} 290 L${-W+2} 360 L${W-2} 360 L${W} 290 L${S-16} 300 L${S} 230 L${W} 190 Z" fill="${tc}" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>`;
  if(top==='hoodie')g+=`<path d="M-60 300 L60 300 L54 350 L-54 350Z" fill="${shade(tc,-.12)}" stroke="${OL}" stroke-width="4"/><path d="M-20 200 L-24 280 M20 200 L24 280" stroke="#eee" stroke-width="4"/>`;
  if(top==='suit')g+=`<path d="M-30 192 L0 260 L30 192" fill="#f2f2f2" stroke="${OL}" stroke-width="4"/><path d="M-10 220 L10 220 L16 330 L0 350 L-16 330Z" fill="#b3202c" stroke="${OL}" stroke-width="4"/>`;
  g+=`<rect x="-26" y="150" width="52" height="56" fill="${SK}" stroke="${OL}" stroke-width="6"/>`;
  if(top==='tee')g+=`<path d="M-34 192 C-20 214 20 214 34 192" stroke="${shade(tc,.2)}" stroke-width="8" fill="none"/>`;
  // arms
  const sh=[[-110*wide,260],[110*wide,260]];
  [['l',0],['r',1]].forEach(([k,i])=>{const p=pose[k],d=`M${sh[i][0]} ${sh[i][1]} Q${p[0]} ${p[1]} ${p[2]} ${p[3]}`;
    g+=`<path d="${d}" stroke="${OL}" stroke-width="40" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${sleeve}" stroke-width="28" fill="none" stroke-linecap="round"/>`;
    if(top==='tee')g+=`<path d="M${sh[i][0]} ${sh[i][1]} Q${lerp(sh[i][0],p[0],.4)} ${lerp(sh[i][1],p[1],.4)} ${lerp(sh[i][0],p[0],.5)} ${lerp(sh[i][1],p[1],.5)}" stroke="${tc}" stroke-width="34" fill="none" stroke-linecap="round"/>`;
    g+=`<ellipse cx="${p[2]}" cy="${p[3]+8}" rx="20" ry="26" fill="${SK}" stroke="${OL}" stroke-width="5"/>`;});
  return g;
}
function character(t,s,pose){
  const bob=s.bob||0,tilt=s.tilt||0;
  return`<g transform="translate(0,${bob}) rotate(${tilt} 0 150)">${hijabBack(t)}${hairBack(t)}</g>${body(t,pose)}<g transform="translate(0,${bob}) rotate(${tilt} 0 150)">${head(t,s)}</g>`;
}

// ---------- SETS ---------- (world 1920x1080; drawn oversized so cropping never shows edges)
const BIG='x="-2000" y="-2000" width="5920" height="5000"';
function floor(y,c){return`<rect x="-2000" y="${y}" width="5920" height="3000" fill="${c}"/><rect x="-2000" y="${y}" width="5920" height="14" fill="${shade(c,-.35)}"/>`;}
const SETS={
  living_room:{label:'Living room',feet:1010,bg:()=>`<rect ${BIG} fill="#e7cf9f"/>${floor(880,'#7a5233')}<rect x="180" y="260" width="300" height="220" fill="#f6ecd6" stroke="${OL}" stroke-width="10"/><path d="M200 460 L280 350 L340 420 L390 370 L460 460Z" fill="#c27a3a" stroke="${OL}" stroke-width="5"/><circle cx="410" cy="320" r="26" fill="#f2b83c" stroke="${OL}" stroke-width="5"/><rect x="1380" y="200" width="380" height="300" fill="#2a3a5a" stroke="${OL}" stroke-width="10"/><path d="M1570 200 L1570 500 M1380 350 L1760 350" stroke="${OL}" stroke-width="8"/><circle cx="1650" cy="270" r="26" fill="#f4f0d0"/><path d="M380 880 C380 760 440 740 520 740 L1400 740 C1480 740 1540 760 1540 880Z" fill="#3f5f7a" stroke="${OL}" stroke-width="10"/><rect x="1660" y="560" width="18" height="320" fill="#3a2a1a"/><path d="M1600 560 L1740 560 L1700 470 L1640 470Z" fill="#f2b83c" stroke="${OL}" stroke-width="6"/>`},
  kitchen:{label:'Kitchen',feet:1010,bg:()=>`<rect ${BIG} fill="#f3efe2"/><rect x="-2000" y="420" width="5920" height="300" fill="#dfe9e6"/>${Array.from({length:40},(_,i)=>`<line x1="${-400+i*70}" y1="420" x2="${-400+i*70}" y2="720" stroke="#c2d2cd" stroke-width="3"/>`).join('')}${floor(880,'#b9a27e')}<rect x="-200" y="560" width="1100" height="320" fill="#a8603a" stroke="${OL}" stroke-width="8"/><rect x="-200" y="540" width="1100" height="34" fill="#e4e0d4" stroke="${OL}" stroke-width="6"/><rect x="100" y="140" width="700" height="220" fill="#a8603a" stroke="${OL}" stroke-width="8"/><path d="M450 140 L450 360" stroke="${OL}" stroke-width="6"/><rect x="1400" y="180" width="300" height="700" rx="20" fill="#e8ecef" stroke="${OL}" stroke-width="10"/><path d="M1400 420 L1700 420" stroke="${OL}" stroke-width="8"/><rect x="1660" y="250" width="16" height="120" rx="8" fill="#888"/><rect x="1660" y="460" width="16" height="160" rx="8" fill="#888"/><rect x="560" y="470" width="190" height="70" fill="#333" stroke="${OL}" stroke-width="6"/>`},
  bedroom:{label:'Bedroom',feet:1010,bg:()=>`<rect ${BIG} fill="#9db7d8"/>${floor(880,'#6b4f3a')}<rect x="1200" y="640" width="700" height="240" fill="#d9d2c4" stroke="${OL}" stroke-width="8"/><rect x="1200" y="560" width="40" height="320" fill="#5a3a22" stroke="${OL}" stroke-width="6"/><rect x="1260" y="610" width="200" height="60" rx="20" fill="#fff" stroke="${OL}" stroke-width="6"/><rect x="200" y="200" width="220" height="300" fill="#e2483b" stroke="${OL}" stroke-width="8"/><circle cx="310" cy="320" r="60" fill="#f2c230" stroke="${OL}" stroke-width="6"/><rect x="0" y="640" width="260" height="240" fill="#8a5a3a" stroke="${OL}" stroke-width="8"/><path d="M0 720 L260 720 M0 800 L260 800" stroke="${OL}" stroke-width="5"/>`},
  bathroom:{label:'Bathroom',feet:1010,bg:()=>`<rect ${BIG} fill="#cfe8ee"/>${Array.from({length:70},(_,i)=>`<line x1="${-1000+i*60}" y1="-1000" x2="${-1000+i*60}" y2="880" stroke="#b5d3db" stroke-width="3"/>`).join('')}${Array.from({length:40},(_,i)=>`<line x1="-2000" y1="${-1000+i*60}" x2="3920" y2="${-1000+i*60}" stroke="#b5d3db" stroke-width="3"/>`).join('')}${floor(880,'#e8e8e8')}<rect x="760" y="140" width="400" height="300" rx="20" fill="#e9f6fa" stroke="${OL}" stroke-width="10"/><path d="M800 180 L880 260" stroke="#fff" stroke-width="10"/><path d="M820 560 L1100 560 L1060 680 L860 680Z" fill="#fff" stroke="${OL}" stroke-width="8"/>`},
  street:{label:'Street',feet:1010,bg:()=>`<rect ${BIG} fill="#8fc7ef"/><rect x="-600" y="80" width="420" height="900" fill="#b0584a" stroke="${OL}" stroke-width="8"/><rect x="-140" y="-100" width="500" height="1080" fill="#6d6f7a" stroke="${OL}" stroke-width="8"/><rect x="420" y="160" width="380" height="820" fill="#c99a5a" stroke="${OL}" stroke-width="8"/><rect x="1300" y="40" width="460" height="940" fill="#7a5a8a" stroke="${OL}" stroke-width="8"/><rect x="1820" y="200" width="420" height="780" fill="#5a8a6a" stroke="${OL}" stroke-width="8"/>${Array.from({length:30},(_,i)=>{const bx=[-560,-100,460,1340,1860][i%5],by=200+Math.floor(i/5)*120;return`<rect x="${bx+30+(i%2)*170}" y="${by}" width="110" height="70" fill="#f6e7a8" stroke="${OL}" stroke-width="5"/>`}).join('')}${floor(900,'#9a9a9a')}<rect x="-2000" y="1060" width="5920" height="400" fill="#454545"/><rect x="1080" y="300" width="20" height="600" fill="#333"/><ellipse cx="1090" cy="300" rx="50" ry="22" fill="#f2c230" stroke="${OL}" stroke-width="6"/>`},
  car:{label:'Car',feet:1090,bg:()=>`<rect ${BIG} fill="#2b2b30"/><path d="M180 120 L1740 120 L1640 560 L280 560Z" fill="#8fc7ef" stroke="${OL}" stroke-width="12"/><rect x="200" y="420" width="1540" height="140" fill="#6f8f5a"/><path d="M820 560 L900 420 L1020 420 L1100 560Z" fill="#555"/><rect x="900" y="150" width="120" height="40" rx="10" fill="#222" stroke="${OL}" stroke-width="5"/>`,fg:()=>`<path d="M-2000 830 C200 780 1720 780 3920 830 L3920 3000 L-2000 3000Z" fill="#3b3b44" stroke="${OL}" stroke-width="12"/><circle cx="560" cy="880" r="150" fill="none" stroke="#1d1d22" stroke-width="34"/><rect x="900" y="860" width="200" height="80" rx="12" fill="#222" stroke="${OL}" stroke-width="6"/>`},
  office:{label:'Office',feet:1010,bg:()=>`<rect ${BIG} fill="#d8d6cf"/>${floor(880,'#7d8a96')}<rect x="-2000" y="420" width="5920" height="460" fill="#9aa6b2"/>${Array.from({length:12},(_,i)=>`<rect x="${-600+i*420}" y="420" width="16" height="460" fill="#6c7782"/>`).join('')}<rect x="1500" y="520" width="120" height="360" fill="#e9eef2" stroke="${OL}" stroke-width="8"/><rect x="1510" y="440" width="100" height="90" rx="30" fill="#8fc7ef" stroke="${OL}" stroke-width="6"/><rect x="160" y="160" width="420" height="160" fill="#fff" stroke="${OL}" stroke-width="8"/><text x="370" y="262" font-size="54" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" fill="#b3202c">SYNERGY</text>`,fg:()=>`<rect x="-400" y="860" width="2720" height="60" fill="#8a5a3a" stroke="${OL}" stroke-width="8"/>`},
  newsdesk:{label:'News desk',feet:1010,bg:()=>`<rect ${BIG} fill="#163a7a"/>${Array.from({length:14},(_,i)=>`<rect x="${-400+i*220}" y="-200" width="110" height="1300" fill="#1d4794"/>`).join('')}<rect x="1320" y="160" width="520" height="300" fill="#0d2552" stroke="#f2c230" stroke-width="10"/><text x="1580" y="340" font-size="84" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" fill="#f2c230">NEWS</text>`,fg:()=>`<path d="M-200 820 L2120 820 L2020 1400 L-100 1400Z" fill="#c9ccd6" stroke="${OL}" stroke-width="10"/><rect x="-200" y="800" width="2320" height="40" fill="#b3202c" stroke="${OL}" stroke-width="8"/>`},
  confessional:{label:'Confessional',feet:1010,bg:()=>`<rect ${BIG} fill="#2c2433"/><circle cx="960" cy="420" r="560" fill="#3d3248"/><rect x="1500" y="520" width="90" height="360" fill="#5a3a22" stroke="${OL}" stroke-width="6"/><path d="M1545 520 C1480 440 1430 420 1420 360 C1490 380 1530 420 1545 470 C1550 400 1590 360 1640 340 C1630 410 1590 460 1545 520Z" fill="#3f8a4a" stroke="${OL}" stroke-width="5"/>${floor(880,'#241c2a')}`},
  void:{label:'Plain backdrop',feet:1010,bg:()=>`<rect ${BIG} fill="#f2c230"/>${floor(880,'#d9a91c')}`}
};
const SLOTS={1:[960],2:[700,1220],3:[520,960,1400],4:[420,780,1140,1500]};

// ---------- FRAME ----------
function wrap(text,max){const w=text.split(/\s+/);const lines=[];let cur='';for(const x of w){if((cur+' '+x).trim().length>max){if(cur)lines.push(cur);cur=x;}else cur=(cur+' '+x).trim();}if(cur)lines.push(cur);return lines;}
function findAt(arr,t){for(let i=arr.length-1;i>=0;i--)if(t>=arr[i].start)return arr[i];return arr[0];}
function easeInOut(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}

// ep: {W,H,cast:{id:traits},lines:[{start,end,char,text}],scenes:[{start,set,cast:[ids]}],shots:[{start,type,on}],props:[],cards:[],title,captions,env:Float32Array(30fps)}
function frame(ep,t){
  const{W,H}=ep,vertical=H>W,fps=30;
  const sc=findAt(ep.scenes,t)||{set:'living_room',cast:Object.keys(ep.cast)};
  const set=SETS[sc.set]||SETS.living_room;
  const castIds=(sc.cast&&sc.cast.length?sc.cast:Object.keys(ep.cast)).filter(id=>ep.cast[id]).slice(0,4);
  const xs=SLOTS[castIds.length]||SLOTS[1];
  const charScale=vertical?.68:.8,feet=set.feet;
  const line=ep.lines.find(l=>t>=l.start&&t<=l.end+.05);
  const spk=line?line.char:null;
  const env=ep.env;const fi=Math.min(env.length-1,Math.max(0,Math.floor(t*fps)));const amp=env[fi]||0;
  // camera
  const shot=findAt(ep.shots||[],t)||{type:'wide'};
  let tgt=shot.type==='close'&&castIds.includes(shot.on)?shot.on:null;
  const sinceCut=t-(shot.start||0);
  let cx=960,cy=feet-430*charScale,vw=vertical?(castIds.length>2?1500:1150):1920;
  if(!vertical&&castIds.length<=2)vw=1700;
  if(castIds.length===1&&!tgt){vw=vertical?900:1500;cx=xs[0];}
  if(tgt){const i=castIds.indexOf(tgt);const y0=feet-720*charScale;cx=xs[i];cy=y0+70*charScale;vw=vertical?400:820;}
  vw/= (1+Math.min(sinceCut,8)*.006); // slow push-in
  const z=W/vw;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g transform="translate(${W/2},${H/2}) scale(${z}) translate(${-cx},${-cy})">`;
  svg+=set.bg();
  castIds.forEach((id,i)=>{
    const tr=ep.cast[id];const talking=id===spk;
    const open=talking?amp:0;
    const seed=i*1.7;
    const blink=((t+seed*1.3)%3.9)<.12;
    const bob=Math.sin(t*2.1+seed)*4+open*6;
    const tilt=Math.sin(t*1.2+seed)*2+(talking?Math.sin(t*3)*1.5:0);
    const brow=open>.85?10:open*4;
    let look=0;if(spk&&!talking&&castIds.includes(spk))look=Math.sign(castIds.indexOf(spk)-i)*7;
    // gestures while talking
    let pose=POSES.idle;
    if(talking&&line){const g=['idle','point','shrug','hips','idle','wave'][(line.idx||0)%6];const d=t-line.start,r=line.end-t;const k=Math.max(0,Math.min(1,d/.3,r/.3));pose=mixPose('idle',g,easeInOut(k));}
    const x=xs[i],y0=feet-720*charScale;
    svg+=`<g transform="translate(${x},${y0}) scale(${charScale})">${character(tr,{open,blink,bob,tilt,brow,look},pose)}</g>`;
  });
  if(set.fg)svg+=set.fg();
  svg+=`</g>`;
  // screen-space overlays
  const u=Math.min(W,H)/720;
  for(const p of(ep.props||[]))if(t>=p.start&&t<=p.end){const k=easeInOut(Math.min(1,(t-p.start)/.25));const bounce=Math.sin((t-p.start)*6)*6*u;const px=vertical?W/2:W*.82,py=vertical?H*.16:H*.3,sz=(vertical?150:130)*u*k;
    svg+=`<circle cx="${px}" cy="${py+bounce}" r="${sz*.85}" fill="#fff" stroke="${OL}" stroke-width="${6*u}"/><text x="${px}" y="${py+bounce+sz*.05}" font-size="${sz}" text-anchor="middle" dominant-baseline="middle">${esc(p.emoji||'❓')}</text>`;
    if(p.label)svg+=`<text x="${px}" y="${py+sz+bounce+10*u}" font-size="${30*u}" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" fill="#fff" stroke="#000" stroke-width="${7*u}" paint-order="stroke">${esc(p.label.toUpperCase())}</text>`;}
  if(sc.set==='confessional'&&castIds.length===1){const nm=ep.cast[castIds[0]].name||'';svg+=`<rect x="${40*u}" y="${H*.62}" width="${Math.max(260,nm.length*24+60)*u}" height="${70*u}" fill="#b3202c"/><text x="${60*u}" y="${H*.62+48*u}" font-size="${40*u}" font-family="Arial Black,Impact,sans-serif" fill="#fff">${esc(nm.toUpperCase())}</text>`;}
  for(const c of(ep.cards||[]))if(t>=c.start&&t<=c.end){svg+=`<rect width="${W}" height="${H}" fill="#000" opacity=".82"/><text x="${W/2}" y="${H/2}" font-size="${64*u}" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black,Impact,sans-serif" fill="#f2c230">${esc(c.text)}</text>`;}
  if(ep.title&&t<2.2){const a=t<1.8?1:(2.2-t)/.4;svg+=`<g opacity="${a}"><rect x="0" y="${H*.08}" width="${W}" height="${110*u}" fill="#000" opacity=".7"/><text x="${W/2}" y="${H*.08+72*u}" font-size="${58*u}" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" fill="#fff">${esc(ep.title)}</text></g>`;}
  const inCard=(ep.cards||[]).some(c=>t>=c.start&&t<=c.end);
  if(ep.captions&&line&&!inCard){const ls=wrap(line.text,vertical?22:40).slice(-2);const fs=(vertical?40:34)*u;const by=H-(vertical?H*.2:60*u);
    ls.forEach((s,k)=>{const y=by-(ls.length-1-k)*fs*1.25;svg+=`<text x="${W/2}" y="${y}" font-size="${fs}" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-weight="900" fill="#fff" stroke="#000" stroke-width="${fs*.22}" paint-order="stroke" stroke-linejoin="round">${esc(s)}</text>`;});}
  if(ep.watermark){const fs=22*u;svg+=`<rect x="${W-260*u}" y="${16*u}" width="${244*u}" height="${40*u}" rx="${20*u}" fill="#000" opacity=".55"/><text x="${W-138*u}" y="${43*u}" font-size="${fs}" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-weight="900" fill="#f2c230">Made with ToonTake</text>`;}
  svg+=`</svg>`;
  return svg;
}
function portrait(tr,W,H){ // character preview card
  return`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="-300 -330 600 1080"><rect x="-300" y="-330" width="600" height="1080" fill="#e7cf9f"/><rect x="-300" y="560" width="600" height="200" fill="#7a5233"/>${character(tr,{},POSES.idle)}</svg>`;
}
window.Toon={frame,portrait,SETS,DEFAULT_TRAITS,shade};
})();
