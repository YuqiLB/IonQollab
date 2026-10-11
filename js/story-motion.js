import { SceneClock } from './scene-clock.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const blend = (a, b, x) => a + (b - a) * ease(x);
function lines(text, width = 43) {
  const rows = [''];
  for (const word of text.split(' ')) {
    if ((rows.at(-1) + word).length > width) rows.push('');
    rows[rows.length - 1] += (rows.at(-1) ? ' ' : '') + word;
  }
  return rows.slice(0, 3).map((line, i) => `<tspan x="360" dy="${i ? 24 : 0}">${esc((i ? ' ' : '') + line)}</tspan>`).join('');
}
const envelope = `<rect x="-95" y="-48" width="190" height="108" rx="9"/><path d="M-94 -44 L0 17 L94 -44 M-94 58 L-32 1 M94 58 L32 1"/><text y="91" class="small">ENCRYPTED INVITATION</text>`;
const key = `<circle cx="-32" cy="0" r="22"/><path d="M-10 0 H65 V19 M43 0 V14"/>`;

function rsaMarkup(data) {
  return `<g class="guide"><path d="M80 164H640"/><text x="360" y="32" class="small">YOUR INVITATION / RSA WORKBENCH</text></g>
  <g data-object="prime-p" class="mint"><rect x="-47" y="-35" width="94" height="70" rx="10"/><text y="9" class="number">${data.keys.p}</text><text y="-52" class="small">PRIME p</text></g>
  <g data-object="prime-q" class="pink"><rect x="-47" y="-35" width="94" height="70" rx="10"/><text y="9" class="number">${data.keys.q}</text><text y="-52" class="small">PRIME q</text></g>
  <text data-object="multiply" x="360" y="112" class="number">×</text>
  <g data-object="modulus" class="mint"><text x="360" y="62" class="small">PUBLIC PRODUCT</text><text x="360" y="119" class="big">N = ${data.keys.n}</text></g>
  <g data-object="key" class="gold key-shape">${key}</g>
  <g data-object="letter"><rect x="95" y="216" width="530" height="98" rx="9" class="letter-paper"/><text data-object="plaintext" x="360" y="251" class="letter-text">${lines(data.message)}</text><text data-object="cipher" x="360" y="259" class="cipher-text">${data.packet.ciphertext.slice(0,8).join(' · ')} …</text></g>
  <g data-object="envelope" class="mint packet">${envelope}</g>
  <text data-object="formula" x="360" y="345" class="small">${data.keys.p} × ${data.keys.q} = ${data.keys.n} · public key (${data.keys.n}, ${data.keys.e})</text>`;
}
function attackMarkup(data) {
  let n = 1;
  const residues = Array.from({length:12}, () => { const value=n; n=n*data.base%data.packet.n; return value; });
  return `<g class="guide"><text x="360" y="28" class="small">SHOR’S ALGORITHM / FIND THE REPETITION</text><path d="M55 205H665 M55 85V220"/></g>
  <g data-object="sequence">${residues.map((v,i)=>`<g transform="translate(${70+i*53},${193-v/data.packet.n*100})"><circle r="6"/><text y="-16" class="small">${v}</text></g>`).join('')}<text x="360" y="252" class="small">${data.base}ˣ mod ${data.packet.n} · a repeating sequence</text></g>
  <path data-object="sequence-line" class="mint wave"/>
  <g data-object="waves"><path data-object="wave-a" class="mint wave"/><path data-object="wave-b" class="pink wave"/><path data-object="wave-sum" class="gold wave"/><text x="360" y="280" class="small">INTERFERENCE → MEASURABLE PHASE INFORMATION</text></g>
  <g data-object="peaks"><g data-object="bars"></g><text x="360" y="278" class="small" data-object="measurement-label">AWAITING VERIFIED MEASUREMENTS</text></g>
  <g data-object="factor-left" class="mint"><circle r="43"/><text class="number" y="10" data-object="p-value"></text></g>
  <g data-object="factor-right" class="pink"><circle r="43"/><text class="number" y="10" data-object="q-value"></text></g>
  <g data-object="public-n"><text x="360" y="123" class="small">PUBLIC N</text><text x="360" y="175" class="big">${data.packet.n}</text></g>
  <text data-object="period" x="360" y="52" class="small"></text>
  <g data-object="attack-envelope" class="pink packet">${envelope}</g>
  <g data-object="recovered-key" class="gold key-shape">${key}</g>
  <g data-object="leak"><rect x="75" y="105" width="570" height="152" rx="12" class="leak-paper"/><text x="360" y="86" class="small">ZENO / YOUR ACTUAL MESSAGE</text><text x="360" y="157" class="letter-text" data-object="leaked-text"></text><text x="360" y="305" class="small">FACTORS → PRIVATE KEY → YOUR WORDS</text></g>
  <text data-object="waiting" x="360" y="166" class="small">AWAITING VERIFIED RESULT…</text>
  <text x="360" y="345" class="tiny">Wave motion is a conceptual illustration, not a circuit trace.</text>`;
}
function pqMarkup() {
  return `<g class="guide"><text x="360" y="28" class="small">A BETTER ENVELOPE / ML-KEM EXCHANGE</text><path d="M130 165H590"/></g>
  <g transform="translate(105 110)" class="mint"><circle r="40"/><text y="7">YOU</text></g><g transform="translate(615 110)" class="pink"><circle r="40"/><text y="7">ALICE</text></g>
  <g data-object="public-key" class="pink key-shape">${key}<text y="49" class="small">PUBLIC KEY</text></g>
  <g data-object="kem" class="gold"><rect x="-85" y="-25" width="170" height="50" rx="8"/><text y="7" class="small">ENCAPSULATION</text></g>
  <g data-object="secret-left" class="mint key-shape">${key}<text y="51" class="small">SHARED SECRET</text></g>
  <g data-object="secret-right" class="pink key-shape">${key}<text y="51" class="small">SAME SECRET</text></g>
  <g data-object="safe-packet" class="mint packet">${envelope}</g>
  <text data-object="protected" x="360" y="285" class="number">A NEW KEY. A NEW PLAN.</text>
  <text x="360" y="346" class="tiny">Illustration only · ML-KEM establishes a secret; symmetric encryption protects messages.</text>`;
}

