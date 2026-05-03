/* Numerology Pro — admin.js | Full admin dashboard logic */
let allUsers=[], allFeatures=[], selDays=7;

document.addEventListener('DOMContentLoaded', ()=>{
  auth.onAuthStateChanged(async firebaseUser => {
    if (!firebaseUser) { window.location.href = 'login.html'; return; }
    const user = await MockAuth.refreshUser();
    if (!user || !MockAuth.isAdmin(user)) { window.location.href = 'login.html'; return; }
    // Hide loader — admin is verified
    const _l=document.getElementById('app-loader');
    if(_l){_l.classList.add('hide');setTimeout(()=>_l.remove(),350);}
    initAdminPanel(user);
  });
});

function initAdminPanel(user) {
  document.getElementById('asb-avatar').textContent=(user.displayName||'A')[0].toUpperCase();
  document.getElementById('asb-name').textContent=user.displayName||'Admin';
  document.getElementById('asb-email').textContent=user.email;
  setInterval(()=>{document.getElementById('adm-clock').textContent=new Date().toLocaleTimeString('en-IN');},1000);
  document.querySelectorAll('.asb-btn').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.tab)));
  document.querySelectorAll('.dur').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.dur').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); selDays=b.dataset.d;
    document.getElementById('custom-day-row').style.display=selDays==='custom'?'block':'none';
  }));
  loadOverview(); loadUsers(); loadGrantLog(); loadPricingConfig(); loadPlanFeatures(); loadPaymentConfig(); loadAppConfig(); loadPayments(); loadSubscriptions(); loadPolicy();
}

function goTab(tab){
  document.querySelectorAll('.tab-pane').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.asb-btn').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('tab-'+tab); if(el)el.classList.add('active');
  const btn=document.querySelector(`.asb-btn[data-tab="${tab}"]`); if(btn)btn.classList.add('active');
  if(tab==='modules') setTimeout(renderModuleManager, 0);
  const titles={overview:'Overview',users:'All Users',grant:'Grant Access',subscriptions:'Subscriptions',pricing:'Pricing & Plans',payment:'Payment Config',settings:'App Settings',policy:'Policy Editor'};
  const subs={overview:'Numerology Pro Admin Dashboard',users:'Manage user accounts and access',grant:'Grant manual subscription access',subscriptions:'Track all subscriptions and payments',pricing:'Update pricing and plan features',payment:'Razorpay payment gateway setup',settings:'Application configuration',policy:'Edit terms, privacy and refund policies'};
  document.getElementById('pg-title').textContent=titles[tab]||tab;
  document.getElementById('pg-sub').textContent=subs[tab]||'';
}

function toggleSidebar(){
  document.getElementById('asb').classList.toggle('open');
  document.getElementById('asb-overlay').classList.toggle('show');
}
function closeSidebar(){
  document.getElementById('asb').classList.remove('open');
  document.getElementById('asb-overlay').classList.remove('show');
}

function statusBadge(u){
  const now=new Date();
  const exp=u.subscriptionExpiry?new Date(u.subscriptionExpiry):null;
  if(u.blocked)return'<span class="badge b-blocked">Blocked</span>';
  if(!u.subscriptionActive)return'<span class="badge b-pending">Pending</span>';
  if(exp&&exp<now)return'<span class="badge b-expired">Expired</span>';
  if(u.accessGrantedManually)return'<span class="badge b-granted">Granted</span>';
  return'<span class="badge b-active">Active</span>';
}

function daysLeft(expStr){
  if(!expStr)return'—';
  const diff=Math.ceil((new Date(expStr)-Date.now())/(864e5));
  if(diff<0)return`<span style="color:#991b1b">${Math.abs(diff)}d ago</span>`;
  if(diff<=7)return`<span style="color:#92400e">${diff}d left</span>`;
  return`<span style="color:#065f46">${diff}d left</span>`;
}

function fmtDate(str){if(!str)return'—';return new Date(str).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}

function showMsg(id,msg,type='s'){const el=document.getElementById(id);el.textContent=msg;el.className='adm-msg '+type;setTimeout(()=>{el.className='adm-msg';el.textContent='';},5000);}

