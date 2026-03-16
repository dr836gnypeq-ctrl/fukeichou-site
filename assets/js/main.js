/* タブ切り替え */
function switchTab(target){
  document.querySelectorAll('.tab-btn').forEach(function(btn){btn.classList.remove('active')});
  document.querySelectorAll('.tab-content').forEach(function(tc){tc.classList.remove('active')});
  if(target==='clinic'){
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('tab-clinic').classList.add('active');
  }else{
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('tab-care').classList.add('active');
  }
}

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