export function mountStoryMotion(host, {kind, data, getResult = () => null, onCaption, onComplete, onProgress = () => {}}) {
  const duration = kind === 'rsa' ? 13000 : kind === 'attack' ? 22000 : 11000;
  const clock = new SceneClock(duration, kind === 'attack' ? 12500 : duration);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wrapper = document.createElement('div'); wrapper.className = 'motion-scene motion-' + kind;
  wrapper.innerHTML = `<div class="scene-indicator"><span>${kind === 'rsa' ? 'BUILD / ENCRYPT / SEND' : kind === 'attack' ? 'PATTERN / INTERFERENCE / RECOVERY' : 'EXCHANGE / AGREE / PROTECT'}</span><span class="scene-time"></span></div><svg viewBox="0 0 720 370" role="img" aria-label="${kind === 'rsa' ? 'Your primes combine and your invitation becomes an encrypted packet' : kind === 'attack' ? 'Order finding, measurement, and verified recovery of the intercepted invitation' : 'Illustrative public-key exchange and matching shared secrets'}">${kind === 'rsa' ? rsaMarkup(data) : kind === 'attack' ? attackMarkup(data) : pqMarkup()}</svg><div class="scene-progress" role="progressbar" aria-label="Animation progress" aria-valuemin="0" aria-valuemax="100"><span></span></div>`;
  host.replaceChildren(wrapper);
  const nodes = Object.fromEntries([...wrapper.querySelectorAll('[data-object]')].map(n => [n.dataset.object,n]));
  const suspensions = new Set();
  let stopped = false, completed = false, last = null, frame, lastCaption = '', resultRendered = false;
  const opacity = (name,v) => nodes[name].style.opacity = clamp(v);
  const at = (name,x,y,scale=1) => nodes[name].setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);
  const say = text => { if (text !== lastCaption) { lastCaption = text; onCaption(text); } };
  const unlocked = () => kind !== 'attack' || (getResult()?.result?.status === 'success' && typeof getResult()?.text === 'string');
  function render(ms) {
    const raw = ms/1000;
    const cuts = kind === 'rsa' ? [0,3.5,6.5,10,13] : kind === 'attack' ? [0,4,8,12.5,14,17,19.5,22] : [0,3,6,8.5,11];
    const t = reduced.matches ? cuts.filter(n=>n<=raw).at(-1) : raw;
    wrapper.querySelector('.scene-progress>span').style.width = `${ms/duration*100}%`;
    wrapper.querySelector('.scene-progress').setAttribute('aria-valuenow',String(Math.round(ms/duration*100)));
    wrapper.querySelector('.scene-time').textContent = `${Math.min(Math.floor(raw),duration/1000)} / ${duration/1000}s`;
    onProgress(clock.paused, completed);
    if (kind === 'rsa') {
      const merge = ease((t-1)/2);
      at('prime-p',blend(200,310,merge),105); at('prime-q',blend(520,410,merge),105);
      opacity('prime-p',1-(t-3)*2); opacity('prime-q',1-(t-3)*2); opacity('multiply',1-t/3);
      opacity('modulus',(t-3)*2); opacity('key',clamp((t-4.5)*2)*(1-clamp((t-9)*2))); at('key',360,170,.7);
      opacity('plaintext',1-(t-5.8)); opacity('cipher',clamp(t-6)*(1-clamp(t-9)));
      opacity('letter',1-clamp(t-9)); at('letter',0,-ease((t-8)/2)*20,1);
      opacity('envelope',t-9); at('envelope',360,230,blend(.7,1,(t-9)/2)); opacity('formula',t-2);
      say(t<3.5 ? 'Two private primes. Multiply them to make a public number.' : t<6.5 ? 'Large products are easy to make—and hard for ordinary computers to factor.' : t<10 ? 'Your invitation becomes ciphertext using the public key.' : 'The encrypted invitation is ready. Send it to Alice.');
    } else if (kind === 'attack') {
      const result = getResult();
      if (unlocked() && !resultRendered) {
        resultRendered = true;
        const {result:r,text} = result;
        nodes['p-value'].textContent = r.factors[0]; nodes['q-value'].textContent = r.factors[1];
        nodes.period.textContent = `VERIFIED PERIOD r = ${r.period} → FACTORS OF ${data.packet.n}`;
        nodes['leaked-text'].innerHTML = lines(text,42);
        const entries = Object.entries(r.distribution).sort((a,b)=>b[1]-a[1]).slice(0,6);
        const max = Math.max(...entries.map(([,v])=>v));
        nodes.bars.innerHTML = entries.map(([k,v],i)=>`<g transform="translate(${120+i*(480/Math.max(entries.length-1,1))} 230)"><rect x="-14" y="${-130*v/max}" width="28" height="${130*v/max}" rx="3"/><text y="25" class="small">${parseInt(k,2)}</text></g>`).join('');
        nodes['measurement-label'].textContent = r.source === 'sample' ? 'SAMPLE PHASE MEASUREMENTS · NO QUANTUM JOB' : 'ACTUAL RETURNED PHASE MEASUREMENTS';
      }
      opacity('sequence',1-clamp((t-4)/2));
      opacity('sequence-line',1-clamp((t-5)/2));
      let n=1; const values=Array.from({length:12},()=>{const v=n;n=n*data.base%data.packet.n;return v;});
      nodes['sequence-line'].setAttribute('d',values.map((v,i)=>`${i?'L':'M'}${70+i*53} ${193-v/data.packet.n*100}`).join(' '));
      nodes['sequence-line'].style.strokeDasharray='1600'; nodes['sequence-line'].style.strokeDashoffset=String(1600*(1-clamp(t/3)));
      opacity('waves',clamp((t-4)/2)*(1-clamp((t-11)/1.5)));
      const phase = blend(Math.PI,0,(t-6)/4);
      for (const name of ['wave-a','wave-b','wave-sum']) {
        const points=Array.from({length:141},(_,i)=>{
          const angle=i*.17-t*1.5, a=Math.sin(angle)*30, b=Math.sin(angle+phase)*30;
          return `${i?'L':'M'}${80+i*4} ${160+(name==='wave-a'?a:name==='wave-b'?b:a+b)}`;
        });
        nodes[name].setAttribute('d',points.join(' '));
      }
      opacity('peaks',unlocked()?clamp(t-11.5)*(1-clamp(t-14)):0);
      opacity('waiting',!unlocked() && raw>=12.5 ? 1 : 0);
      opacity('public-n',clamp(t-14)*(1-clamp(t-17)));
      opacity('factor-left',clamp((t-15)*2)*(1-clamp((t-18)*2))); opacity('factor-right',clamp((t-15)*2)*(1-clamp((t-18)*2)));
      at('factor-left',blend(360,240,(t-15)/2),170); at('factor-right',blend(360,480,(t-15)/2),170);
      opacity('period',clamp(t-14)*(1-clamp(t-19)));
      opacity('attack-envelope',clamp(t-16.5)*(1-clamp(t-19))); at('attack-envelope',360,245,.7);
      opacity('recovered-key',clamp((t-17)*2)*(1-clamp(t-19))); at('recovered-key',blend(200,360,(t-17)/2),210,.6);
      opacity('leak',t-19);
      wrapper.querySelector('svg').setAttribute('aria-label', t>=19.5 && unlocked() ? `Zeno recovered your invitation: ${result.text}` : 'Order finding, measurement, and verified recovery of the intercepted invitation');
      say(t<4 ? 'Zeno targets the public number. Its modular powers form a repeating pattern.' : t<8 ? 'Quantum interference helps turn that repetition into measurable phase information.' : t<12.5 ? 'Measurements suggest a period. Classical arithmetic must verify it.' : !unlocked() ? 'Waiting for a verified result. The invitation is still encrypted.' : t<17 ? `Verified period: ${result.result.period}. It yields factors ${result.result.factors.join(' and ')}.` : t<19.5 ? 'Those factors rebuild the private key and unlock the copied packet.' : 'Your actual words. Recovered from the toy RSA ciphertext.');
    } else {
      opacity('public-key',1-clamp(t-3)); at('public-key',blend(570,160,t/3),185,.65);
      opacity('kem',clamp(t-3)*(1-clamp(t-6))); at('kem',blend(160,560,(t-3)/3),180);
      opacity('secret-left',clamp(t-3)*(1-clamp(t-8))); at('secret-left',160,250,.65);
      opacity('secret-right',clamp(t-6)*(1-clamp(t-8))); at('secret-right',560,250,.65);
      opacity('safe-packet',clamp(t-8)); at('safe-packet',blend(160,570,(t-8)/2.5),190,.6);
      opacity('protected',(t-10)*2);
      say(t<3 ? 'Alice shares an authenticated public key. Her private key stays with her.' : t<6 ? 'You keep a shared secret. Only encapsulation data travels back.' : t<8.5 ? 'Alice recovers the same secret. Both sides derive a symmetric key.' : 'That key protects the next message. Zeno’s RSA factoring trick no longer applies.');
    }
  }
  function loop(now) {
    if (stopped) return;
    const delta = last === null ? 0 : Math.min(now-last,100); last=now;
    if (!suspensions.size && !document.hidden) clock.tick(delta,unlocked());
    if (!completed) render(clock.elapsed);
    if (clock.elapsed >= duration && !completed) { completed=true; onComplete(); }
    frame=requestAnimationFrame(loop);
  }
  render(0); frame=requestAnimationFrame(loop);
  return {
    get kind() { return kind; },
    get completed() { return completed; },
    toggle() { clock.paused=!clock.paused; },
    suspend(reason,value) { if(value) suspensions.add(reason); else suspensions.delete(reason); last=null; },
    replay() { clock.replay(); completed=false; last=null; },
    skip() { clock.skip(unlocked()); },
    destroy() { stopped=true; cancelAnimationFrame(frame); wrapper.remove(); },
  };
}

export async function flyPacket(game) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const packet=document.createElement('div'); packet.className='outgoing-packet';
  packet.innerHTML='<span>↗</span><strong>TO ALICE</strong><small>Encrypted invitation</small>';
  packet.setAttribute('aria-label','Encrypted invitation travelling to Alice'); game.append(packet);
  const animation=packet.animate([{opacity:0,transform:'translate(-90px,90px) scale(.6)'},{opacity:1,offset:.22,transform:'translate(0,0) scale(1)'},{opacity:1,offset:.72,transform:'translate(100px,-60px) scale(.8)'},{opacity:0,transform:'translate(125px,-40px) scale(.7)'}],{duration:1400,easing:'cubic-bezier(.2,.7,.3,1)'});
  try { await animation.finished; } catch {} finally {packet.remove();}
}
