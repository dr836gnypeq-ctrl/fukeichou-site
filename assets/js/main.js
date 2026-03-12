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
