/* ═══════════════════════════════════════════════════════════
   Numerology Pro — js/loshu.js
   Complete Lo Shu Grid Engine
   ═══════════════════════════════════════════════════════════ */

// Standard Lo Shu Grid positions (row,col) for numbers 1-9
// Traditional Lo Shu:  4 9 2 / 3 5 7 / 8 1 6
const LOSHU_POSITIONS = {
  4:[0,0], 9:[0,1], 2:[0,2],
  3:[1,0], 5:[1,1], 7:[1,2],
  8:[2,0], 1:[2,1], 6:[2,2]
};

const LOSHU_LAYOUT = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6]
];

const NUMBER_MEANINGS = {
  1:{ name:'Sun / Leadership',      trait:'Confidence, willpower, independence, authority, originality',        color:'Gold / Orange',   planet:'Sun',     element:'Fire',  remedy:'Wear gold or orange on Sundays. Chant Surya mantra. Place a Sun yantra facing East.' },
  2:{ name:'Moon / Sensitivity',    trait:'Intuition, emotions, cooperation, diplomacy, nurturing',             color:'White / Silver',  planet:'Moon',    element:'Water', remedy:'Wear white or cream on Mondays. Drink water from a silver vessel. Moon meditation at night.' },
  3:{ name:'Jupiter / Creativity',  trait:'Self-expression, creativity, joy, communication, abundance',         color:'Yellow / Purple', planet:'Jupiter', element:'Fire',  remedy:'Chant Jupiter mantra Thursdays. Wear yellow. Keep a yellow sapphire or topaz.' },
  4:{ name:'Rahu / Stability',      trait:'Hard work, discipline, practicality, loyalty, groundedness',         color:'Electric Blue',   planet:'Rahu',    element:'Earth', remedy:'Wear Hessonite (Gomed). Chant Rahu mantra on Saturdays. Keep Blue Sapphire or Amethyst.' },
  5:{ name:'Mercury / Freedom',     trait:'Adventure, versatility, adaptability, freedom, communication',       color:'Green / Turquoise',planet:'Mercury',element:'Air',   remedy:'Wear Emerald. Chant Budha mantra Wednesdays. Wear green clothing for communication.' },
  6:{ name:'Venus / Harmony',       trait:'Love, beauty, balance, harmony, care, creativity, responsibility',   color:'Pink / White',    planet:'Venus',   element:'Earth', remedy:'Wear Diamond or White Zircon. Chant Shukra mantra Fridays. Rose Quartz near bed.' },
  7:{ name:'Ketu / Spirituality',   trait:'Analysis, introspection, spiritual depth, wisdom, intuition',        color:'Violet / Grey',   planet:'Ketu',    element:'Water', remedy:'Wear Cat\'s Eye stone. Amethyst for meditation. Chant Ketu mantra. Spiritual practice daily.' },
  8:{ name:'Saturn / Power',        trait:'Ambition, authority, material success, resilience, discipline',      color:'Dark Blue / Black',planet:'Saturn', element:'Earth', remedy:'Wear Blue Sapphire. Chant Shani mantra Saturdays. Black Obsidian or Garnet for power.' },
  9:{ name:'Mars / Courage',        trait:'Courage, idealism, compassion, completion, humanitarian vision',     color:'Red / Scarlet',   planet:'Mars',    element:'Fire',  remedy:'Wear Red Coral. Chant Mangal mantra Tuesdays. Red Jasper for vitality and courage.' }
};

const PLANE_MEANINGS = {
  mental:    { label:'Mental Plane (4-9-2)',   nums:[4,9,2], trait:'Logic, memory, analytical thinking, intelligence' },
  emotional: { label:'Emotional Plane (3-5-7)',nums:[3,5,7], trait:'Feelings, relationships, intuition, empathy' },
  practical: { label:'Practical Plane (8-1-6)',nums:[8,1,6], trait:'Action, physical work, material achievement' },
  thought:   { label:'Thought Plane (4-3-8)',  nums:[4,3,8], trait:'Depth of thinking, planning, strategy' },
  will:      { label:'Will Plane (9-5-1)',     nums:[9,5,1], trait:'Determination, drive, willpower, ambition' },
  action:    { label:'Action Plane (2-7-6)',   nums:[2,7,6], trait:'Execution ability, harmony, spiritual action' },
  d1:        { label:'Diagonal (4-5-6)',       nums:[4,5,6], trait:'Balance and universal harmony' },
  d2:        { label:'Diagonal (2-5-8)',       nums:[2,5,8], trait:'Psychic abilities, intuition, insight' }
};

