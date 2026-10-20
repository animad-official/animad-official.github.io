(() => {
'use strict';
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const config=String(window.ANIMAD_RSVP_API||'').replace(/\/$/,'');
const safeApi=/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(config)||/^https:\/\/rsvp-api\.[a-z0-9.-]+$/i.test(config);
let ready=false,attendees=[],filter='all',currentEdit=null,createPendingId=null,editPendingId=null,creating=false,editing=false;
const form=$('#register-form'),editForm=$('#edit-form'),dialog=$('#edit-dialog');
function message(id,text,isError=false){const el=$(id);el.hidden=!text;el.textContent=text||'';el.classList.toggle('error',Boolean(isError));}
const uid=()=>crypto.randomUUID();
async function call(path,init={}){
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),20000);
  try {
    const response=await fetch(config+path,{...init,signal:ctrl.signal,cache:'no-store',headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}});
    let result;try{result=await response.json();}catch{throw new Error('サーバーから正しい応答を受信できませんでした。');}
    if(!response.ok||!result.ok)throw new Error(result.error||'通信に失敗しました。');
    return result;
  }catch(e){if(e.name==='AbortError')throw new Error('通信がタイムアウトしました。再読み込みして確認してください。');throw e;}
  finally{clearTimeout(timeout);}
}
function values(form){const f=new FormData(form);return {status:String(f.get('status')||''),name:String(f.get('name')||'').trim(),pin:String(f.get('pin')||''),x:String(f.get('x')||'').trim(),instagram:String(f.get('instagram')||'').trim(),comment:String(f.get('comment')||'').trim()};}
function check(v){if(!v.name||Array.from(v.name).length>40)throw new Error('名前は1〜40文字で入力してください。');if(!/^[0-9]{4}$/.test(v.pin))throw new Error('編集用パスは半角数字4桁で入力してください。');if(!['going','interested'].includes(v.status))throw new Error('参加区分を選択してください。');if(Array.from(v.comment).length>120)throw new Error('ひとことは120文字以内で入力してください。');}
function text(tag,s,klass){const e=document.createElement(tag);e.textContent=String(s??'');if(klass)e.className=klass;return e;}
function anchor(provider,id){if(!id)return null;const a=document.createElement('a');a.href=provider==='X'?`https://x.com/${encodeURIComponent(id)}`:`https://www.instagram.com/${encodeURIComponent(id)}/`;a.textContent=(provider==='X'?'X ':'IG ')+'@'+id;a.target='_blank';a.rel='noopener noreferrer';return a;}
function render(){
  const count=(status)=>attendees.filter(a=>a.status===status).length;
  $('#going-count').textContent=count('going');$('#interested-count').textContent=count('interested');
  const search=$('#attendee-search').value.trim().toLowerCase();
  const matches=attendees.filter(a=>(filter==='all'||a.status===filter)&&(!search||a.name.toLowerCase().includes(search)||a.id.toLowerCase().includes(search)));
  const container=$('#attendee-list');container.replaceChildren();
  if(!matches.length)container.append(text('p','該当する参加表明はありません。','privacy-help'));
  for(const a of matches){
    const item=text('article','','attendee-item');
    const avatar=text('div',Array.from(a.name)[0]||'?',`avatar${a.status==='interested'?' interested':''}`);avatar.setAttribute('aria-hidden','true');
    const content=text('div','','attendee-content');
    const top=text('div','','attendee-top');top.append(text('strong',a.name,'attendee-name'));top.append(text('span',a.status==='going'?'参加する':'興味あり',`status-tag${a.status==='interested'?' interested':''}`));content.append(top);
    if(a.x||a.instagram){const social=text('div','','social');for(const el of [anchor('X',a.x),anchor('IG',a.instagram)])if(el)social.append(el);content.append(social);}
    if(a.comment)content.append(text('p',a.comment,'comment'));
    const footer=text('div','','attendee-footer');footer.append(text('span','受付 '+a.id.slice(0,8),'receipt-short'));
    const edit=text('button','編集');edit.type='button';edit.addEventListener('click',()=>openEdit(a));footer.append(edit);content.append(footer);item.append(avatar,content);container.append(item);
  }
  message('#list-message','');
}
async function load(){try{message('#list-message','一覧を読み込んでいます…');const r=await call('/attendees');attendees=r.data.attendees;ready=Boolean(r.data.registrationOpen);$('#register-submit').disabled=!ready;message('#connection-status',ready?'参加表明を受け付けています。':'参加受付は現在準備中です。');render();}catch(e){ready=false;$('#register-submit').disabled=true;message('#connection-status',e.message,true);message('#list-message','一覧を取得できませんでした。更新ボタンから再試行してください。',true);}}
function openEdit(a){currentEdit=a;editPendingId=null;editForm.reset();for(const key of ['name','status','x','instagram','comment']){const input=editForm.elements.namedItem(key);if(key==='status'){const radio=$(`input[name="status"][value="${a.status}"]`,editForm);radio.checked=true;}else input.value=a[key]||'';}message('#edit-message','');dialog.showModal();}
$('#close-edit').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
$('#register-form').addEventListener('input',()=>{if(!creating)createPendingId=null;});
form.addEventListener('submit',async e=>{
  e.preventDefault();if(!ready||creating)return;
  let v;try{v=values(form);check(v);}catch(err){message('#register-message',err.message,true);return;}
  creating=true;$('#register-submit').disabled=true;message('#register-message','送信しています…');createPendingId||=uid();
  try{const r=await call('/attendees',{method:'POST',body:JSON.stringify({...v,requestId:createPendingId})});
    $('#receipt-id').textContent=r.data.attendee.id;form.hidden=true;$('#registration-success').hidden=false;$('#registration-success').focus();createPendingId=null;message('#register-message','');await load();
  }catch(err){message('#register-message',err.message+' すでに登録されている可能性があるため、一覧を確認してから再送してください。',true);}
  finally{creating=false;$('#register-submit').disabled=!ready;}
});
$('#new-registration').addEventListener('click',()=>{form.hidden=false;form.reset();$('#registration-success').hidden=true;message('#register-message','');$('#register-form').scrollIntoView({behavior:'smooth'});});
$('#copy-receipt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#receipt-id').textContent);$('#copy-receipt').textContent='コピーしました';}catch{$('#copy-receipt').textContent='受付番号を選択してコピーしてください';}});
editForm.addEventListener('input',()=>{if(!editing)editPendingId=null;});
editForm.addEventListener('submit',async e=>{
  e.preventDefault();if(!ready||editing||!currentEdit)return;
  let v;try{v=values(editForm);check(v);}catch(err){message('#edit-message',err.message,true);return;}
  editing=true;$('#edit-submit').disabled=true;editPendingId||=uid();message('#edit-message','変更を保存しています…');
  try{await call('/attendees/'+encodeURIComponent(currentEdit.id),{method:'PATCH',body:JSON.stringify({...v,version:currentEdit.version,requestId:editPendingId})});editPendingId=null;dialog.close();await load();$('#attendees').scrollIntoView({behavior:'smooth'});}
  catch(err){message('#edit-message',err.message,true);}
  finally{editing=false;$('#edit-submit').disabled=false;}
});
$('#refresh-list').addEventListener('click',load);
$('#attendee-search').addEventListener('input',render);
for(const button of $$('.filters button'))button.addEventListener('click',()=>{filter=button.dataset.filter;$$('.filters button').forEach(x=>x.classList.toggle('active',x===button));render();});
if(!safeApi){message('#connection-status','受付APIの設定がまだ完了していません。公開前の準備中です。',true);message('#list-message','');}
else load();
})();
