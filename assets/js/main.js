/* Service Worker 登録 */
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/fukeichou-site/sw.js', {
      /* updateViaCache:'none' → SafariがHTTPキャッシュを無視してSWスクリプトを常に最新確認する
         Chromeはデフォルトでこの挙動。Safariはオプション指定が必要。 */
      updateViaCache: 'none'
    }).catch(function(e){ console.warn('SW registration failed:', e); });
  });
}

/* タブ切り替え */
function switchTab(target){
  var btns = document.querySelectorAll('#pain .tab-btn');
  var contents = document.querySelectorAll('#pain .tab-content');
  btns.forEach(function(btn){btn.classList.remove('active');});
  contents.forEach(function(tc){tc.classList.remove('active');});
  if(target==='clinic'){
    btns[0].classList.add('active');
    document.getElementById('tab-clinic').classList.add('active');
  }else if(target==='mental'){
    btns[1].classList.add('active');
    document.getElementById('tab-mental').classList.add('active');
  }else{
    btns[2].classList.add('active');
    document.getElementById('tab-care').classList.add('active');
  }
}

/* 導入想像図タブ切り替え */
(function(){
  var introButtons = document.querySelectorAll('#intro-tab-buttons .tab-btn');
  introButtons.forEach(function(btn){
    btn.addEventListener('click',function(){
      var target = btn.getAttribute('data-tab');
      introButtons.forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.intro-tab-content').forEach(function(tc){tc.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
})();

/* ヘッダー透明→不透明 切り替え */
(function(){
  var header=document.querySelector('.site-header');
  function check(){
    if(window.scrollY<80){
      header.classList.add('at-top');
      header.classList.remove('scrolled');
    }else{
      header.classList.remove('at-top');
      header.classList.add('scrolled');
    }
  }
  check();
  window.addEventListener('scroll',check,{passive:true});
})();

/* ハンバーガーメニュー */
(function(){
  var toggle=document.getElementById('navToggle');
  var nav=document.getElementById('mainNav');
  if(!toggle||!nav)return;
  toggle.addEventListener('click',function(){
    toggle.classList.toggle('open');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){
      toggle.classList.remove('open');
      nav.classList.remove('open');
    });
  });
})();

/* Scroll Reveal */
(function(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
    });
  },{threshold:0.12});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
})();

if(typeof lucide !== 'undefined'){
  lucide.createIcons();
}else{
  document.addEventListener('DOMContentLoaded', function(){
    if(typeof lucide !== 'undefined') lucide.createIcons();
  });
  window.addEventListener('load', function(){
    if(typeof lucide !== 'undefined') lucide.createIcons();
  });
}

/* ===== MOBILE SCROLL REDUCTION ===== */
(function(){
  var isMobile = window.innerWidth <= 768;

  /* 1. Feature cards アコーディオン (mobile only) */
  if(isMobile){
    document.querySelectorAll('.feature-card').forEach(function(card){
      var q = card.querySelector('.feature-q');
      if(q) q.classList.add('feature-q-toggle');
      card.addEventListener('click', function(){
        card.classList.toggle('fc-open');
      });
    });
  }

  /* 2. 本物宣言カード: 本文fold + 「続きを読む」ボタン */
  document.querySelectorAll('.authentic-card').forEach(function(card){
    var p = card.querySelector('p');
    if(!p) return;
    p.classList.add('auth-text');
    var btn = document.createElement('button');
    btn.className = 'btn-auth-expand';
    btn.textContent = '続きを読む →';
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      card.classList.add('auth-expanded');
      btn.style.display = 'none';
    });
    card.appendChild(btn);
  });

  /* 3. クリニックペインカード: 4枚目を「もっと見る」 */
  if(isMobile){
    var clinicGrid = document.querySelector('#tab-clinic .pain-grid');
    if(clinicGrid){
      var pcards = clinicGrid.querySelectorAll('.pain-card');
      if(pcards.length > 3){
        for(var i=3;i<pcards.length;i++) pcards[i].classList.add('pain-card-extra');
        var pbtn = document.createElement('button');
        pbtn.className = 'btn-show-more';
        pbtn.textContent = '他のお悩みも見る';
        pbtn.onclick = function(){
          clinicGrid.querySelectorAll('.pain-card-extra').forEach(function(c){c.classList.add('shown');});
          pbtn.style.display='none';
        };
        clinicGrid.after(pbtn);
      }
    }
  }

  /* 4. エビデンスカード: 4枚目以降を「もっと見る」 */
  if(isMobile){
    var evGrid = document.querySelector('.evidence-grid');
    if(evGrid){
      var evcards = evGrid.querySelectorAll('.evidence-card');
      if(evcards.length > 3){
        for(var j=3;j<evcards.length;j++) evcards[j].classList.add('evidence-card-extra');
        var evbtn = document.createElement('button');
        evbtn.className = 'btn-show-more';
        evbtn.textContent = 'さらに見る（歯科・精神科の研究）';
        evbtn.onclick = function(){
          evGrid.querySelectorAll('.evidence-card-extra').forEach(function(c){c.classList.add('shown');});
          evbtn.style.display='none';
        };
        evGrid.after(evbtn);
      }
    }
  }
})();


/* ===== HEADER HERO-PASS TRANSFORM + SECTION PILLS ===== */
(function(){
  var SECTIONS = [
    {id:'pain',        label:'お悩み'},
    {id:'service',     label:'できること'},
    {id:'map',         label:'撮影地'},
    {id:'authentic',   label:'なぜ実写か'},
    {id:'flow',        label:'導入の流れ'},
    {id:'evidence',    label:'科学的根拠'},
    {id:'pricing',     label:'料金'},
    {id:'intro-image', label:'導入イメージ'},
    {id:'faq',         label:'FAQ'},
  ].filter(function(s){ return !!document.getElementById(s.id); });

  var headerPills = document.getElementById('headerPills');
  if(!headerPills) return;

  var currentIdx = -1;
  var pillItems  = [];

  /* ── ページ内スクロールピルを生成 ── */
  SECTIONS.forEach(function(s){
    var pi = document.createElement('button');
    pi.className = 'h-pill';
    pi.textContent = s.label;
    pi.addEventListener('click', function(){
      var el = document.getElementById(s.id);
      if(el) el.scrollIntoView({behavior:'smooth'});
    });
    headerPills.appendChild(pi);
    pillItems.push(pi);
  });

  /* ── 現在地ハイライト ── */
  function setActive(idx){
    if(idx === currentIdx) return;
    currentIdx = idx;
    pillItems.forEach(function(el, i){ el.classList.toggle('active', i===idx); });
    /* アクティブピルを中央にスクロール */
    var pill = pillItems[idx];
    if(pill && headerPills){
      headerPills.scrollTo({
        left: pill.offsetLeft - headerPills.offsetWidth/2 + pill.offsetWidth/2,
        behavior:'smooth'
      });
    }
  }

  /* IntersectionObserver でセクション検出 */
  var secObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      for(var i=0; i<SECTIONS.length; i++){
        if(SECTIONS[i].id === entry.target.id){ setActive(i); break; }
      }
    });
  },{rootMargin:'-25% 0px -65% 0px'});

  SECTIONS.forEach(function(s){
    var el = document.getElementById(s.id);
    if(el) secObs.observe(el);
  });
})();
