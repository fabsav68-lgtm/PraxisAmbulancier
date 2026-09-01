// ═══════════════════════════════════════════════════════════
//  PraxisAmbulancier — Système d'avis Supabase
//  Même table "avis" que les autres apps Praxis
//  window.PRAXIS_APP = 'PraxisAmbulancier' (défini dans chaque module)
// ═══════════════════════════════════════════════════════════

var SUPABASE_URL  = 'https://fvrfiikrasezlzpaxpqz.supabase.co';
var SUPABASE_ANON = 'sb_publishable_TNksbociGaWCY53M4wCAXg_faOxEqKt';
var PRAXIS_APP    = 'PraxisAmbulancier';

// ── Détection module courant ──────────────────────────────
function getModuleName(){
  try { return document.title.replace(' · ', ' - ').split('·')[0].trim(); }
  catch(e){ return 'Inconnu'; }
}

// ── Injection du widget avis ──────────────────────────────
function injectFeedback(){
  if(document.getElementById('praxis-feedback-widget')) return;

  var code  = sessionStorage.getItem('praxisambu_code')  || 'inconnu';
  var promo = sessionStorage.getItem('praxisambu_niveau') || 'DEA';
  var mod   = getModuleName();

  var html = '<div id="praxis-feedback-widget" style="' +
    'position:fixed;bottom:90px;right:20px;z-index:200;' +
    'background:#0d0f0a;border:1.5px solid rgba(14,165,233,.3);' +
    'border-radius:14px;padding:14px 16px;width:260px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:Karla,sans-serif;' +
    'display:none">' +
    '<div style="font-size:13px;font-weight:700;color:#0ea5e9;margin-bottom:10px">Ton avis sur ce module</div>' +
    // Note
    '<div style="margin-bottom:8px;font-size:11px;color:#7a8a72">Note globale</div>' +
    '<div id="stars-ambu" style="display:flex;gap:6px;margin-bottom:12px">' +
    [1,2,3,4,5].map(function(n){
      return '<span onclick="setStarAmbu('+n+')" style="font-size:22px;cursor:pointer;opacity:.3" data-star="'+n+'">★</span>';
    }).join('') + '</div>' +
    // Aide
    '<div style="font-size:11px;color:#7a8a72;margin-bottom:4px">Ce module t\'a aidé ?</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:10px">' +
    ['Oui','Un peu','Non'].map(function(v){
      return '<button onclick="setAideAmbu(\''+v+'\')" data-aide="'+v+'" style="flex:1;padding:5px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#7a8a72;font-size:11px;cursor:pointer">'+v+'</button>';
    }).join('') + '</div>' +
    // Difficulté
    '<div style="font-size:11px;color:#7a8a72;margin-bottom:4px">Difficulté perçue</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:10px">' +
    ['Facile','Moyen','Difficile'].map(function(v){
      return '<button onclick="setDiffAmbu(\''+v+'\')" data-diff="'+v+'" style="flex:1;padding:5px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#7a8a72;font-size:11px;cursor:pointer">'+v+'</button>';
    }).join('') + '</div>' +
    // Commentaire
    '<textarea id="fb-comment-ambu" placeholder="Un commentaire ? (optionnel)" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#eef2ec;font-size:12px;resize:none;height:56px;margin-bottom:10px;font-family:Karla,sans-serif"></textarea>' +
    // Réponse formateur
    '<div id="fb-reponse-ambu" style="display:none;background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.2);border-radius:8px;padding:8px;margin-bottom:10px;font-size:11px;color:#7dd3fc"></div>' +
    // Bouton
    '<button onclick="envoyerAvisAmbu()" style="width:100%;padding:9px;border-radius:8px;background:linear-gradient(135deg,#0c4a6e,#0ea5e9);color:#0d0f0a;font-weight:700;border:none;cursor:pointer;font-size:12px">Envoyer mon avis</button>' +
    '<div id="fb-msg-ambu" style="font-size:11px;text-align:center;margin-top:8px;display:none"></div>' +
    '</div>';

  // Bouton déclencheur
  var btn = document.createElement('button');
  btn.id = 'praxis-feedback-btn';
  btn.innerHTML = '💬';
  btn.title = 'Donner mon avis';
  btn.style.cssText = 'position:fixed;bottom:90px;right:20px;z-index:201;width:44px;height:44px;border-radius:50%;' +
    'background:rgba(14,165,233,.15);border:1.5px solid rgba(14,165,233,.3);' +
    'color:#0ea5e9;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center';
  btn.onclick = function(){
    var w = document.getElementById('praxis-feedback-widget');
    var visible = w.style.display !== 'none';
    w.style.display = visible ? 'none' : 'block';
    btn.style.display = visible ? 'flex' : 'none';
    if(!visible) chargerAvisExistantAmbu(code, mod);
  };

  document.body.insertAdjacentHTML('beforeend', html);
  document.body.appendChild(btn);

  window._fbAmbu = { code: code, promo: promo, mod: mod, note: 0, aide: '', diff: '' };
}

