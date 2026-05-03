/* ═══════════════════════════════════════════════════════════
   Numerology Pro — dashboard.js
   User dashboard controller + all numerology module tabs
   ═══════════════════════════════════════════════════════════ */

/* ── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const user = MockAuth.requireAuth();
  if (!user) return;

  const status = MockAuth.getStatus(user);
  if (status === 'blocked') { MockAuth.logout(); return; }
  if (status !== 'active') {
    alert('Your account is ' + status + '. Please contact admin.'); MockAuth.logout(); return;
  }

  // Set sidebar info
  document.getElementById('ds-avatar').textContent = (user.displayName || '?')[0].toUpperCase();
  document.getElementById('ds-uname').textContent   = user.displayName || user.email;
  const exp = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  document.getElementById('ds-expiry').textContent  = exp ? 'Expires: ' + exp.toLocaleDateString('en-IN') : '';

  // Profile header
  document.getElementById('ph-avatar').textContent = (user.displayName || '?')[0].toUpperCase();
  document.getElementById('ph-name').textContent   = user.displayName || '—';
  document.getElementById('ph-email').textContent  = user.email;
  document.getElementById('ph-mobile').textContent = user.mobile ? 'Mobile: ' + user.mobile : '';

  // Subscription card
  document.getElementById('psc-status').textContent  = status.charAt(0).toUpperCase() + status.slice(1);
  document.getElementById('psc-expiry').textContent  = exp ? exp.toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}) : '';

  // Date
  document.getElementById('dtb-date').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});

  // Pre-fill DOB if known
  if (user.dob) {
    document.getElementById('lsg-dob').value = user.dob;
    document.getElementById('lsg-name').value = user.displayName || '';
  }

  // Wire nav
  document.querySelectorAll('.ds-item').forEach(btn => {
    btn.addEventListener('click', () => goTab(btn.dataset.tab));
  });

  // Inject module tabs
  injectModuleTabs();
});

/* ── NAVIGATION ─────────────────────────────────────────── */
function goTab(tab) {
  // Guard: block disabled modules
  if (tab !== 'profile' && tab !== 'loshu') {
    const states = MockConfig.get('module_states');
    if (states && states[tab] === false) {
      const notice = document.getElementById('module-disabled-notice');
      if (notice) {
        notice.textContent = 'This module is currently disabled by the administrator.';
        notice.style.display = 'block';
        setTimeout(() => { notice.style.display = 'none'; }, 4000);
      }
      // Stay on current tab, don't navigate
      return;
    }
  }
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ds-item').forEach(b => b.classList.remove('active'));
  const el  = document.getElementById('tab-' + tab);
  const btn = document.querySelector(`.ds-item[data-tab="${tab}"]`);
  if (el)  el.classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = {
    'profile':'My Profile','name-vibration':'Name Vibration Analysis','name-correction':'Name Correction',
    'baby-name':'Baby Name Recommendations','business-name':'Business Name Analysis',
    'mobile-number':'Mobile Number Analysis','house-number':'House Number Analysis',
    'vehicle-number':'Vehicle Number Analysis','gemstones':'Gemstone Recommendations',
    'crystals':'Crystal Healing','rudraksha':'Rudraksha Guidance','mantra':'Mantra & Remedies',
    'lucky-numbers':'Lucky & Unlucky Numbers','colors':'Color Therapy','career':'Career Alignment',
    'marriage':'Marriage Compatibility','health':'Health Insights','energy-balance':'Energy Balancing'
  };
  document.getElementById('dash-page-title').textContent = titles[tab] || tab;
  document.getElementById('export-pdf-btn').style.display = 'none';
  if (window.innerWidth <= 900) closeDashSidebar();
  window.scrollTo(0,0);
}

function toggleDashSidebar() {
  document.getElementById('dash-sidebar').classList.toggle('open');
  document.getElementById('dash-overlay').style.display = document.getElementById('dash-sidebar').classList.contains('open') ? 'block' : 'none';
}
function closeDashSidebar() {
  document.getElementById('dash-sidebar').classList.remove('open');
  document.getElementById('dash-overlay').style.display = 'none';
}

/* ── LO SHU GRID ────────────────────────────────────────── */
function generateLoShu() {
  const dob  = document.getElementById('lsg-dob').value;
  const name = document.getElementById('lsg-name').value.trim();
  if (!dob) { alert('Please enter a date of birth.'); return; }

  const result = generateLoShuGrid(dob, name);
  if (!result) return;

  document.getElementById('loshu-result').style.display = 'block';
  renderCoreNumbers(result);
  renderLoShuGrid(result);
  renderPlanes(result);
  renderMissingNumbers(result);
  renderPresentNumbers(result);
  renderRepeatedNumbers(result);

  // Show profile card
  if (name) {
    document.getElementById('quick-profile-card').style.display = 'block';
    document.getElementById('profile-nums-grid').innerHTML = [
      {n:result.lifePath,  l:'Life Path'},
      {n:result.birthNum,  l:'Birth Number'},
      {n:result.destinyNum||'—',l:'Destiny'},
    ].map(({n,l}) => `<div class="png-box"><div class="png-num" style="color:var(--blue);">${n}</div><div class="png-lbl">${l}</div></div>`).join('');
  }

  document.getElementById('export-pdf-btn').style.display = 'inline-block';
  document.getElementById('loshu-result').scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ── PDF EXPORT ─────────────────────────────────────────── */
function exportResultPDF() {
  // Find active result panel
  const activeTab = document.querySelector('.dash-tab.active');
  if (!activeTab) return;
  const resultPanel = activeTab.querySelector('.result-panel');
  if (!resultPanel) {
    alert('Please run an analysis first, then export.');
    return;
  }

  const pageTitle = document.getElementById('dash-page-title')?.textContent || 'Analysis';
  const user = MockAuth.currentUser();
  const userName = user?.displayName || 'User';
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  // Show loading
  const loader = document.createElement('div');
  loader.style.cssText = 'position:fixed;inset:0;background:rgba(17,24,39,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
  loader.innerHTML = '<div style="background:#fff;border-radius:14px;padding:32px 40px;text-align:center;"><div style="font-family:Cormorant Garamond,serif;font-size:1.3rem;font-weight:700;margin-bottom:8px;">Generating PDF...</div><div style="font-size:.82rem;color:#6b7280;">Please wait</div><div style="margin:16px auto 0;width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#C0392B;border-radius:50%;animation:spin .8s linear infinite;"></div></div>';
  const style = document.createElement('style');
  style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  document.body.appendChild(loader);

  // Load jsPDF + html2canvas dynamically
  const loadScript = (src) => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
  ]).then(async () => {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 14;

      // Header
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pageW, 36, 'F');
      pdf.setFillColor(192, 57, 43);
      pdf.roundedRect(margin, 7, 22, 22, 3, 3, 'F');
      pdf.setTextColor(255,255,255);
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(9);
      pdf.text('NP', margin + 11, 20, { align:'center' });
      pdf.setTextColor(232, 201, 126);
      pdf.setFontSize(15);
      pdf.text('Numerology Pro', margin + 27, 16);
      pdf.setTextColor(156,163,175);
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(7);
      pdf.text('PROFESSIONAL SUITE', margin + 27, 22);
      pdf.setFontSize(7);
      pdf.text(today, pageW - margin, 16, { align:'right' });
      pdf.text(userName, pageW - margin, 22, { align:'right' });

      // Section title bar
      pdf.setFillColor(245, 244, 240);
      pdf.rect(0, 36, pageW, 20, 'F');
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(12);
      pdf.text(pageTitle, margin, 48);
      pdf.setDrawColor(229, 225, 216);
      pdf.setLineWidth(0.3);
      pdf.line(0, 56, pageW, 56);

      // Capture result panel
      const canvas = await html2canvas(resultPanel, {
        scale:2, useCORS:true, backgroundColor:'#f0f4ff',
        logging:false, windowWidth:resultPanel.scrollWidth
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const startY = 62;
      const maxH   = pageH - startY - 18;

      if (imgH <= maxH) {
        pdf.addImage(imgData, 'PNG', margin, startY, imgW, imgH);
      } else {
        // Multi-page
        let yPos = startY;
        let remaining = imgH;
        let srcY = 0;
        let page = 0;
        while (remaining > 0) {
          if (page > 0) {
            pdf.addPage();
            yPos = 14;
            pdf.setFillColor(17,24,39);
            pdf.rect(0,0,pageW,10,'F');
            pdf.setTextColor(232,201,126);
            pdf.setFontSize(7);
            pdf.text('Numerology Pro — '+pageTitle, margin, 7);
            pdf.setTextColor(156,163,175);
            pdf.text('Page '+(page+1), pageW-margin, 7, {align:'right'});
          }
          const sliceH = Math.min(remaining, page===0 ? maxH : pageH - 28);
          const tmpC = document.createElement('canvas');
          tmpC.width  = canvas.width;
          tmpC.height = (sliceH / imgH) * canvas.height;
          const ctx   = tmpC.getContext('2d');
          ctx.drawImage(canvas, 0, -(srcY / imgH) * canvas.height);
          pdf.addImage(tmpC.toDataURL('image/png'), 'PNG', margin, yPos, imgW, sliceH);
          srcY      += sliceH;
          remaining -= sliceH;
          page++;
        }
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        const fy = pageH - 10;
        pdf.setFillColor(245,244,240);
        pdf.rect(0, fy-4, pageW, 14, 'F');
        pdf.setDrawColor(229,225,216);
        pdf.line(margin, fy-4, pageW-margin, fy-4);
        pdf.setTextColor(156,163,175);
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(6.5);
        pdf.text('© Numerology Pro | deotigharekaustubh@gmail.com | 8421427605', margin, fy+2);
        pdf.text('Page '+p+' of '+totalPages, pageW-margin, fy+2, {align:'right'});
      }

      pdf.save('NumerologyPro_' + pageTitle.replace(/\s+/g,'_') + '_' + Date.now() + '.pdf');
    } catch(e) {
      console.error('PDF error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      loader.remove();
    }
  }).catch(() => {
    loader.remove();
    alert('Could not load PDF library. Please check your internet connection.');
  });
}