function toast(msg){const t=document.getElementById('mini-toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}

/* OVERVIEW */
async function loadOverview(){
  const users=await MockUsers.getAll(); const now=new Date();
  const active=users.filter(u=>u.subscriptionActive&&!u.blocked&&(!u.subscriptionExpiry||new Date(u.subscriptionExpiry)>now));
  const pending=users.filter(u=>!u.subscriptionActive&&!u.blocked);
  const blocked=users.filter(u=>u.blocked);
  const expiring=users.filter(u=>{if(!u.subscriptionExpiry||!u.subscriptionActive)return false;const d=(new Date(u.subscriptionExpiry)-now)/864e5;return d>=0&&d<=7;});
  document.getElementById('s-total').textContent=users.length;
  document.getElementById('s-active').textContent=active.length;
  document.getElementById('s-pending').textContent=pending.length;
  document.getElementById('s-blocked').textContent=blocked.length;
  document.getElementById('s-expiring').textContent=expiring.length;
  const payments=MockUsers.getPayments();
  const rev=payments.reduce((s,p)=>s+(p.amount||0),0);
  document.getElementById('s-revenue').textContent='₹'+rev.toLocaleString('en-IN');
  const recent=[...users].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  document.getElementById('tb-recent').innerHTML=recent.length?recent.map(u=>`<tr><td><strong>${u.displayName||'—'}</strong></td><td>${u.email}</td><td>${fmtDate(u.createdAt)}</td><td>${statusBadge(u)}</td></tr>`).join(''):'<tr><td colspan="4" class="tbl-mt">No users yet</td></tr>';
  document.getElementById('tb-expiring').innerHTML=expiring.length?expiring.map(u=>`<tr><td>${u.displayName||'—'}</td><td>${u.email}</td><td>${fmtDate(u.subscriptionExpiry)}</td><td><button class="act-btn ab-gold" onclick="openExtModal('${u.uid}')">Extend</button></td></tr>`).join(''):'<tr><td colspan="4" class="tbl-mt">No subscriptions expiring soon</td></tr>';
}

/* USERS */
async function loadUsers(){
  allUsers=await MockUsers.getAll();
  renderUsers(allUsers);
  document.getElementById('u-count').textContent=`Showing ${allUsers.length} users`;
}
function filterUsers(){
  const q=document.getElementById('u-srch').value.toLowerCase();
  const f=document.getElementById('u-flt').value;
  const now=new Date();
  const filtered=allUsers.filter(u=>{
    const mq=!q||(u.displayName||'').toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||(u.mobile||'').includes(q);
    const exp=u.subscriptionExpiry?new Date(u.subscriptionExpiry):null;
    const statusMap={active:u.subscriptionActive&&!u.blocked&&(!exp||exp>now),pending:!u.subscriptionActive&&!u.blocked,expired:u.subscriptionActive&&exp&&exp<now,blocked:u.blocked,granted:u.accessGrantedManually};
    return mq&&(f==='all'||statusMap[f]);
  });
  renderUsers(filtered);
  document.getElementById('u-count').textContent=`Showing ${filtered.length} of ${allUsers.length} users`;
}
function renderUsers(users){
  document.getElementById('tb-users').innerHTML=users.length?users.map(u=>`
    <tr>
      <td><strong>${u.displayName||'—'}</strong></td>
      <td>${u.email}</td>
      <td>${u.mobile||'—'}</td>
      <td>${fmtDate(u.createdAt)}</td>
      <td>${statusBadge(u)}</td>
      <td>${fmtDate(u.subscriptionExpiry)}</td>
      <td><span style="font-size:.75rem;color:#6b7280;">${u.subscriptionPlan||'—'}</span></td>
      <td><div class="act-btns">
        ${!u.subscriptionActive&&!u.blocked?`<button class="act-btn ab-green" onclick="quickActivate('${u.uid}')">Activate</button>`:''}
        ${u.subscriptionActive&&!u.blocked?`<button class="act-btn ab-gold" onclick="openExtModal('${u.uid}')">Extend</button>`:''}
        ${!u.blocked?`<button class="act-btn ab-red" onclick="blockUser('${u.uid}',true)">Block</button>`:`<button class="act-btn ab-gray" onclick="blockUser('${u.uid}',false)">Unblock</button>`}
        <button class="act-btn ab-blue" onclick="viewUser('${u.uid}')">Details</button>
      </div></td>
    </tr>`).join(''):'<tr><td colspan="8" class="tbl-mt">No users found</td></tr>';
}
function quickActivate(uid){if(!confirm('Activate this user for 1 year?'))return;await MockUsers.activate(uid,365);loadUsers();loadOverview();toast('User activated for 1 year');}
async function blockUser(uid,block){if(!confirm(`${block?'Block':'Unblock'} this user?`))return;await MockUsers.block(uid,block);loadUsers();loadOverview();toast(`User ${block?'blocked':'unblocked'}`);}
function openExtModal(uid){document.getElementById('ext-uid').value=uid;document.getElementById('ext-days').value='';document.getElementById('ext-msg').className='adm-msg';document.getElementById('ext-modal').classList.add('open');}
function closeExtModal(){document.getElementById('ext-modal').classList.remove('open');}
async function doExtend(){
  const uid=document.getElementById('ext-uid').value;
  const days=parseInt(document.getElementById('ext-days').value);
  if(!days||days<1){showMsg('ext-msg','Please enter valid number of days','e');return;}
  await MockUsers.extend(uid,days);closeExtModal();loadUsers();loadSubscriptions();loadOverview();toast(`Extended by ${days} days`);
}
async function viewUser(uid){
  const user=MockUsers.getAll().find(u=>u.uid===uid);if(!user)return;
  const exp=user.subscriptionExpiry?fmtDate(user.subscriptionExpiry):'—';
  document.getElementById('modal-title').textContent=user.displayName||user.email;
  document.getElementById('modal-body').innerHTML=`
    <div style="display:grid;gap:8px;font-size:.83rem;margin-bottom:16px;">
      ${[['UID',user.uid],['Email',user.email],['Mobile',user.mobile||'—'],['Name',user.displayName||'—'],['Joined',fmtDate(user.createdAt)],['Date of Birth',user.dob||'—'],['Plan',user.subscriptionPlan||'—'],['Expiry',exp],['Blocked',user.blocked?'Yes':'No'],['Signup Method',user.signupMethod||'email']].map(([k,v])=>`
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#f5f4f0;border-radius:6px;">
        <span style="color:#6b7280;font-weight:500;">${k}</span><strong style="max-width:60%;word-break:break-all;text-align:right;">${v}</strong>
      </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${!user.subscriptionActive?`<button class="act-btn ab-green" onclick="quickActivate('${uid}');closeModal();">Activate 1yr</button>`:''}
      <button class="act-btn ab-gold" onclick="openExtModal('${uid}');closeModal();">Extend</button>
      ${!user.blocked?`<button class="act-btn ab-red" onclick="blockUser('${uid}',true);closeModal();">Block User</button>`:`<button class="act-btn ab-gray" onclick="blockUser('${uid}',false);closeModal();">Unblock</button>`}
    </div>`;
  document.getElementById('user-modal').classList.add('open');
}
function closeModal(){document.getElementById('user-modal').classList.remove('open');}

/* GRANT ACCESS */
async function doGrantAccess(){
  const email=document.getElementById('ga-email').value.trim();
  const days=selDays==='custom'?parseInt(document.getElementById('ga-custom').value):parseInt(selDays);
  const note=document.getElementById('ga-note').value.trim();
  if(!email){showMsg('ga-msg','Please enter user email','e');return;}
  if(!days||days<1){showMsg('ga-msg','Please select or enter valid duration','e');return;}
  const btn=document.getElementById('ga-btn');btn.disabled=true;document.getElementById('ga-txt').textContent='Granting...';
  setTimeout(()=>{
    const r=await MockUsers.grantByEmail(email,days,note);
    btn.disabled=false;document.getElementById('ga-txt').textContent='Grant Access →';
    if(!r.ok){showMsg('ga-msg',r.error,'e');return;}
    showMsg('ga-msg',`✅ Access granted to ${email} for ${days} days. Expires: ${fmtDate(r.expiry.toISOString())}`,'s');
    document.getElementById('ga-email').value='';document.getElementById('ga-note').value='';
    loadGrantLog();loadUsers();loadOverview();
  },600);
}
async function doBulkGrant(){
  const emails=document.getElementById('bulk-emails').value.split('\n').map(e=>e.trim()).filter(Boolean);
  const days=parseInt(document.getElementById('bulk-days').value);
  const note=document.getElementById('bulk-note').value.trim();
  if(!emails.length){showMsg('bulk-msg','Please enter at least one email','e');return;}
  if(!days||days<1){showMsg('bulk-msg','Please enter number of days','e');return;}
  let ok=0,failed=[];
  emails.forEach(email=>{const r=await MockUsers.grantByEmail(email,days,note);r.ok?ok++:failed.push(email);});
  showMsg('bulk-msg',`✅ Granted to ${ok} users.${failed.length?` Failed: ${failed.join(', ')}`:''}`,failed.length?'w':'s');
  loadGrantLog();loadUsers();loadOverview();
}
async function loadGrantLog(){
  const grants=await MockUsers.getGrants();
  document.getElementById('tb-grants').innerHTML=grants.length?grants.map(g=>`
    <tr><td>${g.email}</td><td>${g.days} days</td><td>${g.note||'—'}</td><td>${fmtDate(g.grantedAt)}</td><td>${fmtDate(g.expiresAt)}</td><td><span style="font-size:.75rem;color:#6b7280;">${g.grantedBy||'admin'}</span></td></tr>
  `).join(''):'<tr><td colspan="6" class="tbl-mt">No grants yet</td></tr>';
}

/* SUBSCRIPTIONS */
async function loadSubscriptions(){
  const users=await MockUsers.getAll();const now=new Date();
  const withSub=users.filter(u=>u.subscriptionPlan);
  const active=withSub.filter(u=>u.subscriptionActive&&!u.blocked&&(!u.subscriptionExpiry||new Date(u.subscriptionExpiry)>now));
  const expired=withSub.filter(u=>u.subscriptionExpiry&&new Date(u.subscriptionExpiry)<now);
  const rev=MockUsers.getPayments().reduce((s,p)=>s+(p.amount||0),0);
  document.getElementById('sub-pills').innerHTML=`
    <div class="sub-pill active"><div class="sp-num">${active.length}</div><div class="sp-lbl">Active</div></div>
    <div class="sub-pill expired"><div class="sp-num">${expired.length}</div><div class="sp-lbl">Expired</div></div>
    <div class="sub-pill revenue"><div class="sp-num">₹${rev.toLocaleString('en-IN')}</div><div class="sp-lbl">Revenue</div></div>`;
  renderSubs(withSub);
  loadPayments();
}
function filterSubs(){
  const q=document.getElementById('sub-srch').value.toLowerCase();
  const f=document.getElementById('sub-flt').value;const now=new Date();
  const users=MockUsers.getAll().filter(u=>u.subscriptionPlan);
  const filtered=users.filter(u=>{
    const mq=!q||u.email.toLowerCase().includes(q)||(u.displayName||'').toLowerCase().includes(q);
    const exp=u.subscriptionExpiry?new Date(u.subscriptionExpiry):null;
    const fm={active:u.subscriptionActive&&(!exp||exp>now),expired:exp&&exp<now,granted:u.accessGrantedManually};
    return mq&&(f==='all'||fm[f]);
  });
  renderSubs(filtered);
}
function renderSubs(users){
  const now=new Date();
  document.getElementById('tb-subs').innerHTML=users.length?users.map(u=>`
    <tr><td>${u.displayName||'—'}</td><td>${u.email}</td>
    <td><span style="font-size:.75rem;">${u.subscriptionPlan||'—'}</span></td>
    <td>${fmtDate(u.subscriptionStart||u.createdAt)}</td>
    <td>${fmtDate(u.subscriptionExpiry)}</td>
    <td>${daysLeft(u.subscriptionExpiry)}</td>
    <td>${statusBadge(u)}</td>
    <td><button class="act-btn ab-gold" onclick="openExtModal('${u.uid}')">Extend</button></td>
    </tr>`).join(''):'<tr><td colspan="8" class="tbl-mt">No subscriptions found</td></tr>';
}
async function loadPayments(){
  const p=await MockUsers.getPayments();
  document.getElementById('tb-payments').innerHTML=p.length?p.map(pay=>`<tr><td>${pay.userEmail}</td><td>₹${pay.amount||0}</td><td><code style="font-size:.73rem;">${pay.paymentId||'—'}</code></td><td>${fmtDate(pay.date)}</td><td><span class="badge b-active">Success</span></td></tr>`).join(''):'<tr><td colspan="5" class="tbl-mt">No payment records</td></tr>';
  const ptbl=document.getElementById('tb-pay');if(ptbl)ptbl.innerHTML=document.getElementById('tb-payments').innerHTML;
}

/* PRICING */
async function loadPricingConfig(){
  const p=await MockConfig.getPricing();
  document.getElementById('pb-annual').textContent='₹'+(p.annual||'—');
  document.getElementById('pb-monthly').textContent=p.monthly?'₹'+p.monthly:'—';
  document.getElementById('pb-trial').textContent=(p.trial||7)+' days';
  document.getElementById('pb-reports').textContent=p.reportLimit===0?'Unlimited':p.reportLimit;
  document.getElementById('pb-refund').textContent=(p.refundDays||7)+' days';
  document.getElementById('pb-updated').textContent=p.updatedAt?fmtDate(p.updatedAt):'—';
  if(p.annual)document.getElementById('pr-annual').value=p.annual;
  if(p.monthly)document.getElementById('pr-monthly').value=p.monthly;
  document.getElementById('pr-trial').value=p.trial||7;
  document.getElementById('pr-reports').value=p.reportLimit||0;
  document.getElementById('pr-refund').value=p.refundDays||7;
  if(p.couponCode)document.getElementById('pr-code').value=p.couponCode;
  if(p.discountPct)document.getElementById('pr-disc').value=p.discountPct;
}
async function doUpdatePricing(){
  const annual=parseInt(document.getElementById('pr-annual').value);
  if(!annual||annual<1){showMsg('pr-msg','Please enter valid annual price','e');return;}
  const data={annual,monthly:parseInt(document.getElementById('pr-monthly').value)||0,trial:parseInt(document.getElementById('pr-trial').value)||7,reportLimit:parseInt(document.getElementById('pr-reports').value)||0,refundDays:parseInt(document.getElementById('pr-refund').value)||7,couponCode:document.getElementById('pr-code').value.trim(),discountPct:parseInt(document.getElementById('pr-disc').value)||0,updatedAt:new Date().toISOString()};
  await MockConfig.set('pricing',data);loadPricingConfig();showMsg('pr-msg','✅ Pricing updated successfully!','s');toast('Pricing saved');
}
async function loadPlanFeatures(){
  MockConfig.getFeatures().then(f=>{allFeatures=[...f];renderFeatureTags();});
  renderFeatureTags();
  document.getElementById('feat-tags').dataset.loaded='1';
}
function renderFeatureTags(){
  document.getElementById('feat-tags').innerHTML=allFeatures.map((f,i)=>`<span class="feat-tag">${f}<button onclick="removeFeature(${i})">&#10005;</button></span>`).join('');
}
function removeFeature(i){allFeatures.splice(i,1);renderFeatureTags();}
function addFeature(){
  const inp=document.getElementById('feat-inp');const v=inp.value.trim();
  if(!v)return;allFeatures.push(v);renderFeatureTags();inp.value='';
}
async function saveFeatures(){
  await MockConfig.set('planFeatures',allFeatures);
  showMsg('feat-msg','✅ Features saved!','s');toast('Features saved');
}

/* PAYMENT CONFIG */
async function loadPaymentConfig(){
  const r=await MockConfig.getRazorpay();
  if(r.keyId)document.getElementById('rzp-key-id').value=r.keyId;
  if(r.keySecret)document.getElementById('rzp-secret').value=r.keySecret;
  if(r.webhookSecret)document.getElementById('rzp-webhook').value=r.webhookSecret;
  if(r.mode)document.getElementById('rzp-mode').value=r.mode;
  const app=MockConfig.getApp();
  document.getElementById('rzp-biz').value=app.appName||'Numerology Pro';
  const wurl=document.getElementById('wh-url');if(wurl)wurl.textContent=(app.website||'https://numerologypro.com')+'/webhook/razorpay';
  updateGatewayStatus(r);
}
function updateGatewayStatus(r){
  const dot=document.getElementById('gw-dot');const txt=document.getElementById('gw-txt');const info=document.getElementById('gw-info');
  if(!r||!r.keyId){dot.className='gw-dot err';txt.textContent='Not Configured';if(info)info.innerHTML='<span style="color:#991b1b;">No Razorpay credentials found. Enter Key ID and Secret above.</span>';return;}
  if(r.mode==='test'){dot.className='gw-dot warn';txt.textContent='Test Mode — Configured';if(info)info.innerHTML='<span style="color:#92400e;">Running in sandbox mode. Switch to Live Mode for production payments.</span>';}
  else{dot.className='gw-dot ok';txt.textContent='Live Mode — Active';if(info)info.innerHTML='<span style="color:#065f46;">Live payment gateway is active. Payments will be processed in real time.</span>';}
}
async function saveRazorpay(){
  const keyId=document.getElementById('rzp-key-id').value.trim();
  if(!keyId){showMsg('rzp-msg','Please enter Razorpay Key ID','e');return;}
  const data={keyId,keySecret:document.getElementById('rzp-secret').value.trim(),webhookSecret:document.getElementById('rzp-webhook').value.trim(),mode:document.getElementById('rzp-mode').value,bizName:document.getElementById('rzp-biz').value.trim(),logo:document.getElementById('rzp-logo').value.trim(),updatedAt:new Date().toISOString()};
  await MockConfig.set('razorpay',data);showMsg('rzp-msg','✅ Razorpay configuration saved!','s');updateGatewayStatus(data);toast('Payment config saved');
}
function toggleSecret(id){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';}

/* APP SETTINGS */
async function loadAppConfig(){
  const c=await MockConfig.getApp();const n=await MockConfig.get('notifications')||{};
  if(c.appName)document.getElementById('cfg-name').value=c.appName;
  if(c.tagline)document.getElementById('cfg-tag').value=c.tagline;
  if(c.adminEmail)document.getElementById('cfg-admin').value=c.adminEmail;
  if(c.phone)document.getElementById('cfg-phone').value=c.phone;
  if(c.contactEmail)document.getElementById('cfg-email').value=c.contactEmail;
  if(c.website)document.getElementById('cfg-site').value=c.website;
  if(c.whatsapp)document.getElementById('cfg-wa').value=c.whatsapp;
  if(c.maintenance)document.getElementById('cfg-maint').value=c.maintenance;
  ['signup','payment','expiry','access','block','weekly'].forEach(k=>{const el=document.getElementById('n-'+k);if(el&&n[k]!==undefined)el.checked=n[k];});
}
async function saveAppConfig(){
  const data={appName:document.getElementById('cfg-name').value.trim()||'Numerology Pro',tagline:document.getElementById('cfg-tag').value.trim(),adminEmail:document.getElementById('cfg-admin').value.trim(),phone:document.getElementById('cfg-phone').value.trim(),contactEmail:document.getElementById('cfg-email').value.trim(),website:document.getElementById('cfg-site').value.trim(),whatsapp:document.getElementById('cfg-wa').value.trim(),maintenance:document.getElementById('cfg-maint').value,updatedAt:new Date().toISOString()};
  await MockConfig.set('app',data);showMsg('cfg-msg','✅ Configuration saved!','s');toast('App config saved');
}
async function saveNotifications(){
  const n={};
  ['signup','payment','expiry','access','block','weekly'].forEach(k=>{const el=document.getElementById('n-'+k);if(el)n[k]=el.checked;});
  await MockConfig.set('notifications',n);showMsg('notif-msg','✅ Notification settings saved!','s');toast('Notifications saved');
}

/* POLICY EDITOR */
const defaultPolicies={
  terms:`Terms and Conditions — Numerology Pro\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n1. ACCEPTANCE OF TERMS\nBy accessing and using Numerology Pro, you accept and agree to be bound by these Terms and Conditions.\n\n2. SUBSCRIPTION\nAccess to Numerology Pro requires an active subscription. Subscriptions are annual and must be renewed manually.\n\n3. USE OF SERVICE\nNumerology Pro is intended for personal and professional numerological guidance only. Results are for informational purposes.\n\n4. INTELLECTUAL PROPERTY\nAll content, features, and functionality of Numerology Pro are owned by Numerology Pro.\n\n5. LIMITATION OF LIABILITY\nNumerology Pro provides guidance based on numerological principles. We do not guarantee specific outcomes.\n\n6. CONTACT\nFor queries: deotigharekaustubh@gmail.com | 8421427605`,
  privacy:`Privacy Policy — Numerology Pro\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n1. INFORMATION WE COLLECT\nWe collect name, email, mobile number, and date of birth when you create an account.\n\n2. HOW WE USE YOUR INFORMATION\nYour information is used solely to provide numerological analysis and manage your subscription.\n\n3. DATA SECURITY\nWe implement appropriate security measures to protect your personal information.\n\n4. SHARING OF INFORMATION\nWe do not sell, trade, or rent your personal information to third parties.\n\n5. COOKIES\nWe use local storage to maintain your session and preferences.\n\n6. CONTACT\nFor privacy concerns: deotigharekaustubh@gmail.com`,
  refund:`Refund Policy — Numerology Pro\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n1. REFUND ELIGIBILITY\nYou are eligible for a full refund within 7 days of subscription activation.\n\n2. HOW TO REQUEST A REFUND\nEmail us at deotigharekaustubh@gmail.com with your registered email and reason for refund.\n\n3. PROCESSING TIME\nRefunds are processed within 5-7 business days to your original payment method.\n\n4. NON-REFUNDABLE\nAfter 7 days of activation, subscriptions are non-refundable.\n\n5. CONTACT\nFor refund requests: deotigharekaustubh@gmail.com | 8421427605`
};
async function loadPolicy(){
  const sel=document.getElementById('pol-sel').value;
  const labels={terms:'Terms and Conditions',privacy:'Privacy Policy',refund:'Refund Policy'};
  document.getElementById('pol-label').textContent=labels[sel];
  const saved=await MockConfig.get('policy_'+sel);
  document.getElementById('pol-content').value=saved||defaultPolicies[sel]||'';
}
async function savePolicy(){
  const sel=document.getElementById('pol-sel').value;
  await MockConfig.set('policy_'+sel,document.getElementById('pol-content').value);
  showMsg('pol-msg','✅ Policy saved!','s');toast('Policy saved');
}
function previewPolicy(){
  const sel=document.getElementById('pol-sel').value;
  const map={terms:'pages/terms.html',privacy:'pages/privacy.html',refund:'pages/refund.html'};
  window.open(map[sel],'_blank');
}

/* DANGER ZONE */
function resetTestData(){
  if(!confirm('This will reset ALL user data to defaults. Are you sure?'))return;
  localStorage.removeItem('np_users');localStorage.removeItem('np_grants');localStorage.removeItem('np_payments');
  ['pricing','app','razorpay','planFeatures','notifications'].forEach(k=>localStorage.removeItem('np_cfg_'+k));
  toast('All test data reset');setTimeout(()=>location.reload(),1000);
}
function exportAllData(){
  const users=await MockUsers.getAll();
  const csv=['Name,Email,Mobile,Role,Status,Plan,Expiry,Joined'].concat(users.map(u=>`"${u.displayName||''}","${u.email}","${u.mobile||''}","${u.role}","${MockAuth.getStatus(u)}","${u.subscriptionPlan||''}","${u.subscriptionExpiry||''}","${u.createdAt||''}"`)).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='numerology_pro_users_'+Date.now()+'.csv';a.click();toast('CSV exported');
}
function blockAllExpired(){
  if(!confirm('Block all users with expired subscriptions?'))return;
  const users=await MockUsers.getAll();const now=new Date();let count=0;
  await Promise.all(users.map(async u=>{if(u.subscriptionActive&&u.subscriptionExpiry&&new Date(u.subscriptionExpiry)<now&&!u.blocked){await MockUsers.block(u.uid,true);count++;}}));
  loadUsers();loadOverview();toast(`${count} expired users blocked`);
}
async function doAdminLogout(){if(confirm('Sign out of admin panel?')){localStorage.removeItem('np_user');await auth.signOut();window.location.href='login.html';}}

/* ═══════════════════════════════════════════════════════════
   MODULE MANAGER
   All 30 modules with toggle on/off from admin panel
   ═══════════════════════════════════════════════════════════ */

const ALL_MODULES = [
  // ── Name Analysis ──────────────────────────────────────
  { id:'loshu',          name:'Lo Shu Grid',              icon:'⊞', cat:'Name Analysis',   desc:'3×3 grid with missing number remedies and plane analysis' },
  { id:'name-vibration', name:'Name Vibration',            icon:'✦', cat:'Name Analysis',   desc:'Chaldean & Pythagorean analysis with before/after comparison' },
  { id:'name-correction',name:'Name Correction',           icon:'✎', cat:'Name Analysis',   desc:'Spelling optimization for desired life outcomes' },
  { id:'baby-name',      name:'Baby Name Recommendations', icon:'♡', cat:'Name Analysis',   desc:'Auspicious baby names based on Life Path compatibility' },
  { id:'business-name',  name:'Business Name & Branding',  icon:'⚑', cat:'Name Analysis',   desc:'Business name vibration check and branding suggestions' },
  // ── Number Analysis ────────────────────────────────────
  { id:'mobile-number',  name:'Mobile Number Analysis',    icon:'◈', cat:'Number Analysis', desc:'Vibration check and SIM selection guidance' },
  { id:'house-number',   name:'House Number Analysis',     icon:'⌂', cat:'Number Analysis', desc:'Energy compatibility with owner and correction remedies' },
  { id:'vehicle-number', name:'Vehicle Number Analysis',   icon:'◎', cat:'Number Analysis', desc:'Registration number vibration and protection remedies' },
  // ── Identity ───────────────────────────────────────────
  { id:'email-analysis', name:'Email & Username',          icon:'@', cat:'Identity',        desc:'Numerological vibration of digital identity' },
  { id:'signature',      name:'Signature Analysis',        icon:'✒', cat:'Identity',        desc:'Signature style analysis and correction guidance' },
  { id:'lucky-numbers',  name:'Lucky & Unlucky Numbers',   icon:'★', cat:'Identity',        desc:'Personalized lucky number identification' },
  // ── Remedies ───────────────────────────────────────────
  { id:'colors',         name:'Color Therapy',             icon:'◉', cat:'Remedies',        desc:'Lucky colors based on Life Path and ruling planet' },
  { id:'lucky-dates',    name:'Lucky Dates & Timing',      icon:'◷', cat:'Remedies',        desc:'Auspicious date selection for important events' },
  { id:'gemstones',      name:'Gemstone Recommendations',  icon:'◆', cat:'Remedies',        desc:'Power gemstones matched to Life Path with wearing ritual' },
  { id:'crystals',       name:'Crystal Healing',           icon:'✧', cat:'Remedies',        desc:'Crystals for numerological imbalances' },
  { id:'rudraksha',      name:'Rudraksha Guidance',        icon:'⊛', cat:'Remedies',        desc:'Mukhi-based Rudraksha with challenge-specific guidance' },
  { id:'mantra',         name:'Mantra & Spiritual Remedies',icon:'☯',cat:'Remedies',        desc:'Personalized planetary mantras and chanting practice' },
  { id:'yantra',         name:'Yantra Suggestions',        icon:'⬡', cat:'Remedies',        desc:'Sacred geometry Yantra for energy balancing' },
  // ── Life Areas ─────────────────────────────────────────
  { id:'career',         name:'Career & Profession',       icon:'◈', cat:'Life Areas',      desc:'Career paths aligned with your numerological blueprint' },
  { id:'finance',        name:'Financial Growth',          icon:'◎', cat:'Life Areas',      desc:'Money attraction and financial block removal remedies' },
  { id:'relationship',   name:'Relationship Harmony',      icon:'♡', cat:'Life Areas',      desc:'Compatibility analysis and harmony remedies' },
  { id:'marriage',       name:'Marriage Compatibility',    icon:'◇', cat:'Life Areas',      desc:'Full compatibility score with correction remedies' },
  { id:'health',         name:'Health Insights',           icon:'✚', cat:'Life Areas',      desc:'Health vulnerabilities by Life Path and wellness guidance' },
  // ── Planning ───────────────────────────────────────────
  { id:'daily-remedies', name:'Daily / Monthly / Yearly Plan', icon:'☀', cat:'Planning',   desc:'Personal cycle numbers with tailored daily remedies' },
  { id:'action-plan',    name:'90-Day Action Plan',        icon:'◑', cat:'Planning',        desc:'Personalised roadmap for your specific 90-day goal' },
  { id:'energy-balance', name:'Energy Balancing System',   icon:'∞', cat:'Planning',        desc:'Holistic prescription combining all remedy tools' },
];

// Load saved module states — default all ON
function getModuleStates() {
  const saved = MockConfig.get('module_states');
  if (saved) return saved;
  // Default: all ON
  const defaults = {};
  ALL_MODULES.forEach(m => defaults[m.id] = true);
  return defaults;
}

async function saveModuleStates(states) {
  await MockConfig.set('module_states', states);
}

// Render the module manager grid
function renderModuleManager() {
  const states = getModuleStates();
  const grid = document.getElementById('module-manager-grid');
  if (!grid) return;

  // Group by category
  const cats = {};
  ALL_MODULES.forEach(m => {
    if (!cats[m.cat]) cats[m.cat] = [];
    cats[m.cat].push(m);
  });

  let html = '';
  for (const [cat, mods] of Object.entries(cats)) {
    html += `<div class="mod-group-header">${cat}</div>`;
    mods.forEach(m => {
      const on = states[m.id] !== false; // default true
      html += `
      <div class="mod-card ${on ? '' : 'mod-off'}" id="modcard-${m.id}">
        <div class="mod-info">
          <div class="mod-icon">${m.icon}</div>
          <div class="mod-name">${m.name}</div>
          <div class="mod-desc">${m.desc}</div>
          <div class="mod-cat">${m.cat}</div>
        </div>
        <div class="mod-toggle-wrap">
          <label class="tgl">
            <input type="checkbox" id="mod-${m.id}" ${on ? 'checked' : ''} onchange="onModuleToggle('${m.id}',this.checked)"/>
            <span class="tgl-sl"></span>
          </label>
          <span class="mod-status-lbl ${on ? 'on' : 'off'}" id="modlbl-${m.id}">${on ? 'ON' : 'OFF'}</span>
        </div>
      </div>`;
    });
  }
  grid.innerHTML = html;
  renderModuleStats(states);
}

function onModuleToggle(id, checked) {
  // Update card style live
  const card = document.getElementById('modcard-' + id);
  const lbl  = document.getElementById('modlbl-' + id);
  if (card) card.classList.toggle('mod-off', !checked);
  if (lbl)  { lbl.textContent = checked ? 'ON' : 'OFF'; lbl.className = 'mod-status-lbl ' + (checked ? 'on' : 'off'); }
  renderModuleStats(getCurrentModuleStates());
}

function getCurrentModuleStates() {
  const states = {};
  ALL_MODULES.forEach(m => {
    const el = document.getElementById('mod-' + m.id);
    states[m.id] = el ? el.checked : true;
  });
  return states;
}

async function saveModules() {
  const states = getCurrentModuleStates();
  await saveModuleStates(states);
  const onCount  = Object.values(states).filter(Boolean).length;
  const offCount = Object.values(states).length - onCount;
  showMsg('mod-msg', `✅ Saved — ${onCount} modules enabled, ${offCount} disabled. Changes apply instantly for all users.`, 's');
  toast(`Modules saved: ${onCount} ON, ${offCount} OFF`);
  renderModuleStats(states);
}

function setAllModules(enabled) {
  ALL_MODULES.forEach(m => {
    const el = document.getElementById('mod-' + m.id);
    if (el) el.checked = enabled;
    onModuleToggle(m.id, enabled);
  });
}

function renderModuleStats(states) {
  const total   = ALL_MODULES.length;
  const onCount = Object.values(states).filter(Boolean).length;
  const offCount = total - onCount;
  const el = document.getElementById('mod-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="ms-pill total"><div class="ms-num">${total}</div><div class="ms-lbl">Total Modules</div></div>
    <div class="ms-pill enabled"><div class="ms-num">${onCount}</div><div class="ms-lbl">Enabled</div></div>
    <div class="ms-pill disabled"><div class="ms-num">${offCount}</div><div class="ms-lbl">Disabled</div></div>`;
}

// Module manager auto-init handled inside goTab
