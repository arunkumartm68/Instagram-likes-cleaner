/* Instagram Unlike All — runs only on your own Likes activity page. */
(() => {
  'use strict';
  if (window.__instagramUnlikeAll) { window.__instagramUnlikeAll.show(); return; }
  if (location.hostname !== 'www.instagram.com' || !location.pathname.startsWith('/your_activity/interactions/likes')) {
    alert('Open Instagram → Your activity → Interactions → Likes, then refresh the page.'); return;
  }
  const resumeKey = '__igLikesCleanupExtension_v1';
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(resumeKey) || '{}'); } catch { saved = {}; }
  let refreshing = false, pendingUnlike = false, resumeTimer;
  if (!saved || typeof saved !== 'object') saved = {};
  function persist(active) { sessionStorage.setItem(resumeKey,JSON.stringify({active,total,batches,reloads:saved.reloads || 0})); }
  function disarm() { clearTimeout(resumeTimer); saved.active = false; sessionStorage.removeItem(resumeKey); }
  async function recover() {
    guard();
    if (pendingUnlike) throw new Error('An Unlike action is unconfirmed. Automatic refresh is disabled.');
    if ((saved.reloads || 0) >= 3) throw new Error('Three recovery refreshes made no progress. Stopped; check Instagram before restarting.');
    saved.reloads = (saved.reloads || 0) + 1;
    refreshing = true; persist(true);
    setStatus('No new posts appeared for 20 seconds. Refreshing and resuming automatically…');
    location.reload();
    await new Promise(() => {});
  }
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:18px;top:100px;z-index:2147483647';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>:host{all:initial}*{box-sizing:border-box}.panel{width:310px;background:#fff;color:#18202b;border:1px solid #ccd3dd;border-radius:16px;padding:20px;box-shadow:0 10px 50px #0004;font:14px/1.5 system-ui}h2{font-size:18px;margin:0 0 8px}p{margin:8px 0}button{font:600 14px system-ui;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;margin:8px 6px 0 0;background:#e8edf3;color:#18202b}button.start{background:#b82136;color:white}button:disabled{opacity:.5;cursor:default}.small{font-size:12px;color:#596576}.status{white-space:pre-wrap}</style><div class="panel"><h2>Unlike all Instagram posts</h2><p>Removes likes from every post in this account’s Likes history, including older posts.</p><p class="status">Ready. Keep this tab open while it runs.</p><p class="small">Batches of up to 100. Refreshes after a 20-second loading stall and resumes. Stops on errors or restrictions. Stop takes effect before the next action; an already submitted batch may finish.</p><button class="start">Start unliking all</button><button class="stop" disabled>Stop</button><button class="close">Close</button></div>`;
  document.documentElement.appendChild(host);
  const status = shadow.querySelector('.status'), start = shadow.querySelector('.start'), stop = shadow.querySelector('.stop');
  let running = false, stopping = false, total = Number(saved.total) || 0, batches = Number(saved.batches) || 0, phase = 'Ready';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const text = () => document.body.innerText;
  const selected = () => Number((text().match(/(?:^|\n)\s*(\d+) selected\s*(?:\n|$)/i) || [,'0'])[1]);
  const setStatus = message => { status.textContent = `${total} likes confirmed removed · ${batches} batches\n${message}`; };
  function guard() {
    if (stopping) throw new Error('Stopped. Click Start to continue from the remaining likes.');
    if (!location.pathname.startsWith('/your_activity/interactions/likes')) throw new Error('Stopped because the page changed. Return to your Likes page.');
    if (/try again later|action blocked|we restrict certain activity|please wait a few minutes|something went wrong/i.test(text())) throw new Error('Instagram displayed an error or restriction. Stopped; wait until Instagram allows the action before starting again.');
  }
  async function waitFor(predicate, ms = 12000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) { guard(); const value = predicate(); if (value) return value; await sleep(10); }
    return false;
  }
  function exact(label, root = document) {
    return [...root.querySelectorAll('button,[role="button"],a,span,div')].filter(el => visible(el) && el.textContent.trim() === label && ![...el.children].some(c => c.textContent.trim() === label)).sort((a,b) => Number(b.matches('button,[role="button"]')) - Number(a.matches('button,[role="button"]')))[0];
  }
  const boxes = () => [...document.querySelectorAll('[aria-label="Toggle checkbox"]')].filter(visible);
  async function click(el, resolve) {
    guard(); if (!el || !el.isConnected) throw new Error(`A control was replaced during ${phase}. Stop and restart once the page finishes loading.`);
    el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    await sleep(0); guard();
    if (resolve) el = resolve();
    if (!el || !el.isConnected) throw new Error(`A control was replaced during ${phase}. Stop and restart once the page finishes loading.`);
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  }
  function scrollList() {
    let el = boxes().at(-1);
    if (!el) return false;
    el.scrollIntoView({block:'end',behavior:'instant'});
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (p.scrollHeight > p.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(p).overflowY)) { p.scrollTop = p.scrollHeight; return true; }
    }
    window.scrollTo(0,document.documentElement.scrollHeight); return true;
  }
  async function unlikeBatch() {
    const count = selected(); if (!count) return;
    if (!await waitFor(() => !/You unliked \d+ posts?\.?/i.test(text()),12000)) throw new Error('The previous completion notice did not clear. Stopped to avoid counting it twice.');
    setStatus(`Submitting ${count} selected posts…`);
    phase = 'opening Unlike'; await click(exact('Unlike'));
    if (!await waitFor(() => /Unlike posts\?/.test(text()))) throw new Error('The expected Unlike confirmation did not appear. Stopped.');
    let heading = [...document.querySelectorAll('h1,h2,h3,div,span')].find(el => visible(el) && el.textContent.trim() === 'Unlike posts?' && ![...el.children].some(c => c.textContent.trim() === 'Unlike posts?'));
    let modal = heading?.closest('[role="dialog"]');
    if (!modal) { for (let p = heading?.parentElement; p && p !== document.body; p = p.parentElement) { if (p.textContent.length < 1000 && exact('Cancel',p) && exact('Unlike',p)) { modal = p; break; } } }
    if (!modal) throw new Error('Could not identify the confirmation safely. Stopped.');
    pendingUnlike = true; persist(false);
    phase = 'confirming Unlike'; await click(exact('Unlike',modal));
    const notice = await waitFor(() => text().match(/You unliked (\d+) posts?\.?/i), 30000);
    if (!notice || Number(notice[1]) !== count) throw new Error('Instagram did not confirm this batch’s exact count. Stopped; check the page before restarting.');
    total += count; batches++; pendingUnlike = false; saved.reloads = 0; persist(true); setStatus('Batch confirmed. Waiting for the remaining posts…');
    await sleep(2000);
    if (!await waitFor(() => !/Unlike posts\?/.test(text()) && selected() === 0,20000)) throw new Error('The Likes page did not reset after the batch. Stopped.');
  }
  function emptyHistory() { return /no (?:likes|liked posts|interactions)|you haven.t liked (?:any|anything)|you haven't liked any posts/i.test(text()); }
  async function run() {
    if (running) return;
    running = true; stopping = false; refreshing = false; persist(true); start.disabled = true; stop.disabled = false;
    try {
      while (true) {
        guard();
        if (emptyHistory()) { setStatus('Finished: Instagram reports no liked posts remain.'); break; }
        if (!boxes().length) {
          phase = 'waiting for posts';
          const available = await waitFor(() => emptyHistory() || boxes().length || exact('Select'),20000);
          if (emptyHistory()) continue;
          if (!available) await recover();
          const select = exact('Select');
          if (boxes().length) continue;
          if (!select) { await sleep(1200); guard(); if (emptyHistory()) continue; throw new Error('No post-selection controls found. Make sure Instagram is in English and the Likes page has loaded.'); }
          phase = 'opening selection mode'; await click(select);
          if (!await waitFor(() => boxes().length || emptyHistory(),20000)) await recover();
          if (emptyHistory()) continue;
          await sleep(500);
        }
        let idle = 0, loadingSince = 0;
        while (selected() < 100) {
          guard();
          const before = selected();
          const next = boxes()[before];
          if (!next) {
            const before = boxes().length;
            if (!loadingSince) loadingSince = Date.now();
            scrollList(); await sleep(1000); guard();
            if (boxes().length > before) { idle = 0; loadingSince = 0; continue; }
            setStatus('Waiting for more posts… ' + Math.floor((Date.now()-loadingSince)/1000) + ' / 20 seconds');
            if (Date.now()-loadingSince >= 20000) {
              if (selected()) { await unlikeBatch(); }
              if (emptyHistory()) break;
              await recover();
            }
            continue;
          }
          idle = 0; loadingSince = 0;
          phase = `selecting post ${before + 1}`; await click(next, () => boxes()[before]);
          if (!await waitFor(() => selected() !== before,5000)) throw new Error('A checkbox did not update the selected count. Stopped to avoid uncertain clicks.');
          const after = selected();
          if (after === before - 1) {
            await click(boxes()[before], () => boxes()[before]);
            if (!await waitFor(() => selected() === before,5000)) throw new Error('Could not restore an already selected post. Stopped.');
          } else if (after !== before + 1) throw new Error('The selected count changed unexpectedly. Stopped.');
          saved.reloads = 0;
          setStatus(`Selecting a batch: ${selected()} of 100. Keep this tab open.`);
          await sleep(0);
        }
        if (selected()) { await unlikeBatch(); continue; }
        if (emptyHistory()) { setStatus('Finished: Instagram reports no liked posts remain.'); break; }
        throw new Error('No more selectable posts were found, but Instagram has not confirmed an empty history. Stopped; check or reload the Likes page.');
      }
    } catch (error) { disarm(); setStatus(`${phase}: ${error.message}`); }
    finally { if (!refreshing) disarm(); running = false; start.disabled = false; start.textContent = 'Start / continue'; stop.disabled = true; }
  }
  start.onclick = run;
  stop.onclick = () => { disarm(); stopping = true; setStatus('Stopping before the next action…'); };
  shadow.querySelector('.close').onclick = () => { disarm(); if (running) { stopping = true; setStatus('Stopping. Click Close again after it stops.'); } else { host.remove(); delete window.__instagramUnlikeAll; } };
  if (saved.active) { setStatus('Resuming after page refresh…'); resumeTimer = setTimeout(() => { if (saved.active && host.isConnected) run(); },1000); }
  window.__instagramUnlikeAll = { show:() => { host.style.display = ''; }, stop:() => { disarm(); stopping = true; } };
})();