const MISSING_REMEDIES = {
  1:'• Wear Gold or Orange clothing on Sundays\n• Chant "Om Hreem Suryaya Namah" 108 times at sunrise\n• Place a Surya Yantra in East direction\n• Eat wheat, jaggery, and copper vessel water daily\n• Gemstone: Ruby in gold ring on ring finger',
  2:'• Wear White or Cream on Mondays\n• Drink water stored in silver vessel\n• Chant "Om Som Somaya Namah" 108 times on Mondays\n• Meditate under moonlight on full moon nights\n• Gemstone: Pearl or Moonstone in silver',
  3:'• Wear Yellow on Thursdays\n• Chant "Om Graam Greem Graum Sah Gurave Namah" 108 times\n• Keep a yellow sapphire or yellow topaz\n• Offer yellow flowers to Jupiter deity on Thursdays\n• Read and teach to strengthen Jupiter energy',
  4:'• Wear Electric Blue or Indigo on Saturdays\n• Chant "Om Bhram Bhreem Bhraum Sah Rahave Namah"\n• Wear Hessonite (Gomed) in silver\n• Serve the underprivileged on Saturdays\n• Keep Smoky Quartz or Amethyst on work desk',
  5:'• Wear Green or Turquoise on Wednesdays\n• Chant "Om Braam Breem Braum Sah Budhaya Namah"\n• Wear Emerald or Green Tourmaline\n• Read, write, and communicate more actively\n• Keep Fluorite crystal for mental agility',
  6:'• Wear Pink or Light Blue on Fridays\n• Chant "Om Dram Dreem Draum Sah Shukraya Namah"\n• Wear Diamond or White Zircon in silver\n• Keep Rose Quartz near your bed\n• Practice gratitude and acts of beauty daily',
  7:'• Wear Violet or Purple on Thursdays\n• Chant "Om Hreem Ketave Namah" 108 times\n• Wear Cat\'s Eye stone\n• Practice meditation and solitude for 20 min daily\n• Keep Amethyst and Lapis Lazuli for intuition',
  8:'• Wear Dark Blue or Black on Saturdays\n• Chant "Om Praam Preem Praum Sah Shanaischaraya Namah"\n• Wear Blue Sapphire (only after expert advice)\n• Donate black sesame seeds and black cloth on Saturdays\n• Keep Black Obsidian for power and protection',
  9:'• Wear Red or Scarlet on Tuesdays\n• Chant "Om Kraam Kreem Kraum Sah Bhaumaya Namah"\n• Wear Red Coral in copper or gold\n• Exercise and physical activity for Mars energy\n• Keep Bloodstone or Red Jasper for courage'
};

/* ── MAIN GENERATOR ─────────────────────────────────────── */
function generateLoShuGrid(dob, name) {
  if (!dob) return null;

  // Extract all digits from DOB
  const dobDigits = dob.replace(/\D/g, '').split('').map(Number).filter(n => n >= 1 && n <= 9);

  // Count frequency of each digit
  const freq = {};
  for (let i = 1; i <= 9; i++) freq[i] = 0;
  dobDigits.forEach(d => { if (d >= 1 && d <= 9) freq[d]++; });

  // Categorize
  const present  = Object.keys(freq).filter(k => freq[k] > 0).map(Number);
  const missing  = Object.keys(freq).filter(k => freq[k] === 0).map(Number);
  const repeated = Object.keys(freq).filter(k => freq[k] > 1).map(Number);

  // Life path
  const parts   = dob.split('-');
  const d = parseInt(parts[2]), m = parseInt(parts[1]), y = parseInt(parts[0]);
  const lpSum   = sumDigits(d) + sumDigits(m) + sumDigits(y);
  const lifePath = reduceSingle(lpSum);
  const birthNum = reduceSingle(d);
  const destinyNum = name ? reduceSingle(namePythagorean(name)) : null;

  // Planes
  const planes = {};
  Object.entries(PLANE_MEANINGS).forEach(([key, p]) => {
    const nums = p.nums;
    const all   = nums.every(n => present.includes(n));
    const none  = nums.every(n => missing.includes(n));
    planes[key] = { ...p, complete: all, empty: none };
  });

  return { freq, present, missing, repeated, lifePath, birthNum, destinyNum, dobDigits, planes };
}

