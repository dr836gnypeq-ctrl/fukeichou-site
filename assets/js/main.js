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

/* ===== グローバル受診者選択 ===== */
window._audience = 'clinic'; // 初期値

function setAudience(target){
  window._audience = target;

  /* 1. #pain タブ */
  var painBtns = document.querySelectorAll('#pain .tab-btn');
  var painMap  = {clinic:0, mental:1, care:2};
  painBtns.forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('#pain .tab-content')
          .forEach(function(c){c.classList.remove('active');});
  if(painBtns[painMap[target]]) painBtns[painMap[target]].classList.add('active');
  var pc = document.getElementById('tab-' + target);
  if(pc) pc.classList.add('active');

  /* 2. #intro-image タブ (mental → clinic に吸収) */
  var introTarget = (target === 'care') ? 'intro-care' : 'intro-clinic';
  document.querySelectorAll('#intro-tab-buttons .tab-btn')
          .forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.intro-tab-content')
          .forEach(function(c){c.classList.remove('active');});
  var ib = document.querySelector(
    '#intro-tab-buttons .tab-btn[data-tab="'+introTarget+'"]');
  if(ib) ib.classList.add('active');
  var ic = document.getElementById(introTarget);
  if(ic) ic.classList.add('active');

  /* 3. #evidence タブボタン */
  document.querySelectorAll('#evidence .ev-tab-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-audience') === target);
  });

  /* 4. #evidence カード表示切替 */
  document.querySelectorAll('#evidence .evidence-card').forEach(function(card){
    var ev = card.getAttribute('data-ev');
    card.style.display = (ev === 'all' || ev === target) ? '' : 'none';
  });
}

/* 後方互換 */
function switchTab(target){ setAudience(target); }

/* 導入想像図タブから逆方向連動 */
(function(){
  var introButtons = document.querySelectorAll('#intro-tab-buttons .tab-btn');
  var introTabMap  = {'intro-clinic':'clinic', 'intro-care':'care'};
  introButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var t = btn.getAttribute('data-tab');
      setAudience(introTabMap[t] || 'clinic');
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

  /* 4. エビデンスカード: タブ切替方式に移行。show-more廃止 */
})();


/* ===== HEADER HERO-PASS TRANSFORM + SECTION PILLS ===== */
(function(){
  var SECTIONS = [
    {id:'pain',        label:'お悩み'},
    {id:'evidence',    label:'科学的根拠'},
    {id:'service',     label:'サービス概要'},
    {id:'authentic',   label:'本物へのこだわり'},
    {id:'map',         label:'撮影地'},
    {id:'pricing',     label:'料金'},
    {id:'flow',        label:'導入の流れ'},
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

  /* ── › ボタン: スクロール制御 + 右端到達で非表示 ── */
  var scrollBtn = document.getElementById('pillScrollBtn');
  if(scrollBtn && headerPills){
    /* 右端に到達したらボタンを隠す */
    function updateScrollBtn(){
      var atEnd = headerPills.scrollLeft + headerPills.clientWidth >= headerPills.scrollWidth - 4;
      scrollBtn.classList.toggle('hidden', atEnd);
    }
    headerPills.addEventListener('scroll', updateScrollBtn, {passive:true});
    window.addEventListener('resize', updateScrollBtn);
    updateScrollBtn();

    /* ボタン押下で1ピル分スクロール */
    scrollBtn.addEventListener('click', function(){
      headerPills.scrollBy({left: 120, behavior:'smooth'});
    });
  }
})();

/* ===== URLパラメータ 業態自動切替 ===== */
(function(){
  var AUDIENCE_MESSAGES = {
    clinic: '待合室のワイドショー——音量のジレンマ、待ち時間の口コミ、診察前の患者の緊張。<br>その三つ、まとめて解決できます。',
    mental: '刺激的なニュースをやめたい、でも消すわけにもいかない——<br>心療内科・精神科の待合室に、静かな自然映像という答えがあります。',
    care:   '外に出られない入居者に、桜と紅葉と海を届けたい——<br>その思いに、映像という答えを。共用スペースのテレビを、もうひとつの窓に変えます。'
  };

  function getParam(key){
    try {
      return new URLSearchParams(window.location.search).get(key);
    } catch(e){ return null; }
  }

  function injectHeroBanner(audience){
    var msg = AUDIENCE_MESSAGES[audience];
    if(!msg) return;
    var hero = document.querySelector('.hero-content');
    if(!hero) return;
    var banner = document.createElement('div');
    banner.className = 'hero-audience-banner';
    banner.innerHTML = msg;
    var actions = hero.querySelector('.hero-actions');
    if(actions) hero.insertBefore(banner, actions);
    else hero.appendChild(banner);
  }

  document.addEventListener('DOMContentLoaded', function(){
    var from = getParam('from');
    var validAudiences = ['clinic','mental','care'];
    if(from && validAudiences.indexOf(from) !== -1){
      if(typeof setAudience === 'function') setAudience(from);
      injectHeroBanner(from);
    }
  });
})();