function setStarAmbu(n){
  window._fbAmbu.note = n;
  document.querySelectorAll('#stars-ambu span').forEach(function(s){
    s.style.opacity = parseInt(s.dataset.star) <= n ? '1' : '0.3';
    s.style.color   = parseInt(s.dataset.star) <= n ? '#0ea5e9' : '';
  });
}

function setAideAmbu(v){
  window._fbAmbu.aide = v;
  document.querySelectorAll('[data-aide]').forEach(function(b){
    b.style.background = b.dataset.aide === v ? 'rgba(14,165,233,.2)' : 'rgba(255,255,255,.03)';
    b.style.color      = b.dataset.aide === v ? '#0ea5e9' : '#7a8a72';
    b.style.borderColor= b.dataset.aide === v ? 'rgba(14,165,233,.5)' : 'rgba(255,255,255,.1)';
  });
}

function setDiffAmbu(v){
  window._fbAmbu.diff = v;
  document.querySelectorAll('[data-diff]').forEach(function(b){
    b.style.background = b.dataset.diff === v ? 'rgba(14,165,233,.2)' : 'rgba(255,255,255,.03)';
    b.style.color      = b.dataset.diff === v ? '#0ea5e9' : '#7a8a72';
    b.style.borderColor= b.dataset.diff === v ? 'rgba(14,165,233,.5)' : 'rgba(255,255,255,.1)';
  });
}

function envoyerAvisAmbu(){
  var f = window._fbAmbu;
  if(!f.note){ showMsgAmbu('Sélectionne une note ★', '#f59e0b'); return; }
  var commentaire = document.getElementById('fb-comment-ambu').value.trim();
  fetch(SUPABASE_URL + '/rest/v1/avis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      app: PRAXIS_APP, module: f.mod, code: f.code, promo: f.promo,
      note: f.note, aide: f.aide, difficulte: f.diff,
      commentaire: commentaire, lu: false
    })
  })
  .then(function(r){
    if(r.ok || r.status === 201){
      showMsgAmbu('✅ Merci pour ton retour !', '#22c55e');
      setTimeout(function(){
        document.getElementById('praxis-feedback-widget').style.display = 'none';
        document.getElementById('praxis-feedback-btn').style.display = 'flex';
      }, 1800);
    } else { showMsgAmbu('Erreur — réessaie', '#ef4444'); }
  })
  .catch(function(){ showMsgAmbu('Erreur réseau', '#ef4444'); });
}

function chargerAvisExistantAmbu(code, mod){
  fetch(SUPABASE_URL + '/rest/v1/avis?app=eq.'+PRAXIS_APP+'&code=eq.'+code+'&module=eq.'+encodeURIComponent(mod)+'&select=note,aide,difficulte,commentaire,reponse&order=id.desc&limit=1', {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
  })
  .then(function(r){ return r.json(); })
  .then(function(rows){
    if(!rows || !rows.length) return;
    var a = rows[0];
    if(a.note)       setStarAmbu(a.note);
    if(a.aide)       setAideAmbu(a.aide);
    if(a.difficulte) setDiffAmbu(a.difficulte);
    if(a.commentaire) document.getElementById('fb-comment-ambu').value = a.commentaire;
    if(a.reponse){
      var el = document.getElementById('fb-reponse-ambu');
      el.style.display = 'block';
      el.innerHTML = '💬 Formateur : ' + a.reponse;
    }
  })
  .catch(function(){});
}

function showMsgAmbu(txt, color){
  var el = document.getElementById('fb-msg-ambu');
  el.textContent = txt; el.style.color = color; el.style.display = 'block';
}

// Auto-injection au chargement
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', injectFeedback);
} else {
  injectFeedback();
}