function sumDigits(n) { return String(n).split('').reduce((s,d) => s + parseInt(d), 0); }
function reduceSingle(n) { while (n > 9 && ![11,22,33].includes(n)) n = sumDigits(n); return n; }
function namePythagorean(name) {
  const map = {a:1,j:1,s:1,b:2,k:2,t:2,c:3,l:3,u:3,d:4,m:4,v:4,e:5,n:5,w:5,f:6,o:6,x:6,g:7,p:7,y:7,h:8,q:8,z:8,i:9,r:9};
  return reduceSingle(name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((s,c) => s + (map[c]||0), 0));
}

/* ── RENDER GRID ────────────────────────────────────────── */
function renderLoShuGrid(result) {
  const { freq, missing, repeated } = result;
  const grid = document.getElementById('loshu-grid');
  grid.innerHTML = '';

  LOSHU_LAYOUT.forEach(row => {
    row.forEach(num => {
      const cell = document.createElement('div');
      cell.className = 'ls-cell';
      const count = freq[num];
      if (count === 0) {
        cell.classList.add('ls-missing');
        cell.innerHTML = `<span class="ls-num missing">${num}</span><span class="ls-dots"></span>`;
        cell.title = `Missing ${num} — ${NUMBER_MEANINGS[num].name}`;
      } else if (count > 1) {
        cell.classList.add('ls-repeated');
        const dots = Array(count).fill(`<span class="repeat-dot"></span>`).join('');
        cell.innerHTML = `<span class="ls-num repeated">${num}</span><div class="ls-dots-row">${dots}</div>`;
        cell.title = `${num} appears ${count}x — ${NUMBER_MEANINGS[num].name}`;
      } else {
        cell.classList.add('ls-present');
        cell.innerHTML = `<span class="ls-num present">${num}</span><span class="ls-dots">●</span>`;
        cell.title = `${num} present — ${NUMBER_MEANINGS[num].name}`;
      }
      grid.appendChild(cell);
    });
  });
}

