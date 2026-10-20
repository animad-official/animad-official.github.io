'use strict';
const RSVP_ORIGIN='https://kurokikaren000.github.io';
const RSVP_CHANNEL='animad-rsvp-v1';
const entryStatus=document.getElementById('entry-status');
const frameSlot=document.getElementById('rsvp-frame-slot');
const retryButton=document.getElementById('rsvp-retry');
let frame,frameSource,frameOrigin,nonce,readyTimer,settings,editorOpen=false;
function googleFrameOrigin(origin) {
  try {
    const u=new URL(origin);
    return u.protocol==='https:'&&!u.port&&(u.hostname==='script.google.com'||
      /^(?:script|[a-z0-9-]+-script)\.googleusercontent\.com$/.test(u.hostname)||
      /^[a-z0-9-]+\.script\.googleusercontent\.com$/.test(u.hostname));
  } catch {return false;}
}
function viewport() {
  const available=Math.max(200,Math.min(3000,Math.floor(window.visualViewport?.height||innerHeight)));
  if(frame&&editorOpen)frame.style.minHeight=available+'px';
  if(frameSource)frameSource.postMessage({channel:RSVP_CHANNEL,nonce,type:'viewport',
    height:Math.max(200,available-Math.max(0,frame.getBoundingClientRect().top))},frameOrigin);
}
function unavailable() {
  entryStatus.hidden=false;
  entryStatus.textContent='参加受付の読み込みが完了しませんでした。現在、受付の通信を確認できていません。「受付の表示を再試行」から再読み込みしてください。';
  retryButton.hidden=false;
  if(frame)frame.style.visibility='hidden';
}
function openFrame() {
  clearTimeout(readyTimer);frameSource=null;frameOrigin=null;editorOpen=false;
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  nonce=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const url=new URL(settings.appsScriptUrl);url.searchParams.set('embed','1');url.searchParams.set('nonce',nonce);
  frame=document.createElement('iframe');frame.id='rsvp-frame';frame.title='ANIMAD 参加表明・参加一覧・編集';
  frame.referrerPolicy='no-referrer';
  frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  frame.style.cssText='display:block;width:100%;height:800px;border:0;visibility:hidden;scroll-margin-top:16px';
  frameSlot.replaceChildren(frame);entryStatus.hidden=false;retryButton.hidden=true;
  entryStatus.textContent='参加受付を読み込んでいます…';
  readyTimer=setTimeout(unavailable,55000);frame.src=url.href;
}
window.addEventListener('message',event=>{
  const message=event.data;
  if(window.top!==window.self||location.origin!==RSVP_ORIGIN||!frame||!message||
    message.channel!==RSVP_CHANNEL||message.nonce!==nonce||!event.source||!googleFrameOrigin(event.origin))return;
  if(message.type==='hello') {
    // HtmlService has an inner Google frame: bind its WindowProxy after nonce/origin checks.
    if(frameSource&&frameSource!==event.source)return;
    frameSource=event.source;frameOrigin=event.origin;
    frameSource.postMessage({channel:RSVP_CHANNEL,nonce,type:'accept',path:'/animad/'},frameOrigin);
    viewport();return;
  }
  if(event.source!==frameSource||event.origin!==frameOrigin)return;
  if(message.type==='ready') {
    clearTimeout(readyTimer);frame.style.visibility='visible';entryStatus.hidden=true;retryButton.hidden=true;viewport();
  } else if(message.type==='resize'&&Number.isFinite(message.height)&&message.height>=200&&message.height<=6000) {
    frame.style.height=Math.ceil(message.height)+'px';
  } else if(message.type==='focus-editor') {
    editorOpen=true;viewport();
    window.scrollTo({top:Math.max(0,scrollY+frame.getBoundingClientRect().top-16),behavior:'instant'});viewport();
  } else if(message.type==='editor-closed') {
    editorOpen=false;frame.style.minHeight='';viewport();
  } else if(message.type==='failed') {clearTimeout(readyTimer);unavailable();}
});
window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);
window.addEventListener('scroll',()=>{if(editorOpen)viewport();},{passive:true});
retryButton.addEventListener('click',()=>{try{openFrame();}catch{unavailable();}});
async function configureEntry() {
  if(window.top!==window.self||location.origin!==RSVP_ORIGIN||!/^\/animad\/(?:index\.html)?$/.test(location.pathname)) {
    entryStatus.textContent='参加受付は公式イベントページを直接開いてご利用ください。';return;
  }
  try {
    const response=await fetch('./settings.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Settings unavailable');
    settings=await response.json();
    if(settings.registrationReady!==true||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(settings.appsScriptUrl||''))return;
    openFrame();
  } catch {entryStatus.textContent='参加受付の設定を確認できません。このページでは送信を開始していません。';}
}
configureEntry();
