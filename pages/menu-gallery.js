(function(){
  'use strict';
  const dialog = document.getElementById('menu-lightbox');
  const img = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const close = dialog?.querySelector('.lightbox-close');
  if (!dialog || !img || !caption || !close || typeof dialog.showModal !== 'function') return;
  let lastTrigger = null;
  document.querySelectorAll('.menu-image-button').forEach(button => {
    button.addEventListener('click', () => {
      const full = button.getAttribute('data-full');
      if (!full || !/^\.\/assets\/menu\/[\w-]+\.jpg$/.test(full)) return;
      lastTrigger = button;
      img.src = full;
      img.alt = button.querySelector('img')?.alt || 'メニュー画像';
      caption.textContent = button.getAttribute('data-caption') || 'メニュー';
      dialog.showModal();
      close.focus();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
  dialog.addEventListener('close', () => {
    img.removeAttribute('src');
    if (lastTrigger?.isConnected) lastTrigger.focus();
  });
})();
