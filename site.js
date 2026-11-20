/* Hemesh Raya portfolio: interactions. No dependencies, no sound. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  /* ---------- page transitions ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash) || a.hasAttribute('download') || /\.(pdf|mp4)$/i.test(u.pathname)) return;
    e.preventDefault(); document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, reduce ? 0 : 230);
  });
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  /* ---------- nav + progress ---------- */
  const menu = $('#menu'), links = $('.links');
  if (menu) menu.addEventListener('click', () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); });
  $$('.links a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
  const prog = $('.progress');
  const onScroll = () => { const h = document.documentElement; if (prog) prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + '%'; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el, i) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i % 4) * 0.08 + 's'); io.observe(el); });

  /* ---------- count up ---------- */
  const countIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return; countIO.unobserve(en.target);
    const el = en.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = (end * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); countIO.observe(el); });

  /* ---------- rotating words ---------- */
  const rot = $('[data-rotate]');
  if (rot) {
    const words = rot.dataset.rotate.split('|'); const b = $('b', rot);
    if (reduce) { b.textContent = words[0]; } else {
      let w = 0, i = 0, del = false;
      const tick = () => {
        const word = words[w];
        b.textContent = word.slice(0, i);
        if (!del && i === word.length) { del = true; return setTimeout(tick, 1400); }
        if (del && i === 0) { del = false; w = (w + 1) % words.length; }
        i += del ? -1 : 1; setTimeout(tick, del ? 38 : 75);
      };
      tick();
    }
  }

  /* ---------- pointer effects (desktop only) ---------- */
  if (fine && !reduce) {
    $$('.glass').forEach((el) => el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true }));
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('.btn.primary').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 8}px, ${((e.clientY - r.top) / r.height - 0.5) * 6 - 2}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const glow = $('.cursor-glow');
    if (glow) addEventListener('pointermove', (e) => { glow.style.opacity = 1; glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; }, { passive: true });
    const big = $('.big-word');
    if (big) addEventListener('scroll', () => { big.style.transform = `translateX(-50%) translateY(${scrollY * 0.25}px)`; }, { passive: true });
  }

  /* ---------- animated chats ---------- */
  const runs = new WeakMap();
  const playChat = async (chat) => {
    const body = $('.body', chat); const token = Symbol(); runs.set(chat, token);
    const items = $$(':scope > .msg, :scope > .toolcall, :scope > .sys', body);
    items.forEach((m) => m.classList.remove('show')); $$('.typing', body).forEach((t) => t.remove());
    for (const m of items) {
      if (runs.get(chat) !== token) return;
      if (m.classList.contains('r')) {
        const t = document.createElement('div'); t.className = 'msg u typing show'; t.innerHTML = '<i></i><i></i><i></i>'; t.style.background = 'transparent'; body.insertBefore(t, m);
        await wait(850); t.remove(); if (runs.get(chat) !== token) return;
      }
      await wait(m.classList.contains('toolcall') || m.classList.contains('sys') ? 250 : 350);
      m.classList.add('show'); await wait(m.classList.contains('toolcall') ? 700 : 950);
    }
  };
  const chatIO = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting && x.target.offsetParent !== null && !x.target.dataset.played) { x.target.dataset.played = '1'; playChat(x.target); } }), { threshold: 0.4 });
  $$('.chat').forEach((c) => chatIO.observe(c));
  $$('[data-replay]').forEach((b) => b.addEventListener('click', () => { const c = $('.chat', b.closest('.panel') || document); if (c) playChat(c); }));

  /* ---------- tabs (interactive demo) ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role=tab]', root), panels = $$('.panel', root.parentElement);
    const show = (id) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.panel === id)));
      panels.forEach((p) => { const on = p.id === id; p.classList.toggle('on', on); if (on) { const c = $('.chat', p); if (c) { c.dataset.played = '1'; playChat(c); } } });
    };
    tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.panel)));
  });

  /* ---------- tenant switch ---------- */
  $$('[data-tenants]').forEach((root) => {
    const data = JSON.parse(root.dataset.tenants); const body = $('tbody', root); const note = $('.who', root);
    const draw = (k) => {
      $$('[data-t]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === k)));
      body.innerHTML = data[k].rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
      if (note) note.textContent = data[k].name;
    };
    $$('[data-t]', root).forEach((b) => b.addEventListener('click', () => draw(b.dataset.t)));
    draw(Object.keys(data)[0]);
  });

  /* ---------- video chapters ---------- */
  const vids = $$('.player video');
  vids.forEach((v) => v.addEventListener('play', () => vids.forEach((o) => { if (o !== v) o.pause(); })));
  $$('.demo').forEach((demo) => {
    const v = $('video', demo); if (!v) return; const btns = $$('.chapters button', demo);
    btns.forEach((b) => b.addEventListener('click', () => { v.currentTime = parseFloat(b.dataset.t); v.play().catch(() => {}); }));
    v.addEventListener('timeupdate', () => {
      let cur = 0; btns.forEach((b, i) => { if (v.currentTime + 0.2 >= parseFloat(b.dataset.t)) cur = i; });
      btns.forEach((b, i) => b.classList.toggle('on', i === cur && !v.paused));
    });
  });

  /* ---------- lightbox ---------- */
  const lb = $('.lb');
  if (lb) {
    const img = $('img', lb);
    const open = (src, alt) => { img.src = src; img.alt = alt || ''; lb.classList.add('open'); };
    const close = () => lb.classList.remove('open');
    $$('[data-zoom]').forEach((el) => { el.tabIndex = 0; const go = () => { const i = $('img', el); open(i.currentSrc || i.src, i.alt); }; el.addEventListener('click', go); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    lb.addEventListener('click', close); addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(b.dataset.copy); const t = b.querySelector('span'); const old = t.textContent; t.textContent = 'Copied!'; setTimeout(() => { t.textContent = old; }, 1600); e.preventDefault(); } catch { /* falls back to mailto */ }
  }));
})();
