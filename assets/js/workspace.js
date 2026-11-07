'use strict';
(() => {
  const front = document.querySelector('#atlas-view');
  const back = document.querySelector('#toolkit-view');
  back.querySelector('h1')?.setAttribute('tabindex', '-1');
  const toggle = document.querySelector('#open-toolkit');
  const announcement = document.querySelector('#view-announcement');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previousScroll = 0, animation;

  function showToolkit(show, focus = true) {
    const changed = show !== !back.hidden;
    if (show && changed) previousScroll = window.scrollY;
    animation?.cancel();
    front.hidden = show;
    back.hidden = !show;
    document.documentElement.dataset.side = show ? 'toolkit' : 'atlas';
    toggle.setAttribute('aria-expanded', String(show));
    toggle.innerHTML = '<span aria-hidden="true">↻</span> ' + (show ? '返回搜索导航' : '数字工具库');
    if (changed) {
      window.scrollTo({top: show ? 0 : previousScroll, behavior: 'instant'});
      if (!reducedMotion.matches) animation = (show ? back : front).animate([
        {opacity: 0, transform: 'perspective(1600px) rotateY(-8deg) translateY(12px)'},
        {opacity: 1, transform: 'perspective(1600px) rotateY(0) translateY(0)'}
      ], {duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)'});
      if (focus) (show ? back.querySelector('h1') : toggle).focus({preventScroll:true});
      announcement.textContent = show ? '已翻转到个人数字工具记录库' : '已返回搜索与网址导航';
    }
  }
  toggle.addEventListener('click', () => {
    const show = back.hidden;
    history.pushState(null, '', show ? '#toolkit' : location.pathname + location.search);
    showToolkit(show);
  });
  function syncLocation() { showToolkit(location.hash === '#toolkit', false); }
  window.addEventListener('hashchange', syncLocation);
  window.addEventListener('popstate', syncLocation);
  // The directory is on the front side, including when reached from a back-side link.
  document.querySelector('a[href="#directory"]').addEventListener('click', () => showToolkit(false, false));
  document.addEventListener('keydown', event => {
    if (event.altKey && event.shiftKey && event.code === 'KeyD') { event.preventDefault(); toggle.click(); }
    if (event.key === 'Escape' && !back.hidden && !document.querySelector('dialog[open]')) {
      toggle.click();
    }
  });
  syncLocation();
})();