/* ── RENDER PLANES ──────────────────────────────────────── */
function renderPlanes(result) {
  const { planes } = result;
  const planeEl = document.getElementById('plane-list');
  planeEl.innerHTML = Object.entries(planes).map(([key, p]) => {
    const status = p.complete ? 'complete' : p.empty ? 'empty' : 'partial';
    const icon   = p.complete ? '✓' : p.empty ? '✗' : '~';
    const col    = p.complete ? 'var(--green)' : p.empty ? 'var(--err)' : 'var(--warn)';
    return `<div class="plane-row" style="border-left-color:${col}">
      <div class="plane-icon" style="color:${col}">${icon}</div>
      <div>
        <div class="plane-label">${p.label}</div>
        <div class="plane-trait">${p.trait}</div>
        <div class="plane-status" style="color:${col}">${p.complete ? 'Complete ✓' : p.empty ? 'Empty — needs activation' : 'Partially active'}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── RENDER MISSING ─────────────────────────────────────── */
function renderMissingNumbers(result) {
  const { missing } = result;
  const el = document.getElementById('missing-section');
  if (!missing.length) {
    el.innerHTML = `<div class="section-card success-card"><h4>✓ No Missing Numbers!</h4><p>All 9 numbers (1-9) are present in your date of birth. This is an extremely auspicious and rare Lo Shu Grid indicating a well-balanced life path.</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="section-card">
      <h4>Missing Numbers Analysis &amp; Remedies</h4>
      <p style="margin-bottom:16px;font-size:.83rem;color:var(--muted);">Numbers absent from your DOB indicate areas that require conscious development and specific remedies.</p>
      <div class="missing-grid">
        ${missing.map(n => {
          const info = NUMBER_MEANINGS[n];
          return `<div class="missing-card">
            <div class="mc-num">${n}</div>
            <div class="mc-name">${info.name}</div>
            <div class="mc-planet"><span>Planet:</span> ${info.planet} &nbsp;|&nbsp; <span>Element:</span> ${info.element}</div>
            <div class="mc-trait">${info.trait}</div>
            <div class="mc-remedy-title">Remedies</div>
            <div class="mc-remedy">${MISSING_REMEDIES[n].split('\n').map(r => `<div class="remedy-line">${r.trim()}</div>`).join('')}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── RENDER PRESENT ─────────────────────────────────────── */
function renderPresentNumbers(result) {
  const { present, freq } = result;
  const el = document.getElementById('present-section');
  el.innerHTML = `
    <div class="section-card">
      <h4>Present Numbers — Energy Profile</h4>
      <div class="present-grid">
        ${present.map(n => {
          const info = NUMBER_MEANINGS[n];
          const count = freq[n];
          return `<div class="present-card" style="border-top-color:${numberColor(n)}">
            <div class="prc-header">
              <div class="prc-num" style="color:${numberColor(n)}">${n}${count > 1 ? `<sup>${count}x</sup>` : ''}</div>
              <div class="prc-name">${info.name}</div>
            </div>
            <div class="prc-trait">${info.trait}</div>
            <div class="prc-color"><small>Color: ${info.color} | Planet: ${info.planet}</small></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── RENDER REPEATED ────────────────────────────────────── */
function renderRepeatedNumbers(result) {
  const { repeated, freq } = result;
  const el = document.getElementById('repeated-section');
  if (!repeated.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="section-card">
      <h4>Repeated Numbers — Amplified Energy</h4>
      <p style="font-size:.82rem;color:var(--muted);margin-bottom:12px;">Repeated numbers amplify certain traits — both strengths and challenges.</p>
      <div class="missing-grid">
        ${repeated.map(n => {
          const info = NUMBER_MEANINGS[n];
          const count = freq[n];
          const meanings = {
            2:'Appears ${count}x — Emotional sensitivity may be heightened. Guard against over-sensitivity and mood fluctuations.',
            3:'Appears ${count}x — Creative energy is highly amplified. May lead to scattered energy if unfocused.',
            4:'Appears ${count}x — Rahu energy is intensified. Guard against stubbornness and unconventional thinking.',
            5:'Appears ${count}x — Mercury energy dominates. Great communicator but may be restless or lack focus.',
            6:'Appears ${count}x — Venus amplified. Loving and artistic but may be overly responsible or perfectionistic.',
            7:'Appears ${count}x — Ketu energy is strong. Deep spiritual nature but may tend toward isolation.',
            8:'Appears ${count}x — Saturn intensified. Potential for great success but watch for karmic patterns and delays.',
            9:'Appears ${count}x — Mars energy amplified. Courageous but may face aggression or emotional intensity.'
          };
          return `<div class="missing-card" style="border-top-color:var(--warn);">
            <div class="mc-num" style="background:var(--warn-bg);color:var(--warn);">${n}</div>
            <div class="mc-name">${info.name} (×${count})</div>
            <div class="mc-trait">${(meanings[n]||'').replace('${count}', count)}</div>
            <div class="mc-remedy-title">Balancing Remedy</div>
            <div class="mc-remedy"><div class="remedy-line">${info.remedy}</div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── RENDER CORE NUMBERS ────────────────────────────────── */
function renderCoreNumbers(result) {
  const { lifePath, birthNum, destinyNum } = result;
  const nums = [
    { n: lifePath,  label:'Life Path',    color:'var(--blue)' },
    { n: birthNum,  label:'Birth Number', color:'var(--gold-d)' },
    ...(destinyNum ? [{ n: destinyNum, label:'Destiny',  color:'var(--purple)' }] : [])
  ];
  document.getElementById('core-nums-row').innerHTML = nums.map(({n,label,color}) =>
    `<div class="core-num-box">
      <div class="cn-num" style="color:${color}">${n}</div>
      <div class="cn-label">${label}</div>
      <div class="cn-name" style="color:${color}">${NUMBER_MEANINGS[reduceSingle(n)]?.name || ''}</div>
    </div>`
  ).join('');
}

function numberColor(n) {
  const cols = {1:'#d97706',2:'#3b82f6',3:'#7c3aed',4:'#0891b2',5:'#16a34a',6:'#db2777',7:'#9333ea',8:'#374151',9:'#dc2626'};
  return cols[n] || '#6b7280';
}