/* ── MODULE TAB INJECTION ───────────────────────────────── */
function injectModuleTabs() {
  const modules = {
    'name-vibration': nameVibrationHTML,
    'name-correction': nameCorrectionHTML,
    'baby-name': babyNameHTML,
    'business-name': businessNameHTML,
    'mobile-number': mobileNumberHTML,
    'house-number': houseNumberHTML,
    'vehicle-number': vehicleNumberHTML,
    'gemstones': gemstonesHTML,
    'crystals': crystalsHTML,
    'rudraksha': rudrakshaHTML,
    'mantra': mantraHTML,
    'lucky-numbers': luckyNumbersHTML,
    'colors': colorsHTML,
    'career': careerHTML,
    'marriage': marriageHTML,
    'health': healthHTML,
    'energy-balance': energyBalanceHTML,
    'email-analysis': emailAnalysisHTML,
    'signature': signatureHTML,
    'lucky-dates': luckyDatesHTML,
    'yantra': yantraHTML,
    'daily-remedies': dailyRemediesHTML,
    'action-plan': actionPlanHTML,
    'relationship': relationshipHTML,
    'finance': financeHTML
  };
  Object.entries(modules).forEach(([id, htmlFn]) => {
    const el = document.getElementById('tab-' + id);
    if (el) el.innerHTML = htmlFn();
  });
  // Apply admin module visibility config
  applyModuleVisibility();
}

/* ── MODULE HTML TEMPLATES ──────────────────────────────── */
function moduleCard(title, desc, formHTML, resultId) {
  return `<div class="module-card">
    <div class="module-title">${title}</div>
    <div class="module-desc">${desc}</div>
    ${formHTML}
    <div class="result-panel" id="${resultId}"></div>
  </div>`;
}

function nameVibrationHTML() {
  return moduleCard('Name Vibration Analysis','Calculate Chaldean & Pythagorean values and compare before/after spelling corrections.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Current Name</label><input type="text" id="na-cur" placeholder="e.g. Rahul Sharma"/></div>
      <div class="fgroup"><label>Corrected Name (optional)</label><input type="text" id="na-cor" placeholder="e.g. Raahul Sharma"/></div>
    </div>
    <div class="fgroup" style="max-width:280px;"><label>Date of Birth (optional)</label><input type="date" id="na-dob"/></div>
    <button class="btn-dash" onclick="calcNameVibration()">Analyse Vibration</button>`,'na-result');
}

function nameCorrectionHTML() {
  return moduleCard('Name Correction & Spelling Optimization','Get spelling suggestions to align your name vibration with your desired outcome.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Current Full Name</label><input type="text" id="nc-name" placeholder="e.g. Sanjay Kumar"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="nc-dob"/></div>
    </div>
    <div class="fgroup" style="max-width:280px;"><label>Desired Outcome</label>
      <select id="nc-goal"><option>Career Growth & Success</option><option>Financial Abundance</option><option>Relationship Harmony</option><option>Health & Wellbeing</option><option>Spiritual Growth</option><option>Fame & Recognition</option></select>
    </div>
    <button class="btn-dash" onclick="calcNameCorrection()">Get Suggestions</button>`,'nc-result');
}

function babyNameHTML() {
  return moduleCard('Baby Name Recommendations','Auspicious names for newborns based on Life Path compatibility.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Baby Date of Birth *</label><input type="date" id="bn-dob"/></div>
      <div class="fgroup"><label>Gender</label><select id="bn-gender"><option>Boy</option><option>Girl</option><option>Any</option></select></div>
    </div>
    <div class="fgroup" style="max-width:240px;"><label>Starting Letter (optional)</label><input type="text" id="bn-letter" placeholder="e.g. A, R, S" maxlength="3"/></div>
    <button class="btn-dash" onclick="calcBabyNames()">Get Names</button>`,'bn-result');
}

function businessNameHTML() {
  return moduleCard('Business Name & Branding Analysis','Vibration check and branding guidance for your business name.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Business Name</label><input type="text" id="bus-name" placeholder="e.g. Sunrise Enterprises"/></div>
      <div class="fgroup"><label>Owner Date of Birth</label><input type="date" id="bus-dob"/></div>
    </div>
    <div class="fgroup" style="max-width:280px;"><label>Industry</label>
      <select id="bus-type"><option>Retail / Trading</option><option>Technology / IT</option><option>Healthcare</option><option>Real Estate</option><option>Finance</option><option>Food & Hospitality</option><option>Education</option><option>Manufacturing</option><option>Services</option></select>
    </div>
    <button class="btn-dash" onclick="calcBusinessName()">Analyse</button>`,'bus-result');
}

function mobileNumberHTML() {
  return moduleCard('Mobile Number Vibration Analysis','Check your mobile number compatibility and get SIM selection guidance.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Mobile Number</label><input type="text" id="mob-num" placeholder="e.g. 9876543210" maxlength="15"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="mob-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcMobile()">Analyse Number</button>`,'mob-result');
}

function houseNumberHTML() {
  return moduleCard('House Number Energy Analysis','Check your home number compatibility and energy remedies.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>House / Flat Number</label><input type="text" id="hn-num" placeholder="e.g. 42, B-7, 15A"/></div>
      <div class="fgroup"><label>Owner Date of Birth</label><input type="date" id="hn-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcHouse()">Analyse</button>`,'hn-result');
}

function vehicleNumberHTML() {
  return moduleCard('Vehicle Number Analysis','Registration number vibration check and protective remedies.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Vehicle Registration Number</label><input type="text" id="veh-num" placeholder="e.g. MH12AB1234"/></div>
      <div class="fgroup"><label>Owner Date of Birth</label><input type="date" id="veh-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcVehicle()">Analyse</button>`,'veh-result');
}

function gemstonesHTML() {
  return moduleCard('Gemstone Recommendations','Power gemstones matched to your Life Path with wearing guidance.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="gem-dob"/></div>
      <div class="fgroup"><label>Primary Goal</label><select id="gem-goal"><option>Success & Prosperity</option><option>Love & Relationships</option><option>Health & Healing</option><option>Protection</option><option>Spiritual Growth</option><option>Mental Clarity</option></select></div>
    </div>
    <button class="btn-dash" onclick="calcGemstone()">Get Gemstone</button>`,'gem-result');
}

function crystalsHTML() {
  return moduleCard('Crystal Healing Suggestions','Specific crystals for numerological imbalances and energy correction.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Your Life Path Number (1–9)</label><input type="number" id="cry-num" min="1" max="9" placeholder="Enter 1 to 9"/></div>
      <div class="fgroup"><label>Area of Imbalance</label><select id="cry-area"><option>Confidence & Self-Worth</option><option>Love & Heart Healing</option><option>Financial Blocks</option><option>Anxiety & Stress</option><option>Spiritual Disconnection</option><option>Communication Issues</option><option>Physical Vitality</option></select></div>
    </div>
    <button class="btn-dash" onclick="calcCrystal()">Get Crystals</button>`,'cry-result');
}

function rudrakshaHTML() {
  return moduleCard('Rudraksha Mukhi Guidance','Personalised Rudraksha recommendations based on Life Path and challenge.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="rud-dob"/></div>
      <div class="fgroup"><label>Current Challenge</label><select id="rud-challenge"><option>Career Stagnation</option><option>Financial Problems</option><option>Health Issues</option><option>Relationship Problems</option><option>Mental Stress / Anxiety</option><option>Spiritual Growth</option><option>Lack of Confidence</option><option>Family Disputes</option></select></div>
    </div>
    <button class="btn-dash" onclick="calcRudraksha()">Get Guidance</button>`,'rud-result');
}

function mantraHTML() {
  return moduleCard('Mantra & Spiritual Remedies','Personalised mantras and spiritual practices for your numbers.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="man-dob"/></div>
      <div class="fgroup"><label>Purpose</label><select id="man-purpose"><option>Protection & Safety</option><option>Wealth & Prosperity</option><option>Love & Relationships</option><option>Health Healing</option><option>Career Success</option><option>Spiritual Awakening</option><option>Peace of Mind</option></select></div>
    </div>
    <button class="btn-dash" onclick="calcMantra()">Get Mantras</button>`,'man-result');
}

function luckyNumbersHTML() {
  return moduleCard('Lucky & Unlucky Numbers','Discover your personalised lucky numbers and what to avoid.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Full Name (optional)</label><input type="text" id="ln-name" placeholder="Your full name"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="ln-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcLuckyNumbers()">Find My Numbers</button>`,'ln-result');
}

function colorsHTML() {
  return moduleCard('Color Therapy Recommendations','Lucky colors based on your Life Path and ruling planet.',`
    <div class="fgroup" style="max-width:280px;"><label>Date of Birth</label><input type="date" id="col-dob"/></div>
    <button class="btn-dash" onclick="calcColors()">Get Colors</button>`,'col-result');
}

function careerHTML() {
  return moduleCard('Career & Profession Alignment','Best career paths matched to your numerological blueprint.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Full Name</label><input type="text" id="car-name" placeholder="Your full name"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="car-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcCareer()">Analyse Career</button>`,'car-result');
}

function marriageHTML() {
  return moduleCard('Marriage Compatibility Analysis','Check numerological compatibility between two people.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Person 1 — Name</label><input type="text" id="mar-n1" placeholder="Full name"/></div>
      <div class="fgroup"><label>Person 1 — DOB</label><input type="date" id="mar-d1"/></div>
      <div class="fgroup"><label>Person 2 — Name</label><input type="text" id="mar-n2" placeholder="Full name"/></div>
      <div class="fgroup"><label>Person 2 — DOB</label><input type="date" id="mar-d2"/></div>
    </div>
    <button class="btn-dash" onclick="calcMarriage()">Check Compatibility</button>`,'mar-result');
}

function healthHTML() {
  return moduleCard('Health Insights & Numerology Balancing','Understand health vulnerabilities and get wellness remedies.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="hlt-dob"/></div>
      <div class="fgroup"><label>Primary Concern</label><select id="hlt-concern"><option>Stress & Mental Health</option><option>Digestive Issues</option><option>Cardiovascular</option><option>Immune System</option><option>Bone & Joint</option><option>Hormonal Balance</option><option>General Vitality</option></select></div>
    </div>
    <button class="btn-dash" onclick="calcHealth()">Get Insights</button>`,'hlt-result');
}

function energyBalanceHTML() {
  return moduleCard('Complete Energy Balancing System','Holistic remedy prescription combining all numerology tools.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Full Name</label><input type="text" id="eb-name" placeholder="Your full name"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="eb-dob"/></div>
    </div>
    <div class="fgroup" style="max-width:320px;"><label>Life Problem / Challenge</label>
      <select id="eb-prob"><option>Career is stuck</option><option>Money keeps leaving</option><option>Relationships failing</option><option>Health problems recurring</option><option>No peace of mind</option><option>Bad luck everywhere</option><option>Feeling lost / no direction</option></select>
    </div>
    <button class="btn-dash" onclick="calcEnergyBalance()">Generate Energy Plan</button>`,'eb-result');
}

/* ── NUMEROLOGY ENGINE (inline for dashboard) ────────────── */
const CHALD={a:1,i:1,j:1,q:1,y:1,b:2,k:2,r:2,c:3,g:3,l:3,s:3,d:4,m:4,t:4,e:5,h:5,n:5,x:5,u:6,v:6,w:6,f:8,p:8};
const PYTH ={a:1,j:1,s:1,b:2,k:2,t:2,c:3,l:3,u:3,d:4,m:4,v:4,e:5,n:5,w:5,f:6,o:6,x:6,g:7,p:7,y:7,h:8,q:8,z:8,i:9,r:9};
function dsum(n){return String(Math.abs(n)).split('').reduce((s,d)=>s+parseInt(d),0);}
function rsingle(n){n=parseInt(n);while(n>9&&![11,22,33].includes(n))n=dsum(n);return n||1;}
function nChaldean(name){return rsingle(name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((s,c)=>s+(CHALD[c]||0),0));}
function nPyth(name){return rsingle(name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((s,c)=>s+(PYTH[c]||0),0));}
function lifePathN(dob){if(!dob)return 1;const[y,m,d]=dob.split('-').map(Number);return rsingle(dsum(d)+dsum(m)+dsum(y));}
function birthN(dob){if(!dob)return 1;return rsingle(parseInt(dob.split('-')[2]));}
function reduceStr(str){const d=str.replace(/\D/g,'');if(!d)return 1;return rsingle(d.split('').reduce((s,x)=>s+parseInt(x),0));}

const ND={1:{name:'The Leader',planet:'Sun',element:'Fire',traits:'Ambitious, Independent, Pioneer',strength:'Leadership, innovation',gem:'Ruby',day:'Sunday',color:'Gold/Orange',mantra:'Om Hreem Suryaya Namah',rud:'12 Mukhi'},2:{name:'The Diplomat',planet:'Moon',element:'Water',traits:'Sensitive, Cooperative, Intuitive',strength:'Empathy, patience',gem:'Pearl/Moonstone',day:'Monday',color:'White/Cream',mantra:'Om Som Somaya Namah',rud:'2 Mukhi'},3:{name:'The Creator',planet:'Jupiter',element:'Fire',traits:'Creative, Expressive, Joyful',strength:'Communication, creativity',gem:'Yellow Sapphire',day:'Thursday',color:'Yellow/Purple',mantra:'Om Graam Greem Graum Sah Gurave Namah',rud:'5 Mukhi'},4:{name:'The Builder',planet:'Rahu',element:'Earth',traits:'Disciplined, Hardworking, Practical',strength:'Organization, persistence',gem:'Hessonite (Gomed)',day:'Saturday',color:'Electric Blue',mantra:'Om Bhram Bhreem Bhraum Sah Rahave Namah',rud:'4 Mukhi'},5:{name:'The Explorer',planet:'Mercury',element:'Air',traits:'Adventurous, Versatile, Charismatic',strength:'Adaptability, communication',gem:'Emerald',day:'Wednesday',color:'Green/Turquoise',mantra:'Om Braam Breem Braum Sah Budhaya Namah',rud:'5 Mukhi'},6:{name:'The Nurturer',planet:'Venus',element:'Earth',traits:'Compassionate, Responsible, Artistic',strength:'Care, love, beauty',gem:'Diamond/White Zircon',day:'Friday',color:'Pink/White',mantra:'Om Dram Dreem Draum Sah Shukraya Namah',rud:'6 Mukhi'},7:{name:'The Seeker',planet:'Ketu',element:'Water',traits:'Analytical, Introspective, Spiritual',strength:'Depth, intuition',gem:"Cat's Eye",day:'Thursday',color:'Violet/Grey',mantra:'Om Hreem Ketave Namah',rud:'7 Mukhi'},8:{name:'The Achiever',planet:'Saturn',element:'Earth',traits:'Powerful, Ambitious, Strategic',strength:'Business acumen, resilience',gem:'Blue Sapphire',day:'Saturday',color:'Dark Blue/Black',mantra:'Om Praam Preem Praum Sah Shanaischaraya Namah',rud:'8 Mukhi'},9:{name:'The Humanitarian',planet:'Mars',element:'Fire',traits:'Courageous, Compassionate, Visionary',strength:'Generosity, wisdom',gem:'Red Coral',day:'Tuesday',color:'Red/Scarlet',mantra:'Om Kraam Kreem Kraum Sah Bhaumaya Namah',rud:'9 Mukhi'}};
const CAREERS={1:['Entrepreneur','CEO/Director','Political Leader','Military Officer','Independent Consultant'],2:['Diplomat','Counsellor/Therapist','Nurse/Healer','Teacher','HR Manager'],3:['Writer/Author','Actor/Performer','Marketing Expert','Graphic Designer','Life Coach'],4:['Engineer/Architect','Chartered Accountant','Project Manager','IT Systems Architect','Legal Professional'],5:['Journalist/Anchor','Travel Agent','Sales Manager','Stockbroker','PR Manager'],6:['Doctor/Healer','Social Worker','Interior Designer','Chef/Restaurateur','School Principal'],7:['Research Scientist','Psychologist','Data Analyst','Inventor','Spiritual Teacher'],8:['Business Tycoon','Investment Banker','Corporate Executive','Judge','Real Estate Developer'],9:['Philanthropist','Surgeon','Human Rights Lawyer','Fine Artist','NGO Director']};
const CRYSTALS={1:['Clear Quartz — amplifies willpower','Citrine — confidence & solar energy','Tiger\'s Eye — determination'],2:['Moonstone — emotional balance','Rose Quartz — love & harmony','Aquamarine — clarity'],3:['Citrine — creativity & joy','Carnelian — expression & motivation','Sunstone — optimism'],4:['Black Tourmaline — grounding','Smoky Quartz — stability','Hematite — focus'],5:['Amazonite — freedom','Turquoise — adventure','Fluorite — mental agility'],6:['Rose Quartz — unconditional love','Green Aventurine — heart healing','Rhodonite — compassion'],7:['Amethyst — spiritual insight','Lapis Lazuli — wisdom','Selenite — higher connection'],8:['Black Obsidian — power','Garnet — ambition','Pyrite — wealth manifestation'],9:['Bloodstone — courage','Red Jasper — vitality','Sodalite — clarity']};
const BABY_NAMES={1:{Boy:['Aditya','Arjun','Rajiv','Surya','Aarav'],Girl:['Ananya','Riya','Priya','Sunita','Aarohi']},2:{Boy:['Chetan','Mohan','Sanjay','Lokesh','Bhanu'],Girl:['Chandra','Mala','Shanti','Lata','Mrinal']},3:{Boy:['Gaurav','Lakshit','Sanjiv','Gagan','Girish'],Girl:['Geeta','Lalitha','Ganga','Gouri','Garima']},4:{Boy:['Deepak','Mayank','Tarun','Dinesh','Dayal'],Girl:['Deepa','Maya','Tanvi','Divya','Damini']},5:{Boy:['Nikhil','Hemant','Xavier','Eshan','Nakul'],Girl:['Neha','Hema','Nisha','Esha','Nandita']},6:{Boy:['Omkar','Varun','Vivek','Vikas','Vedant'],Girl:['Varsha','Vandana','Veena','Vidya','Vaishnavi']},7:{Boy:['Krishna','Karan','Kabir','Kunal','Kavish'],Girl:['Kavya','Kritika','Kiran','Kamala','Komal']},8:{Boy:['Pranav','Pratik','Punit','Prashant','Palash'],Girl:['Puja','Prerna','Pavitra','Pratibha','Pallavi']},9:{Boy:['Mahesh','Rohan','Rishabh','Mangesh','Raj'],Girl:['Meena','Radha','Rekha','Madhuri','Meghna']}};

function nd(n){return ND[rsingle(n)]||ND[1];}
function showRes(id,html){const el=document.getElementById(id);el.innerHTML=html;el.classList.add('show');el.scrollIntoView({behavior:'smooth',block:'nearest'});}
function statRow(items){return `<div style="display:grid;grid-template-columns:repeat(${items.length},1fr);gap:10px;margin-bottom:14px;">${items.map(i=>`<div class="stat-box"><div class="stat-num" style="color:${i.c||'var(--blue)'};">${i.n}</div><div class="stat-lbl">${i.l}</div></div>`).join('')}</div>`;}
function remedyCard(t,b){return `<div class="remedy-card"><div class="remedy-title">${t}</div><div class="remedy-body">${b}</div></div>`;}
function infoGrid(items){return `<div class="info-grid">${items.map(i=>`<div class="info-item"><div class="info-key">${i.k}</div><div class="info-val">${i.v}</div></div>`).join('')}</div>`;}
function divider(){return '<hr class="divider"/>';}

/* ── CALCULATION FUNCTIONS ──────────────────────────────── */
function calcNameVibration(){
  const cur=document.getElementById('na-cur').value.trim();
  const cor=document.getElementById('na-cor').value.trim();
  const dob=document.getElementById('na-dob').value;
  if(!cur){alert('Please enter a name.');return;}
  const cc=nChaldean(cur),cp=nPyth(cur),lp=dob?lifePathN(dob):null;
  let html=statRow([{n:cc,l:'Chaldean'},{n:cp,l:'Pythagorean'}]);
  html+=`<div style="margin-bottom:12px;"><strong>${nd(cc).name}</strong><br/><small>${nd(cc).traits}</small></div>`;
  if(lp) html+=`<div style="margin-bottom:12px;">${lp===cc?'<span class="tag tag-green">✅ Aligned with Life Path '+lp+'</span>':'<span class="tag tag-gold">⚠ Consider aligning toward Life Path '+lp+'</span>'}</div>`;
  if(cor){const nc=nChaldean(cor),np=nPyth(cor);html+=divider()+`<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;"><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;"><small>BEFORE</small><div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;">${cur}</div><span class="tag tag-red">${cc}</span></div><div style="text-align:center;font-size:1.4rem;">→</div><div style="background:var(--green-bg);border:1px solid var(--green-bd);border-radius:8px;padding:12px;"><small>AFTER</small><div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;">${cor}</div><span class="tag tag-green">${nc}</span></div></div>`;}
  html+=divider()+infoGrid([{k:'Planet',v:nd(cc).planet},{k:'Element',v:nd(cc).element},{k:'Lucky Day',v:nd(cc).day},{k:'Gemstone',v:nd(cc).gem}]);
  showRes('na-result',html);
}

function calcNameCorrection(){
  const name=document.getElementById('nc-name').value.trim();
  const dob=document.getElementById('nc-dob').value;
  const goal=document.getElementById('nc-goal').value;
  if(!name){alert('Please enter your name.');return;}
  const cur=nChaldean(name),lp=dob?lifePathN(dob):1;
  const tips=['Add an extra vowel (AA or EE) in the first name','Replace "i" with "ee" to shift vibration','Add a silent H for energy enhancement','Try double letters in the first syllable','Add suffix -a or -ra to balance energy','Change C to K or vice versa','Alter one letter in surname for desired sum'];
  const html=statRow([{n:cur,l:'Current Vibration'},{n:lp,l:'Life Path',c:'var(--gold-d)'}])+
    `<p style="font-size:.83rem;margin-bottom:14px;">Goal: <strong>${goal}</strong></p>`+
    divider()+`<p style="font-size:.81rem;font-weight:600;margin-bottom:10px;">Spelling Correction Suggestions:</p>`+
    tips.map(t=>remedyCard('Spelling Tip',t)).join('')+
    `<div style="margin-top:12px;padding:10px 12px;background:var(--warn-bg);border-radius:8px;font-size:.79rem;color:var(--warn);">Apply corrected name on social media, email, visiting cards, and signature for maximum effect.</div>`;
  showRes('nc-result',html);
}

function calcBabyNames(){
  const dob=document.getElementById('bn-dob').value;
  const gender=document.getElementById('bn-gender').value;
  const letter=document.getElementById('bn-letter').value.trim().toUpperCase();
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob);
  const pool=BABY_NAMES[lp]||BABY_NAMES[1];
  let names=gender==='Any'?[...pool.Boy,...pool.Girl]:(pool[gender]||pool.Boy);
  if(letter) names=names.filter(n=>n.startsWith(letter)).concat(names.filter(n=>!n.startsWith(letter)));
  const html=statRow([{n:lp,l:"Baby's Life Path"}])+
    `<p style="margin-bottom:14px;font-size:.83rem;">${nd(lp).name} — ${nd(lp).traits}</p>`+divider()+
    `<div style="display:flex;flex-wrap:wrap;gap:8px;">${names.map(n=>`<span class="tag tag-purple" style="font-size:.87rem;padding:6px 14px;">${n} <small style="opacity:.6;">${nPyth(n)}</small></span>`).join('')}</div>`;
  showRes('bn-result',html);
}

function calcBusinessName(){
  const bname=document.getElementById('bus-name').value.trim();
  const dob=document.getElementById('bus-dob').value;
  const type=document.getElementById('bus-type').value;
  if(!bname){alert('Please enter business name.');return;}
  const ch=nChaldean(bname),py=nPyth(bname);
  const strong=[1,6,8].includes(ch);
  const html=statRow([{n:ch,l:'Chaldean'},{n:py,l:'Pythagorean'}])+
    `<p style="margin-bottom:12px;font-size:.83rem;"><strong>${bname}</strong> — ${nd(ch).name} energy. ${strong?'✅ Strong business vibration for '+type:'⚠ Consider realigning toward 1, 6, or 8'}</p>`+divider()+
    remedyCard('Brand Color',`Use ${nd(ch).color} as your primary brand color`)+
    remedyCard('Lucky Launch Day',`Best days: ${nd(ch).day}`)+
    remedyCard('Domain Tip','Ensure your website domain also reduces to a compatible number (1, 6, or 8)')+
    remedyCard('Gemstone for Success',`Keep ${nd(ch).gem} in your office or cash drawer`);
  showRes('bus-result',html);
}

function calcMobile(){
  const num=document.getElementById('mob-num').value.trim();
  const dob=document.getElementById('mob-dob').value;
  if(!num){alert('Please enter a mobile number.');return;}
  const val=reduceStr(num),lp=dob?lifePathN(dob):null;
  const compat=lp?(lp===val?'✅ Excellent — Perfectly aligned':Math.abs(lp-val)<=2?'⚡ Good compatibility':'⚠ Partial mismatch — apply remedy'):'';
  const html=statRow([{n:val,l:'Mobile Vibration'}])+
    `<p style="margin-bottom:12px;">${nd(val).name} Energy — ${nd(val).traits}</p>`+
    (lp?`<p style="margin-bottom:12px;"><span class="tag tag-blue">${compat} with Life Path ${lp}</span></p>`:'')+divider()+
    remedyCard('Phone Cover',`Use ${nd(val).color} phone cover to harmonize energy`)+
    remedyCard('Best For',nd(val).strength)+
    remedyCard('Mantra',`Chant "${nd(val).mantra}" before important calls`);
  showRes('mob-result',html);
}

function calcHouse(){
  const num=document.getElementById('hn-num').value.trim();
  const dob=document.getElementById('hn-dob').value;
  if(!num){alert('Please enter house number.');return;}
  const val=reduceStr(num),lp=dob?lifePathN(dob):null;
  const html=statRow([{n:val,l:'House Vibration'}])+
    `<p style="margin-bottom:12px;">${nd(val).name} Residence — ${nd(val).traits}</p>`+divider()+
    remedyCard('Wall Color',`Paint main walls in ${nd(val).color} tones`)+
    remedyCard('Correction',lp&&lp!==val?`Add a letter on your nameplate to shift total toward ${lp}`:'House aligned with your personal numerology ✓')+
    remedyCard('Crystal',`Keep ${CRYSTALS[val]?.[0]?.split('—')[0]} in living area for balance`)+
    remedyCard('North Corner','Keep North corner clean and place a Kubera Yantra or sea salt bowl');
  showRes('hn-result',html);
}

function calcVehicle(){
  const num=document.getElementById('veh-num').value.trim();
  const dob=document.getElementById('veh-dob').value;
  if(!num){alert('Please enter vehicle number.');return;}
  const val=reduceStr(num);
  const html=statRow([{n:val,l:'Vehicle Vibration'}])+
    `<p style="margin-bottom:12px;">${nd(val).name} energy. ${val===4||val===8?'⚠ 4 & 8 need extra protective measures.':'✅ Generally positive vibration.'}</p>`+divider()+
    remedyCard('Protective Remedy',`Hang ${nd(val).color} tassel on rear-view mirror`)+
    remedyCard('Mantra Before Driving',`Chant "${nd(val).mantra}" 3 times before starting vehicle`)+
    remedyCard('Service Day',`Schedule servicing on ${nd(val).day}`);
  showRes('veh-result',html);
}

function calcGemstone(){
  const dob=document.getElementById('gem-dob').value;
  const goal=document.getElementById('gem-goal').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const fingers={1:'Ring finger — right hand',2:'Little finger — right hand',3:'Index finger — right hand',4:'Middle finger — right hand',5:'Little finger — right hand',6:'Ring finger — right hand',7:'Ring finger — right hand',8:'Middle finger — right hand',9:'Ring finger — right hand'};
  const html=statRow([{n:lp,l:'Life Path'}])+
    `<div style="font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:700;color:var(--blue);margin-bottom:10px;">${info.gem}</div>`+
    `<div class="tag tag-gold" style="margin-right:6px;">Metal: ${lp<=3?'Gold':lp<=6?'Silver':'Gold/Copper'}</div><div class="tag tag-green">Day: ${info.day}</div>`+divider()+
    infoGrid([{k:'Wear On',v:fingers[lp]},{k:'Min Weight',v:'3–5 carats certified'},{k:'Planet',v:info.planet},{k:'Goal',v:goal}])+divider()+
    remedyCard('Energize Ritual',`Dip in raw milk for 5 min on ${info.day} morning. Chant "${info.mantra}" 108 times before wearing.`)+
    remedyCard('Caution','Buy certified, natural (untreated) stones only. Consult a gemologist for correct shade.');
  showRes('gem-result',html);
}

function calcCrystal(){
  let n=parseInt(document.getElementById('cry-num').value);
  const area=document.getElementById('cry-area').value;
  if(!n||n<1||n>9){alert('Please enter a number between 1 and 9.');return;}
  const list=CRYSTALS[n]||CRYSTALS[1];
  const html=`<p style="margin-bottom:14px;font-size:.83rem;">Crystals for Number ${n} — ${nd(n).name}</p>`+
    list.map(c=>{const[nm,...rest]=c.split('—');return remedyCard('✧ '+nm.trim(),rest.join('—').trim()||'Powerful healing stone for this vibration');}).join('')+divider()+
    remedyCard('Cleansing','Place crystals under full moonlight overnight monthly to recharge')+
    remedyCard('Placement','Keep in bedroom, on work desk, or carry in left pocket')+
    remedyCard('Programming','Hold crystal, state intention 3 times clearly before placing');
  showRes('cry-result',html);
}

function calcRudraksha(){
  const dob=document.getElementById('rud-dob').value;
  const ch=document.getElementById('rud-challenge').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const chMap={'Career Stagnation':'8 Mukhi (Ganesha)','Financial Problems':'7 Mukhi (Lakshmi)','Health Issues':'6 Mukhi','Mental Stress / Anxiety':'5 Mukhi','Relationship Problems':'2 Mukhi','Spiritual Growth':'14 Mukhi','Lack of Confidence':'12 Mukhi','Family Disputes':'4 Mukhi'};
  const html=statRow([{n:lp,l:'Life Path',c:'var(--purple)'}])+
    `<div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:var(--purple);margin-bottom:10px;">${info.rud} Rudraksha</div>`+
    `<p style="margin-bottom:14px;font-size:.83rem;">For <strong>${ch}</strong>: <strong>${chMap[ch]||info.rud}</strong></p>`+divider()+
    remedyCard('How to Wear','String on red or black thread. Wear touching skin for direct energy transfer.')+
    remedyCard('Energize On',`${info.day} morning, after bath, facing East. Chant "${info.mantra}" 108 times.`)+
    remedyCard('Remove When','During physical intimacy, at cremation grounds, or when attending funerals.');
  showRes('rud-result',html);
}

function calcMantra(){
  const dob=document.getElementById('man-dob').value;
  const purpose=document.getElementById('man-purpose').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const pMap={'Protection & Safety':'Om Namah Shivaya','Wealth & Prosperity':'Om Shreem Hreem Shreem Mahalakshmiyei Namaha','Love & Relationships':'Om Kleem Krishnaya Namaha','Health Healing':'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam','Career Success':'Om Gam Ganapataye Namaha','Spiritual Awakening':'So Hum (I Am That)','Peace of Mind':'Om Shanti Shanti Shanti'};
  const html=statRow([{n:lp,l:'Life Path'}])+
    `<p style="margin-bottom:10px;font-size:.83rem;font-weight:600;">Ruling Planet Mantra — ${info.planet}</p>`+
    `<div class="mantra-box">${info.mantra}</div>`+
    `<p style="margin:12px 0 8px;font-size:.83rem;font-weight:600;">For ${purpose}:</p>`+
    `<div class="mantra-box">${pMap[purpose]||info.mantra}</div>`+divider()+
    remedyCard('Practice','Chant using Rudraksha mala (108 beads) facing East or North at sunrise')+
    remedyCard('Duration','Minimum 40-day continuous practice (one Mandala) for deep results')+
    remedyCard('Amplify',`Light ${nd(lp).color} colored diya while chanting to enhance energy`);
  showRes('man-result',html);
}

function calcLuckyNumbers(){
  const dob=document.getElementById('ln-dob').value;
  const name=document.getElementById('ln-name').value.trim();
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),bn=birthN(dob),dest=name?nPyth(name):lp;
  const lucky=[...new Set([lp,bn,dest,rsingle(lp+bn)])];
  const all=[1,2,3,4,5,6,7,8,9];
  const unlucky=all.filter(n=>!lucky.includes(n)&&((n===4&&[8,5].includes(lp))||(n===8&&[4,5].includes(lp))));
  const neutral=all.filter(n=>!lucky.includes(n)&&!unlucky.includes(n));
  const html=`<div style="margin-bottom:16px;"><p style="font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);margin-bottom:10px;">Lucky Numbers</p><div style="display:flex;gap:10px;flex-wrap:wrap;">${lucky.map(n=>`<div class="stat-box" style="min-width:80px;border-top:3px solid var(--green);"><div class="stat-num" style="color:var(--green);">${n}</div><div class="stat-lbl">${n===lp?'Life Path':n===bn?'Birth':n===dest&&dest!==lp?'Destiny':'Power'}</div></div>`).join('')}</div></div>`+
    (unlucky.length?`<p style="font-size:.8rem;font-weight:600;margin-bottom:8px;">Use With Caution</p><div style="margin-bottom:14px;">${unlucky.map(n=>`<span class="tag tag-red">⚠ ${n}</span>`).join(' ')}</div>`:'')+
    `<p style="font-size:.8rem;font-weight:600;margin-bottom:8px;">Neutral</p><div>${neutral.map(n=>`<span class="tag tag-gold">${n}</span>`).join(' ')}</div>`+divider()+
    remedyCard('Use Lucky Numbers For','Phone PINs, locker codes, invoice amounts, floor numbers, important dates')+
    remedyCard('Display','Show lucky number '+lucky[0]+' in workspace using '+nd(lp).color+' colored artwork');
  showRes('ln-result',html);
}

function calcColors(){
  const dob=document.getElementById('col-dob').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const colorMap={'Gold/Orange':'#D4AF37','White/Cream':'#FFFDD0','Yellow/Purple':'#F1C40F','Electric Blue':'#3B82F6','Green/Turquoise':'#16A34A','Pink/White':'#F472B6','Violet/Grey':'#7C3AED','Dark Blue/Black':'#1E3A8A','Red/Scarlet':'#DC2626'};
  const hex=colorMap[info.color]||'#6b7280';
  const html=statRow([{n:lp,l:'Life Path'}])+
    `<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;"><div style="width:60px;height:60px;border-radius:12px;background:${hex};box-shadow:0 4px 12px rgba(0,0,0,.15);flex-shrink:0;"></div><div><div style="font-weight:600;font-size:1.05rem;">${info.color}</div><div style="font-size:.8rem;color:var(--muted);">Lucky Color for Life Path ${lp}</div></div></div>`+divider()+
    infoGrid([{k:'Lucky Color',v:info.color},{k:'Planet',v:info.planet},{k:'Wear On',v:info.day},{k:'Element',v:info.element}])+divider()+
    remedyCard('Clothing',`Wear ${info.color} on ${info.day} for maximum planetary alignment`)+
    remedyCard('Workspace',`Add ${info.color} accent to your desk — notebook, pen holder, or plant pot`)+
    remedyCard('Home',`Use ${info.color} for main living wall or large soft furnishings`);
  showRes('col-result',html);
}

function calcCareer(){
  const dob=document.getElementById('car-dob').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const careers=CAREERS[lp]||CAREERS[1];
  const html=statRow([{n:lp,l:'Life Path'},{n:birthN(dob),l:'Birth Number',c:'var(--gold-d)'}])+
    `<p style="margin-bottom:12px;font-size:.83rem;"><strong>${info.name}</strong> — ${info.traits}</p>`+
    `<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;">${careers.map(c=>`<span class="tag tag-blue" style="font-size:.82rem;">${c}</span>`).join('')}</div>`+divider()+
    remedyCard('Career Mantra',`Chant "${info.mantra}" before important meetings or interviews`)+
    remedyCard('Work Direction',`Face ${[1,9,3].includes(lp)?'East':'North'} while working for maximum productivity`)+
    remedyCard('Power Day',`${info.day} is your most powerful day for career moves and negotiations`);
  showRes('car-result',html);
}

function calcMarriage(){
  const n1=document.getElementById('mar-n1').value.trim();
  const d1=document.getElementById('mar-d1').value;
  const n2=document.getElementById('mar-n2').value.trim();
  const d2=document.getElementById('mar-d2').value;
  if(!d1||!d2){alert('Please enter both dates of birth.');return;}
  const lp1=lifePathN(d1),lp2=lifePathN(d2);
  const harmonious=new Set(['1-3','3-1','1-5','5-1','1-9','9-1','2-4','4-2','2-6','6-2','3-6','6-3','3-9','9-3','4-8','8-4','6-9','9-6','1-1','2-2','3-3','4-4','5-5','6-6','7-7','8-8','9-9']);
  const challenging=new Set(['1-4','4-1','1-8','8-1','2-7','7-2','4-5','5-4','4-9','9-4']);
  const key=`${lp1}-${lp2}`;
  const score=harmonious.has(key)?Math.min(96,78+Math.floor(Math.random()*12)):challenging.has(key)?Math.max(42,50+Math.floor(Math.random()*10)):Math.max(55,65-Math.abs(lp1-lp2)*4+Math.floor(Math.random()*10));
  const level=score>=85?'💚 Highly Compatible':score>=70?'💛 Good Match':score>=55?'🧡 Needs Conscious Work':'❤️ Requires Effort';
  const combined=rsingle(lp1+lp2);
  const html=`<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:14px;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-top:3px solid var(--blue);border-radius:8px;padding:12px;"><small>${n1||'Person 1'}</small><div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;">LP: ${lp1}</div><small>${nd(lp1).name}</small></div>
    <div style="font-size:1.5rem;text-align:center;">♥</div>
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-top:3px solid var(--purple);border-radius:8px;padding:12px;"><small>${n2||'Person 2'}</small><div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;">LP: ${lp2}</div><small>${nd(lp2).name}</small></div>
  </div>
  <div style="text-align:center;margin-bottom:14px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:700;color:${score>=70?'var(--green)':score>=55?'var(--warn)':'var(--err)'};">${score}%</div>
    <div style="font-size:.9rem;font-weight:500;">${level}</div>
  </div>
  <div style="background:#f3f4f6;border-radius:8px;height:8px;overflow:hidden;margin-bottom:14px;"><div style="background:${score>=70?'var(--green)':score>=55?'#f59e0b':'var(--err)'};width:${score}%;height:100%;border-radius:8px;transition:width .5s;"></div></div>`+divider()+
    infoGrid([{k:'Combined Number',v:combined+' — '+nd(combined).name},{k:'Best Month',v:'Month '+lp1+' or '+lp2},{k:'Auspicious Date',v:'Date reducing to '+combined}])+divider()+
    remedyCard('Pre-Marriage',`Perform Satyanarayan Puja together on Purnima (full moon) for 3 months`)+
    remedyCard('Rudraksha',score<70?`Both wear 2-Mukhi Rudraksha on silver thread for unity`:'Individual Life Path Rudraksha will amplify your respective energies');
  showRes('mar-result',html);
}

function calcHealth(){
  const dob=document.getElementById('hlt-dob').value;
  const concern=document.getElementById('hlt-concern').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const healthMap={1:'Heart, eyes, and back — Sun-ruled. Prone to inflammation and hypertension.',2:'Stomach, lungs, and lymph — Moon-ruled. Watch fluid retention and mood-related issues.',3:'Liver, skin, and blood — Jupiter-ruled. Prone to cholesterol and skin sensitivity.',4:'Bones, teeth, and nervous system — Rahu-ruled. Risk of anxiety and orthopedic issues.',5:'Lungs, bronchial, and skin — Mercury-ruled. Respiratory sensitivity.',6:'Kidneys, throat, and reproductive — Venus-ruled. Hormonal imbalances.',7:'Skin, nerves, and lymph — Ketu-ruled. Auto-immune tendencies.',8:'Bones, knees, and joints — Saturn-ruled. Arthritis and chronic conditions.',9:'Blood, bone marrow, energy — Mars-ruled. Prone to fevers and inflammation.'};
  const dietMap={1:'Reduce spicy/oily food. Increase iron-rich foods: beetroot, pomegranate.',2:'Stay hydrated. Reduce excess dairy. Eat warm, light foods.',3:'Reduce sweets. Increase bitter greens. Support liver with turmeric.',4:'Calcium-rich diet: sesame, ragi, milk. Add magnesium foods.',5:'Tulsi tea, ginger, turmeric for lungs. Eat light, easily digestible meals.',6:'Cucumber, watermelon for kidneys. Reduce salt and processed food.',7:'Turmeric milk, blueberries, omega-3. Avoid raw/cold foods.',8:'Bone broth, collagen, sesame oil massage. Reduce processed carbs.',9:'Beetroot, pomegranate, dark leafy greens. Stay well hydrated.'};
  const html=statRow([{n:lp,l:'Life Path'}])+
    `<p style="margin-bottom:12px;font-size:.83rem;">${healthMap[lp]}</p>`+divider()+
    infoGrid([{k:'Planet',v:info.planet},{k:'Element',v:info.element},{k:'Healing Crystal',v:(CRYSTALS[lp]?.[0]?.split('—')[0]||'Clear Quartz')},{k:'Healing Day',v:info.day}])+divider()+
    remedyCard('Diet',dietMap[lp])+
    remedyCard('Wellness Mantra','Chant "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam" 108 times on Mondays')+
    remedyCard('For '+concern,'Consult an Ayurvedic practitioner for personalized herbal support aligned with your dosha and Life Path');
  showRes('hlt-result',html);
}

function calcEnergyBalance(){
  const name=document.getElementById('eb-name').value.trim();
  const dob=document.getElementById('eb-dob').value;
  const prob=document.getElementById('eb-prob').value;
  if(!dob){alert('Please enter date of birth.');return;}
  const lp=lifePathN(dob),info=nd(lp);
  const html=statRow([{n:lp,l:'Life Path'}])+
    `<p style="margin-bottom:14px;font-size:.83rem;">Problem: <strong>${prob}</strong></p>`+
    infoGrid([{k:'Lucky Number',v:String(lp)},{k:'Lucky Color',v:info.color},{k:'Gemstone',v:info.gem},{k:'Crystal',v:(CRYSTALS[lp]?.[0]?.split('—')[0]||'Clear Quartz').trim()},{k:'Rudraksha',v:info.rud},{k:'Lucky Day',v:info.day}])+divider()+
    remedyCard('Number Remedy',`Surround yourself with ${lp} — phone wallpaper, PIN, workspace display`)+
    remedyCard('Color Therapy',`Wear ${info.color} daily. Redecorate one room corner in these tones`)+
    remedyCard('Gem + Crystal',`${info.gem} on ${info.day} + ${(CRYSTALS[lp]?.[0]?.split('—')[0]||'Clear Quartz').trim()} on desk`)+
    remedyCard('Mantra',`"${info.mantra}" — 108 times daily for 40 consecutive days for deep transformation`)+
    remedyCard('Weekly Ritual',`Every ${info.day}: wake early, chant mantra, wear lucky color, light ${info.color} diya`);
  showRes('eb-result',html);
}


/* ═══════════════════════════════════════════════════════════
   8 MISSING MODULE HTML TEMPLATES + CALCULATION FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/* ── HTML TEMPLATES ─────────────────────────────────────── */

function emailAnalysisHTML() {
  return moduleCard('Email & Username Numerology',
    'Analyse the numerological vibration of your email address or social media username.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Email Address or Username</label><input type="text" id="em-email" placeholder="e.g. rahul.sharma@gmail.com"/></div>
      <div class="fgroup"><label>Date of Birth (optional)</label><input type="date" id="em-dob"/></div>
    </div>
    <button class="btn-dash" onclick="calcEmail()">Analyse</button>`, 'em-result');
}

function signatureHTML() {
  return moduleCard('Signature Analysis & Correction',
    'Analyse your signature style and get correction guidance for optimal energy flow.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Your Full Name</label><input type="text" id="sig-name" placeholder="Your full name"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="sig-dob"/></div>
    </div>
    <div class="fgroup" style="max-width:340px;"><label>Describe Your Signature Style</label>
      <select id="sig-style">
        <option>Full name, clear and legible</option>
        <option>First name only</option>
        <option>Initials only</option>
        <option>Stylised / illegible loops</option>
        <option>Underlined signature</option>
        <option>Signature with a dot at end</option>
        <option>Signature that goes upward</option>
        <option>Signature that goes downward</option>
        <option>Crossed signature</option>
      </select>
    </div>
    <button class="btn-dash" onclick="calcSignature()">Analyse Signature</button>`, 'sig-result');
}

function luckyDatesHTML() {
  return moduleCard('Lucky Dates & Timing Selection',
    'Find auspicious dates for important events based on your personal numerology cycles.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="ld-dob"/></div>
      <div class="fgroup"><label>Purpose</label>
        <select id="ld-purpose">
          <option>Business Launch</option><option>Marriage / Engagement</option>
          <option>Property Purchase</option><option>Job Interview / Career Move</option>
          <option>Travel</option><option>Investment</option>
          <option>Medical Surgery</option><option>Starting Studies</option>
        </select>
      </div>
    </div>
    <div class="fgroup" style="max-width:240px;"><label>Month & Year</label><input type="month" id="ld-month"/></div>
    <button class="btn-dash" onclick="calcLuckyDates()">Find Lucky Dates</button>`, 'ld-result');
}

function yantraHTML() {
  return moduleCard('Yantra Suggestions',
    'Discover the right sacred Yantra to energise and harmonise your personal space.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="yan-dob"/></div>
      <div class="fgroup"><label>Goal / Purpose</label>
        <select id="yan-goal">
          <option>Business Success</option><option>Financial Abundance</option>
          <option>Love & Marriage</option><option>Health & Longevity</option>
          <option>Protection from Evil</option><option>Education & Intelligence</option>
          <option>Overall Prosperity</option>
        </select>
      </div>
    </div>
    <button class="btn-dash" onclick="calcYantra()">Suggest Yantra</button>`, 'yan-result');
}

function dailyRemediesHTML() {
  return moduleCard('Daily, Monthly & Yearly Remedy Plan',
    'Get a structured remedy plan for today, this month, and your current personal year cycle.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="dr-dob"/></div>
      <div class="fgroup"><label>Focus Area</label>
        <select id="dr-focus">
          <option>Overall Life Balance</option><option>Career</option>
          <option>Finance</option><option>Relationships</option><option>Health</option>
        </select>
      </div>
    </div>
    <button class="btn-dash" onclick="calcDailyRemedies()">Generate Plan</button>`, 'dr-result');
}

function actionPlanHTML() {
  return moduleCard('Personalised 90-Day Action Plan',
    'A structured numerology roadmap divided into Foundation, Activation, and Momentum phases.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Full Name</label><input type="text" id="ap-name" placeholder="Your full name"/></div>
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="ap-dob"/></div>
    </div>
    <div class="fgroup" style="max-width:320px;"><label>Primary Goal for Next 90 Days</label>
      <select id="ap-goal">
        <option>Get a job / promotion</option><option>Grow my business</option>
        <option>Find love / marriage</option><option>Improve health</option>
        <option>Clear debts / financial freedom</option><option>Spiritual growth</option>
      </select>
    </div>
    <button class="btn-dash" onclick="calcActionPlan()">Generate Action Plan</button>`, 'ap-result');
}

function relationshipHTML() {
  return moduleCard('Relationship Harmony Remedies',
    'Improve compatibility and harmony in any relationship through numerological analysis.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Your Date of Birth</label><input type="date" id="rel-dob1"/></div>
      <div class="fgroup"><label>Partner\'s Date of Birth</label><input type="date" id="rel-dob2"/></div>
    </div>
    <div class="fgroup" style="max-width:280px;"><label>Relationship Type</label>
      <select id="rel-type">
        <option>Romantic Partner</option><option>Spouse</option>
        <option>Business Partner</option><option>Parent-Child</option><option>Siblings</option>
      </select>
    </div>
    <button class="btn-dash" onclick="calcRelationship()">Analyse Harmony</button>`, 'rel-result');
}

function financeHTML() {
  return moduleCard('Financial Growth Remedies',
    'Numerology-based remedies to attract financial abundance and remove money blocks.',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="fgroup"><label>Date of Birth</label><input type="date" id="fin-dob"/></div>
      <div class="fgroup"><label>Current Situation</label>
        <select id="fin-sit">
          <option>Seeking steady income</option><option>Business growth needed</option>
          <option>Debt clearance</option><option>Investment guidance</option>
          <option>Wealth multiplication</option><option>Financial stability</option>
        </select>
      </div>
    </div>
    <button class="btn-dash" onclick="calcFinance()">Get Remedies</button>`, 'fin-result');
}

/* ── DATA TABLES FOR NEW MODULES ─────────────────────────── */

const SIG_DATA = {
  'Full name, clear and legible':    { result:'Excellent',    icon:'✅', detail:'Full name signatures are the most powerful and complete. Highest recommended style.', advice:'Maintain this. Add a slight upward angle and clean ending for maximum authority.' },
  'First name only':                 { result:'Partial',      icon:'⚠️', detail:'Missing surname reduces overall energy and professional authority.', advice:'Include your full surname. Your complete name carries your full destiny vibration.' },
  'Initials only':                   { result:'Weak',         icon:'⚠️', detail:'Initials carry minimal vibration and are inauspicious in numerology.', advice:'Shift to at least your first name. Initials limit your professional growth energy.' },
  'Stylised / illegible loops':      { result:'Mixed',        icon:'⚠️', detail:'Creative but unclear signatures confuse energy flow and intentions.', advice:'Gradually evolve toward readability while keeping your personal creative style.' },
  'Underlined signature':            { result:'Good',         icon:'✅', detail:'Underline represents self-confidence and goal orientation.', advice:'Good practice. Ensure the underline is a single clean stroke, not a zigzag.' },
  'Signature with a dot at end':     { result:'Positive',     icon:'✅', detail:'Dot signifies completion and finality — excellent subconscious signal.', advice:'Excellent habit. Make the dot clear, intentional, and decisive.' },
  'Signature that goes upward':      { result:'Optimistic',   icon:'✅', detail:'Upward slope indicates ambition, positive outlook, and aspiration.', advice:'Continue this. Ideal angle is 15–30 degrees upward — not too steep.' },
  'Signature that goes downward':    { result:'Inauspicious', icon:'❌', detail:'Downward signatures indicate subconscious pessimism and can hinder success.', advice:'Consciously practice writing on a slightly upward slope every day for 21 days.' },
  'Crossed signature':               { result:'Avoid',        icon:'❌', detail:'Crossing your own signature creates self-sabotage energy. Highly inauspicious.', advice:'Remove the cross immediately. Never cross through your own name in a signature.' }
};

const YANTRAS = {
  'Business Success':       { name:'Shree Yantra',             place:'North wall of office',        material:'Copper or Silver',       day:'Friday' },
  'Financial Abundance':    { name:'Kubera Yantra',            place:'North direction — near locker',material:'Gold plated copper',    day:'Thursday' },
  'Love & Marriage':        { name:'Kamdev Yantra',            place:'Bedroom — South-West corner', material:'Copper',                 day:'Friday' },
  'Health & Longevity':     { name:'Mahamrityunjay Yantra',    place:'North-East corner of home',   material:'Copper',                 day:'Monday' },
  'Protection from Evil':   { name:'Baglamukhi Yantra',        place:'Main entrance facing outward',material:'Copper or Bhojpatra',    day:'Sunday' },
  'Education & Intelligence':{ name:'Saraswati Yantra',        place:'Study room — East wall',      material:'Copper',                 day:'Wednesday' },
  'Overall Prosperity':     { name:'Shree Yantra + Vastu Yantra',place:'East — living room altar',  material:'Crystal or Gold Copper', day:'Friday' }
};

const WALLET_COLORS  = ['Brown','Black','Wine Red','Dark Green','Royal Blue','Cream','Purple','Dark Navy','Red'];
const LOCKER_DIRS    = ['North','North-East','North','South-West','North','South-West','North-East','North','East'];
const OFFER_ITEMS    = ['wheat','rice','yellow lentils','sesame seeds','green mung','white flowers','black sesame','black sesame seeds','red flowers'];
const PURPOSE_MANTRAS = {
  'Protection & Safety':  'Om Namah Shivaya',
  'Wealth & Prosperity':  'Om Shreem Hreem Shreem Mahalakshmiyei Namaha',
  'Love & Relationships': 'Om Kleem Krishnaya Namaha',
  'Health Healing':       'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam',
  'Career Success':       'Om Gam Ganapataye Namaha',
  'Spiritual Awakening':  'So Hum — synchronise with breath',
  'Peace of Mind':        'Om Shanti Shanti Shanti'
};

/* ── CALCULATION FUNCTIONS ──────────────────────────────── */

/* 1 — Email & Username */
function calcEmail() {
  const email = document.getElementById('em-email').value.trim();
  const dob   = document.getElementById('em-dob').value;
  if (!email) { alert('Please enter an email address or username.'); return; }
  const username = email.split('@')[0].replace(/[^a-z]/gi, '');
  const val  = nPyth(username);
  const info = nd(val);
  const lp   = dob ? lifePathN(dob) : null;
  const compat = lp ? (lp === val ? '✅ Aligned with Life Path ' + lp : '⚠ Slight mismatch with Life Path ' + lp) : '';
  const html = statRow([{n:val, l:'Email Vibration'}]) +
    `<p style="margin-bottom:8px;font-size:.83rem;"><strong>${email}</strong> carries <strong>${info.name}</strong> energy — ${info.traits}</p>` +
    (compat ? `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;margin-bottom:12px;">${compat}</span>` : '') +
    divider() +
    infoGrid([{k:'Supports',v:info.strength},{k:'Ruling Planet',v:info.planet},{k:'Lucky Day',v:info.day}]) +
    divider() +
    remedyCard('Optimisation', lp && lp !== val
      ? `Consider a slight username change so it reduces to Life Path ${lp} (${nd(lp).name}) for perfect alignment`
      : 'Your email username is numerologically aligned with your profile') +
    remedyCard('Profile Picture', `Use a <strong>${info.color}</strong> background in your profile photo to strengthen digital presence energy`) +
    remedyCard('Best For', `This email vibration supports: ${info.strength}. Use it for ${info.day} correspondence for maximum impact`);
  showRes('em-result', html);
}

/* 2 — Signature Analysis */
function calcSignature() {
  const name  = document.getElementById('sig-name').value.trim();
  const dob   = document.getElementById('sig-dob').value;
  const style = document.getElementById('sig-style').value;
  if (!name) { alert('Please enter your full name.'); return; }
  const lp    = dob ? lifePathN(dob) : 1;
  const info  = nd(lp);
  const sd    = SIG_DATA[style] || SIG_DATA['Full name, clear and legible'];
  const html =
    `<div style="padding:12px 14px;background:#f9f8f5;border-radius:8px;margin-bottom:14px;">
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:4px;">${sd.icon} ${sd.result}</div>
      <div style="font-size:.83rem;color:#374151;">${sd.detail}</div>
    </div>` +
    divider() +
    remedyCard('Correction Advice', sd.advice) +
    remedyCard('Stroke Direction', `Life Path ${lp} benefits from ${lp <= 4 ? 'firm, grounded, horizontal strokes' : 'flowing, upward, expansive strokes'} — match your natural energy`) +
    remedyCard('Ink Colour', `Use <strong>${lp <= 3 ? 'Blue or Royal Blue' : 'Dark Blue or Indigo'}</strong> ink for all official signatures`) +
    remedyCard('21-Day Practice Ritual', `Write your corrected signature exactly 21 times daily for 21 consecutive days. This reprograms subconscious energy patterns around your identity`) +
    remedyCard('Name Coverage', `For official documents, your full name <strong>${name}</strong> should be clearly identifiable in the signature. Avoid shrinking to initials on legal papers`) +
    remedyCard('Upward Trend', 'All signatures should have a slight upward trajectory (10–25 degrees) — this symbolises growth, ambition, and forward movement in life');
  showRes('sig-result', html);
}

/* 3 — Lucky Dates */
function calcLuckyDates() {
  const dob     = document.getElementById('ld-dob').value;
  const purpose = document.getElementById('ld-purpose').value;
  const monthVal= document.getElementById('ld-month').value;
  if (!dob) { alert('Please enter your date of birth.'); return; }
  const lp    = lifePathN(dob);
  const bn    = birthN(dob);
  const info  = nd(lp);
  const today = new Date();
  const yr    = monthVal ? parseInt(monthVal.split('-')[0]) : today.getFullYear();
  const mo    = monthVal ? parseInt(monthVal.split('-')[1]) : (today.getMonth() + 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

  // Calculate lucky dates
  const lucky = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dn = rsingle(d);
    if (dn === lp || dn === bn) lucky.push(d);
    if (lucky.length >= 8) break;
  }
  // Fill up to 6 if needed
  if (lucky.length < 4) {
    for (let d = 1; d <= daysInMonth && lucky.length < 6; d++) {
      if (!lucky.includes(d) && [1, 3, 6, 9].includes(rsingle(d))) lucky.push(d);
    }
  }
  lucky.sort((a, b) => a - b);

  const datesHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;">
    ${lucky.map(d => `<div style="background:#fff;border:1px solid #e5e1d8;border-top:3px solid var(--green);border-radius:8px;padding:10px 14px;text-align:center;min-width:58px;"><div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:var(--green);line-height:1;">${d}</div><div style="font-size:.65rem;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">No. ${rsingle(d)}</div></div>`).join('')}
  </div>`;

  const html =
    `<div style="font-size:.78rem;color:#6b7280;margin-bottom:10px;">Lucky dates for <strong>${purpose}</strong> — ${months[mo]} ${yr} (Life Path ${lp}, Birth Number ${bn})</div>` +
    datesHTML + divider() +
    infoGrid([{k:'Best Day of Week',v:info.day},{k:'Lucky Colour to Wear',v:info.color},{k:'Best Time',v:lp<=5?'Morning 6–8 AM or 10 AM–12 PM':'Evening 6–8 PM'}]) +
    divider() +
    remedyCard('Pre-Event Ritual', `On your chosen lucky date, chant "<em>${info.mantra}</em>" 11 times, wear <strong>${info.color}</strong>, and begin at your best time window`) +
    remedyCard('Avoid', `Dates reducing to ${[4,8].includes(lp)?'8 or 4':lp===2?'9':'conflicting numbers'} and Amavasya (no moon day) for important new beginnings`) +
    remedyCard(`Best for ${purpose}`, `Combining a lucky date with ${info.day} gives the maximum auspicious energy for this type of event`);
  showRes('ld-result', html);
}

/* 4 — Yantra */
function calcYantra() {
  const dob  = document.getElementById('yan-dob').value;
  const goal = document.getElementById('yan-goal').value;
  if (!dob) { alert('Please enter your date of birth.'); return; }
  const lp   = lifePathN(dob);
  const info = nd(lp);
  const y    = YANTRAS[goal] || YANTRAS['Business Success'];
  const html = statRow([{n:lp, l:'Life Path'}]) +
    `<div style="margin-bottom:14px;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:var(--blue);margin-bottom:6px;">${y.name}</div>
      <div style="font-size:.81rem;color:#6b7280;">Recommended for: <strong>${goal}</strong></div>
    </div>` +
    infoGrid([{k:'Placement',v:y.place},{k:'Material',v:y.material},{k:'Energise On',v:y.day},{k:'Direction to Face',v:'East while praying'}]) +
    divider() +
    remedyCard('Energising Ritual', `On a ${y.day}, light incense and a ${info.color} candle. Place the Yantra and chant "<em>${info.mantra}</em>" 108 times while focusing on your intention`) +
    remedyCard('Activation Process', 'Pour a few drops of Ganga jal or raw milk over the Yantra on the first day of installation. Then wipe clean with a soft cloth') +
    remedyCard('Weekly Maintenance', `Wipe the Yantra with a clean white cloth every ${y.day}. Never allow it to collect dust or be touched by others`) +
    remedyCard('Important', 'Purchase energised (pran-pratishtha) Yantras from trusted sources, or have them energised by a qualified Vedic priest for best results');
  showRes('yan-result', html);
}

/* 5 — Daily/Monthly/Yearly Remedies */
function calcDailyRemedies() {
  const dob   = document.getElementById('dr-dob').value;
  const focus = document.getElementById('dr-focus').value;
  if (!dob) { alert('Please enter your date of birth.'); return; }
  const lp    = lifePathN(dob);
  const info  = nd(lp);
  const today = new Date();
  const yr    = today.getFullYear();
  const mo    = today.getMonth() + 1;

  // Personal cycles
  const pySum = rsingle(dob.split('-')[2].replace(/^0/,'')) + rsingle(dob.split('-')[1].replace(/^0/,'')) + rsingle(yr);
  const personalYear  = rsingle(pySum);
  const personalMonth = rsingle(personalYear + mo);
  const personalDay   = rsingle(personalMonth + today.getDate());

  const pyInfo = nd(personalYear);
  const pmInfo = nd(personalMonth);

  const html =
    statRow([
      {n:personalDay,   l:'Personal Day',   c:'var(--blue)'},
      {n:personalMonth, l:'Personal Month',  c:'var(--gold-d,#c8a846)'},
      {n:personalYear,  l:'Personal Year',   c:'var(--purple,#6d28d9)'}
    ]) +
    divider() +
    `<div style="font-size:.78rem;color:#6b7280;margin-bottom:12px;">Focus: <strong>${focus}</strong> — Life Path ${lp} (${info.name})</div>` +
    remedyCard('Morning (6–7 AM)', `Wake before sunrise. Chant "<em>${info.mantra}</em>" 11 times facing East. Drink copper vessel water. Set your intention for the day`) +
    remedyCard('Wear Today', `<strong>${info.color}</strong> clothing energises your ${info.planet} vibration.${personalDay === lp ? ' <span style="color:var(--green)">Today is especially powerful — take bold action!</span>' : ''}`) +
    remedyCard('Daily Affirmation', `"I am aligned with the energy of ${lp}. ${info.strength} flows through me effortlessly." — Repeat 9 times each morning`) +
    remedyCard('Evening Practice', `Light a ${info.color} candle for 15 minutes. Write 3 gratitudes. Chant your mantra 3 times before sleeping`) +
    divider() +
    remedyCard('This Month — Personal Month ' + personalMonth,
      `${pmInfo.name} energy — ${pmInfo.strength}. ${personalMonth === lp ? '✨ Peak energy month — make your biggest moves now.' : 'Steady focus and consolidation will yield the best results.'}`) +
    remedyCard('This Year — Personal Year ' + personalYear,
      `${pyInfo.name} cycle — ${pyInfo.traits}. ${personalYear === 1 ? 'New beginnings year — plant seeds, start fresh projects.' : personalYear === 9 ? 'Completion cycle — release old patterns, prepare for new phase.' : personalYear === 5 ? 'Freedom & change year — embrace transformation and new opportunities.' : 'Build steadily with focused intention and disciplined action.'}`) +
    remedyCard('Monthly Review Ritual',
      `On the ${lp}th of each month, light a ${info.color} candle, write your goals 9 times, review your progress, and reset your intentions for the month ahead`);
  showRes('dr-result', html);
}

/* 6 — 90-Day Action Plan */
function calcActionPlan() {
  const dob  = document.getElementById('ap-dob').value;
  const goal = document.getElementById('ap-goal').value;
  const name = document.getElementById('ap-name').value.trim();
  if (!dob) { alert('Please enter your date of birth.'); return; }
  const lp   = lifePathN(dob);
  const info = nd(lp);
  const html =
    statRow([{n:lp, l:'Life Path'}]) +
    `<div style="margin-bottom:14px;font-size:.83rem;">Goal: <strong>${goal}</strong>${name ? ' — '+name : ''}</div>` +
    divider() +
    `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-top:3px solid var(--blue);border-radius:8px;padding:12px;text-align:center;"><div style="font-weight:700;color:var(--blue);font-size:.85rem;">Days 1–30</div><div style="font-size:.75rem;color:#6b7280;margin-top:4px;">Foundation</div></div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-top:3px solid #d97706;border-radius:8px;padding:12px;text-align:center;"><div style="font-weight:700;color:#92400e;font-size:.85rem;">Days 31–60</div><div style="font-size:.75rem;color:#6b7280;margin-top:4px;">Activation</div></div>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-top:3px solid var(--green);border-radius:8px;padding:12px;text-align:center;"><div style="font-weight:700;color:var(--green);font-size:.85rem;">Days 61–90</div><div style="font-size:.75rem;color:#6b7280;margin-top:4px;">Momentum</div></div>
    </div>` +
    remedyCard('🔵 Days 1–30: Foundation',
      `Get <strong>${info.gem}</strong> gemstone energised and wear on <strong>${info.day}</strong>. Begin daily chanting of "<em>${info.mantra}</em>" 108×. Start wearing <strong>${info.color}</strong>. Correct your signature and update email username if needed.`) +
    remedyCard('🟡 Days 31–60: Activation',
      `Place a Kubera Yantra in the North direction. Network and take bold action on lucky dates (dates reducing to ${lp}). Update social media profiles with numerology-aligned usernames. Begin engaging with your target community.`) +
    remedyCard('🟢 Days 61–90: Momentum',
      `Begin a full 40-day mantra Mandala for your specific goal. Review all corrections — name, number, colors, signature. Set your next 90-day targets. Celebrate wins and release what isn't working.`) +
    divider() +
    remedyCard('Daily Non-Negotiables',
      `Morning mantra + ${info.color} clothing on important days + gratitude journal at night + avoid unlucky numbers in key decisions`) +
    remedyCard('Monthly Milestone Review',
      `On the ${lp}th of each month, light a ${info.color} candle, write your goal affirmation 9 times, review all progress, and set next month's top 3 actions`) +
    remedyCard('Success Indicators',
      `Track: energy levels, synchronicities appearing, financial flows, relationship quality, inner peace. These are your numerological alignment signals — they show the remedies are working`);
  showRes('ap-result', html);
}

/* 7 — Relationship Harmony */
function calcRelationship() {
  const dob1 = document.getElementById('rel-dob1').value;
  const dob2 = document.getElementById('rel-dob2').value;
  const type = document.getElementById('rel-type').value;
  if (!dob1 || !dob2) { alert('Please enter both dates of birth.'); return; }
  const lp1 = lifePathN(dob1), lp2 = lifePathN(dob2);
  const info1 = nd(lp1), info2 = nd(lp2);

  // Compatibility calculation
  const HARMONIOUS = new Set(['1-3','3-1','1-5','5-1','1-9','9-1','2-4','4-2','2-6','6-2','3-6','6-3','3-9','9-3','4-8','8-4','5-7','7-5','6-9','9-6']);
  const CHALLENGING = new Set(['1-4','4-1','1-8','8-1','2-7','7-2','4-5','5-4','4-9','9-4']);
  const key = lp1 + '-' + lp2;
  let score = lp1 === lp2 ? 88 : HARMONIOUS.has(key) ? 78 + Math.floor(Math.random()*12) : CHALLENGING.has(key) ? 46 + Math.floor(Math.random()*12) : 62 + Math.floor(Math.random()*14);
  score = Math.min(96, Math.max(40, score));
  const level = score >= 85 ? '💚 Highly Compatible' : score >= 70 ? '💛 Good Match' : score >= 55 ? '🧡 Needs Conscious Work' : '❤️ Requires Strong Effort';

  const html =
    `<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:14px;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:.75rem;color:#6b7280;margin-bottom:4px;">Your Path</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--blue);">${lp1}</div>
        <div style="font-size:.75rem;color:#374151;">${info1.name}</div>
      </div>
      <div style="font-size:1.5rem;text-align:center;color:#e5e1d8;">♡</div>
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:.75rem;color:#6b7280;margin-bottom:4px;">Their Path</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--purple,#6d28d9);">${lp2}</div>
        <div style="font-size:.75rem;color:#374151;">${info2.name}</div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:6px;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:700;color:${score>=70?'var(--green)':score>=55?'#d97706':'var(--err,#991b1b)'};">${score}%</div>
      <div style="font-size:.9rem;font-weight:600;">${level}</div>
    </div>
    <div style="background:#f3f4f6;border-radius:8px;height:8px;overflow:hidden;margin-bottom:14px;">
      <div style="background:${score>=70?'var(--green)':score>=55?'#f59e0b':'var(--err,#991b1b)'};width:${score}%;height:100%;border-radius:8px;transition:width .6s;"></div>
    </div>` +
    infoGrid([
      {k:'Your Energy',    v:info1.name+' — '+info1.traits.split(',')[0]},
      {k:'Their Energy',   v:info2.name+' — '+info2.traits.split(',')[0]},
      {k:'Relationship',   v:type},
      {k:'Bond Strength',  v:score>=80?'Naturally harmonious':score>=65?'Good with understanding':'Requires conscious cultivation'}
    ]) + divider() +
    remedyCard('Harmony Remedy',
      `Both individuals wear respective lucky colors on important days together. Create shared rituals on the ${lp1}th and ${lp2}th of each month`) +
    remedyCard('Bonding Mantra',
      `Chant "Om Kleem Krishnaya Namaha" together for 21 consecutive days to strengthen the energetic bond between you`) +
    remedyCard('Crystal Remedy',
      `Place a Rose Quartz crystal in the South-West corner of your shared space. Both carry Amethyst during conflict resolution`) +
    remedyCard(score < 65 ? 'Correction Guidance' : 'Strengthen Further',
      score < 65
        ? `Life Paths ${lp1} and ${lp2} have contrasting energies. Regular open communication, individual Rudraksha for each person, and shared mantra practice will bridge this gap over time`
        : `Your paths are naturally aligned. Honour each other's individual strengths — ${info1.name} and ${info2.name} energies complement each other powerfully`);
  showRes('rel-result', html);
}

/* 8 — Financial Remedies */
function calcFinance() {
  const dob = document.getElementById('fin-dob').value;
  const sit = document.getElementById('fin-sit').value;
  if (!dob) { alert('Please enter your date of birth.'); return; }
  const lp   = lifePathN(dob);
  const bn   = birthN(dob);
  const info = nd(lp);
  const walletColor  = WALLET_COLORS[lp - 1] || 'Brown';
  const lockerDir    = LOCKER_DIRS[lp - 1]   || 'North';
  const offerItem    = OFFER_ITEMS[lp - 1]   || 'rice';

  const html = statRow([{n:lp,l:'Life Path'},{n:bn,l:'Birth Number',c:'var(--gold-d,#c8a846)'}]) +
    `<div style="margin-bottom:12px;font-size:.83rem;">Situation: <strong>${sit}</strong></div>` +
    infoGrid([{k:'Core Strength',v:info.strength},{k:'Lucky Day for Finance',v:info.day},{k:'Planet',v:info.planet}]) +
    divider() +
    remedyCard('Money Mantra',
      `Chant <em>"Om Shreem Hreem Shreem Mahalakshmiyei Namaha"</em> <strong>${lp * 11} times</strong> every <strong>${info.day}</strong> morning before starting any financial activity`) +
    remedyCard('Wallet Remedy',
      `Use a <strong>${walletColor}</strong> coloured wallet. Keep a small piece of <strong>${info.gem}</strong> chip stone inside the wallet for continuous wealth energy`) +
    remedyCard('Locker / Safe Direction',
      `Place your financial locker, safe, or cash storage in the <strong>${lockerDir}</strong> direction of your home or office for maximum abundance energy`) +
    remedyCard('Weekly Offering',
      `Every <strong>${info.day}</strong>, offer <strong>${offerItem}</strong> to the needy, birds, or animals. This activates the giving-receiving cycle in your life`) +
    remedyCard('Lucky Investment Dates',
      `Initiate investments, bank transactions, or sign financial documents on dates reducing to <strong>${lp}</strong> or <strong>${bn}</strong>. Avoid dates reducing to ${[4,8].includes(lp)?'8':'4'}.`) +
    remedyCard('Kubera Yantra',
      `Place a Kubera Yantra in the <strong>North direction</strong> of your home or office. Energise it on Thursday morning with "<em>${info.mantra}</em>" 108 times`) +
    remedyCard('Money Affirmation',
      `Every morning write: <em>"I am a magnet for wealth. Money flows to me easily and freely."</em> Write this 9 times in a green-ink pen for 27 consecutive days`);
  showRes('fin-result', html);
}

/* ═══════════════════════════════════════════════════════════
   MODULE VISIBILITY — reads admin module_states config
   Hides/shows sidebar items and tab panes based on admin toggle
   ═══════════════════════════════════════════════════════════ */

function applyModuleVisibility() {
  const states = MockConfig.get('module_states');
  if (!states) return; // all on by default — nothing to do

  // sidebar items — each .ds-item has data-tab matching module id
  document.querySelectorAll('.ds-item[data-tab]').forEach(btn => {
    const tab = btn.dataset.tab;
    if (tab === 'profile' || tab === 'loshu') return; // always visible
    if (states[tab] === false) {
      btn.style.display = 'none'; // hide sidebar entry
    } else {
      btn.style.display = ''; // show
    }
  });

  // If current active tab is now disabled, redirect to profile
  const activeTab = document.querySelector('.dash-tab.active');
  if (activeTab) {
    const tabId = activeTab.id.replace('tab-', '');
    if (tabId !== 'profile' && tabId !== 'loshu' && states[tabId] === false) {
      goTab('profile');
    }
  }
}

// applyModuleVisibility is called from injectModuleTabs (wired below)
// goTab guards disabled modules inline — handled in goTab body
