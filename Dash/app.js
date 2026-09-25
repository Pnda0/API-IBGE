/* Brasil em Números — lógica do painel.
   Fluxo: boot() → DataLayer.carregar() (data.js) → setData() → renderAll().
   Os filtros (região, indicador, ordenação, busca) rodam no navegador sobre as 27 UFs. */
(() => {
  'use strict';

  /* ---------- utilidades ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const nf = new Intl.NumberFormat('pt-BR');
  const fx = (v, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const f1 = v => fx(v, 1);
  const mi = v => f1(v / 1e6);
  const brl = v => 'R$ ' + nf.format(Math.round(v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tipAttr = h => h.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const pct = (a, b) => b ? (a / b - 1) * 100 : 0;
  const sgn = d => (d >= 0 ? '+' : '−') + f1(Math.abs(d)) + '%';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- constantes de apresentação ---------- */
  // Ordem fixa das regiões = ordem das cores --c1…--c5 no CSS.
  const REG = {
    SE: { n: 'Sudeste', c: '--c1', slug: 'sudeste' },
    NE: { n: 'Nordeste', c: '--c2', slug: 'nordeste' },
    S: { n: 'Sul', c: '--c3', slug: 'sul' },
    N: { n: 'Norte', c: '--c4', slug: 'norte' },
    CO: { n: 'Centro-Oeste', c: '--c5', slug: 'centro-oeste' }
  };
  // Posição de cada UF no cartograma (coluna, linha). É desenho, não dado da API.
  const POS = {
    RR: [1, 0], AP: [3, 0],
    AM: [1, 1], PA: [2, 1], MA: [3, 1], PI: [4, 1], CE: [5, 1], RN: [6, 1],
    AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], BA: [4, 2], PB: [6, 2],
    MS: [2, 3], GO: [3, 3], DF: [4, 3], PE: [6, 3],
    SP: [3, 4], MG: [4, 4], ES: [5, 4], AL: [6, 4],
    PR: [3, 5], RJ: [4, 5], SE: [6, 5],
    SC: [3, 6], RS: [3, 7]
  };
  const PEA_PADRAO = .53; // parcela da população na força de trabalho, usada só se a API não informar

  const METRICS = {
    pop: { label: 'População', get: u => u.p, tile: v => mi(v), full: v => mi(v) + ' mi', param: 'populacao', sub: 'habitantes, Censo 2022' },
    rpc: { label: 'Renda per capita', get: u => u.rpc, tile: v => nf.format(Math.round(v)), full: brl, param: 'renda_per_capita', sub: 'rendimento domiciliar per capita' },
    tx: { label: 'Desocupação', get: u => u.tx, tile: v => f1(v) + '%', full: v => f1(v) + '%', param: 'taxa_desocupacao', sub: 'taxa de desocupação' }
  };

  /* ---------- estado ---------- */
  let UFS = [], BY = {}, BR = null, RA = {}, CENSOS = [], SERIES = {}, BIN = {}, RANK = {}, FONTE = 'mock';
  const state = { reg: 'all', metric: 'pop', rmode: 'rpc', sel: null, focus: null, sort: { k: 'p', d: -1 }, q: '' };
  const inReg = u => state.reg === 'all' || u.r === state.reg;
  const dim = k => (state.reg === 'all' || state.reg === k) ? '' : ' is-dim';

  function agg(list) {
    const p = list.reduce((s, u) => s + u.p, 0);
    const w = k => p ? list.reduce((s, u) => s + u.p * u[k], 0) / p : 0;
    const pea = list.reduce((s, u) => s + (u.pea ?? u.p * PEA_PADRAO), 0);
    const deso = list.reduce((s, u) => s + (u.deso ?? (u.pea ?? u.p * PEA_PADRAO) * u.tx / 100), 0);
    return { p, n: list.length, m: list.reduce((s, u) => s + u.m, 0), rpc: w('rpc'), rmt: w('rmt'), pea, deso, tx: pea ? deso / pea * 100 : 0 };
  }

  function setData(raw) {
    UFS = raw.ufs.map(u => { const [x, y] = POS[u.u] || [0, 0]; return { ...u, x, y }; })
      .sort((a, b) => b.p - a.p);
    BY = Object.fromEntries(UFS.map(u => [u.u, u]));
    BR = agg(UFS);
    RA = Object.fromEntries(Object.keys(REG).map(k => [k, agg(UFS.filter(u => u.r === k))]));
    CENSOS = raw.censos || [];
    SERIES = raw.series || {};
    for (const k in METRICS) {
      const asc = [...UFS].sort((a, b) => METRICS[k].get(a) - METRICS[k].get(b));
      BIN[k] = {}; asc.forEach((u, i) => BIN[k][u.u] = Math.min(6, Math.floor(i * 7 / asc.length)));
      RANK[k] = {}; [...asc].reverse().forEach((u, i) => RANK[k][u.u] = i + 1);
    }
    if (!BY[state.sel]) state.sel = UFS[0].u;
    state.focus = state.sel;
  }

  /* ---------- gráficos: peças pequenas ---------- */
  // Curva suave (Catmull-Rom → Bézier) sem ultrapassar os pontos vizinhos.
  function smooth(pts) {
    if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = .18;
      const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
      const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) * t));
      const c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) * t));
      d += `C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${c1y.toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  let gradId = 0;
  const gradDef = id => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.26"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>`;

  function spark(vals, w = 280, h = 60) {
    if (!vals || vals.length < 2) return '';
    const pl = 4, pr = 10, pt = 10, pb = 8, n = vals.length, mn = Math.min(...vals), mx = Math.max(...vals);
    const x = i => pl + i * (w - pl - pr) / (n - 1), y = v => pt + (1 - (v - mn) / ((mx - mn) || 1)) * (h - pt - pb);
    const pts = vals.map((v, i) => [x(i), y(v)]), d = smooth(pts), last = pts[n - 1], id = 'sg' + (++gradId);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">${gradDef(id)}<path d="${d}L${last[0]},${h}L${pts[0][0]},${h}Z" fill="url(#${id})"/><path class="ln" d="${d}"/><circle class="halo" cx="${last[0]}" cy="${last[1]}" r="9"/><circle class="dt" cx="${last[0]}" cy="${last[1]}" r="4.5"/></svg>`;
  }

  function delta(d, goodWhenUp, label) {
    if (d == null || !isFinite(d)) return '';
    const good = (d >= 0) === goodWhenUp;
    return `<span class="delta ${good ? 'good' : 'bad'}">${d >= 0 ? '▲' : '▼'} ${sgn(d).slice(1)}</span><span>${label}</span>`;
  }
  const chg = (s, back = 1) => s && s.length > back ? pct(s[s.length - 1].v, s[s.length - 1 - back].v) : null;
  const vsMedia = (v, b) => `<span>${Math.abs(pct(v, b)).toFixed(0)}% ${v >= b ? 'acima' : 'abaixo'} da média nacional</span>`;

  /* ---------- números que "contam" até o valor ---------- */
  const lastVals = {};
  function animateNums(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', key = el.dataset.key;
      const from = lastVals[key] ?? 0; lastVals[key] = to;
      const fmt = v => pre + fx(v, dec);
      if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
      const t0 = performance.now(), dur = 800;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- indicadores (faixa de cartões) ---------- */
  function censusChart() {
    if (!CENSOS.length) return '';
    const mx = Math.max(...CENSOS.map(c => c.p)), H = 158;
    return `<div class="cols">${CENSOS.map((c, i) => `<div class="col${i === CENSOS.length - 1 ? ' last' : ''}" data-tip="${tipAttr(`<b>Censo ${c.ano}</b><br>${f1(c.p / 1e6)} milhões de habitantes`)}"><span>${f1(c.p / 1e6)}</span><i style="height:${Math.max(6, c.p / mx * H)}px"></i></div>`).join('')}</div>
    <div class="years">${CENSOS.map(c => `<span>${c.ano}</span>`).join('')}</div>`;
  }

  function kpiMoney(id, label, val, serie, key, all, base) {
    const d = chg(serie, 1);
    $(id).innerHTML = `<div class="lbl">${label}</div>
      <div class="val"><span data-count="${Math.round(val)}" data-prefix="R$ " data-key="${key}">${brl(val)}</span></div>
      <div class="sub">${all ? (d != null ? delta(d, true, 'vs ano anterior') : '') : vsMedia(val, base)}</div>
      ${serie && serie.length > 1 ? spark(serie.map(p => p.v)) : ''}`;
  }

  function renderKpis() {
    const L = UFS.filter(inReg), a = agg(L), all = state.reg === 'all';
    const ult = CENSOS[CENSOS.length - 1], ant = CENSOS[CENSOS.length - 2];

    $('#cPop').innerHTML = `<div class="lbl">População residente${ult ? `<span class="tag">Censo ${ult.ano}</span>` : ''}</div>
      <div class="hero-num"><span data-count="${a.p / 1e6}" data-dec="1" data-key="pop">${mi(a.p)}</span><small>milhões</small></div>
      <div class="sub">${all ? (ult && ant ? delta(pct(ult.p, ant.p), true, 'desde o Censo ' + ant.ano) : '') : `<span>${f1(a.p / BR.p * 100)}% da população do país</span>`}</div>
      ${censusChart()}`;

    $('#cTerr').innerHTML = `<div class="lbl">Territórios</div>
      <div class="val"><span data-count="${a.n}" data-key="uf">${a.n}</span><small>UFs</small></div>
      <div class="sub">${nf.format(a.m)} municípios</div>
      <div class="uf-dots" aria-hidden="true">${Object.keys(REG).flatMap(k => UFS.filter(u => u.r === k)).map(u => `<i class="${inReg(u) ? '' : 'is-dim'}" style="background:var(${REG[u.r].c})" data-tip="${tipAttr(`<b>${esc(u.n)}</b><br>${REG[u.r].n}`)}"></i>`).join('')}</div>`;

    kpiMoney('#cRpc', 'Renda domiciliar per capita', a.rpc, SERIES.rpc, 'rpc', all, BR.rpc);
    kpiMoney('#cRmt', 'Rendimento médio mensal', a.rmt, SERIES.rmt, 'rmt', all, BR.rmt);

    const sTx = SERIES.tx || [], dtx = chg(sTx, 4);
    $('#cDes').innerHTML = `<div class="lbl">Pessoas desocupadas</div>
      <div class="val"><span data-count="${a.deso / 1e6}" data-dec="1" data-key="des">${mi(a.deso)}</span><small>mi</small></div>
      <div class="sub"><b>${f1(a.tx)}%</b><span>da força de trabalho</span></div>
      <div class="sub">${all && dtx != null ? delta(dtx, false, 'vs ' + sTx[sTx.length - 5].k) : ''}</div>
      ${sTx.length > 1 ? spark(sTx.map(p => p.v)) : ''}`;
    animateNums($('#bento'));
  }

  /* ---------- mapa e ranking ---------- */
  function renderMap() {
    const M = METRICS[state.metric];
    $('#tiles').innerHTML = UFS.map(u => `<button type="button" class="tile t${BIN[state.metric][u.u]}${inReg(u) ? '' : ' is-dim'}" style="grid-column:${u.x + 1};grid-row:${u.y + 1}" data-uf="${u.u}" data-sel="${u.u}" data-tip="${tipAttr(`<b>${esc(u.n)}</b><br>${M.full(M.get(u))}`)}" aria-label="${esc(u.n)}: ${M.full(M.get(u))}" aria-pressed="${state.sel === u.u}"><b>${u.u}</b><small>${M.tile(M.get(u))}</small></button>`).join('');
    const vals = UFS.map(M.get);
    $('#ramp').innerHTML = `<span>${M.full(Math.min(...vals))}</span><span class="sw">${[0, 1, 2, 3, 4, 5, 6].map(i => `<i class="t${i}"></i>`).join('')}</span><span>${M.full(Math.max(...vals))}</span>`;
    renderDetail();
  }
  function renderDetail() {
    const u = BY[state.focus]; if (!u) return;
    const k = state.metric, st = (key, label, val) => `<div class="${k === key ? 'on' : ''}"><b>${val}</b>${label}</div>`;
    $('#detail').innerHTML = `<div class="detail-name"><i class="dot" style="background:var(${REG[u.r].c})"></i>${esc(u.n)}<span class="r">${REG[u.r].n} · ${RANK[k][u.u]}º de ${UFS.length} em ${METRICS[k].label.toLowerCase()}</span></div>
      <div class="detail-stats">${st('pop', 'habitantes', mi(u.p) + ' mi')}<div><b>${nf.format(u.m)}</b>municípios</div>${st('rpc', 'renda per capita', brl(u.rpc))}${st('tx', 'desocupação', f1(u.tx) + '%')}</div>`;
  }
  function applyFocus() {
    $$('[data-uf]').forEach(el => el.classList.toggle('is-focus', el.dataset.uf === state.focus));
  }
  function renderRank() {
    const M = METRICS[state.metric];
    const list = UFS.filter(inReg).sort((a, b) => M.get(b) - M.get(a)).slice(0, 14);
    const mx = Math.max(...list.map(M.get)) || 1;
    $('#rankTitle').textContent = 'Ranking · ' + M.label;
    $('#rankSub').textContent = (state.reg === 'all' ? 'As 14 primeiras do país' : 'UFs do ' + REG[state.reg].n) + ' · ' + M.sub;
    $('#rank').innerHTML = list.map(u => `<button type="button" class="rk" data-uf="${u.u}" data-sel="${u.u}" data-tip="${tipAttr(`<b>${esc(u.n)}</b><br>${M.full(M.get(u))}`)}"><span class="rk-n">${RANK[state.metric][u.u]}</span><span class="rk-name">${esc(u.n)}</span><span class="rk-track"><i style="width:${M.get(u) / mx * 100}%"></i></span><span class="rk-val">${M.full(M.get(u))}</span></button>`).join('');
  }

  /* ---------- renda, trabalho, regiões ---------- */
  function renderIncome() {
    const key = state.rmode;
    $('#rendaSub').textContent = key === 'rpc' ? 'Rendimento domiciliar per capita' : 'Rendimento médio mensal do trabalho';
    const rows = Object.keys(REG).map(k => ({ k, v: RA[k][key] })).sort((a, b) => b.v - a.v);
    const mx = Math.max(...rows.map(r => r.v)) * 1.08 || 1, hi = rows[0], lo = rows[rows.length - 1];
    $('#rendaRef').innerHTML = `<u></u>Média do Brasil · <b>${brl(BR[key])}</b>`;
    $('#irows').innerHTML = rows.map(r => `<div class="ir${dim(r.k)}" data-tip="${tipAttr(`<b>${REG[r.k].n}</b><br>${brl(r.v)} · ${Math.abs(pct(r.v, BR[key])).toFixed(0)}% ${r.v >= BR[key] ? 'acima' : 'abaixo'} da média`)}"><span class="ir-name"><i class="dot" style="background:var(${REG[r.k].c})"></i>${REG[r.k].n}</span><span class="ir-track"><i class="bar" style="width:${r.v / mx * 100}%"></i><u class="ref" style="left:${BR[key] / mx * 100}%"></u></span><span class="ir-val">${brl(r.v)}</span></div>`).join('');
    $('#insight').innerHTML = lo.v ? `<b>${REG[hi.k].n}</b> lidera ${key === 'rpc' ? 'em renda per capita' : 'em rendimento do trabalho'}: <b>${f1(hi.v / lo.v)}×</b> o valor do ${REG[lo.k].n}.` : '';
  }

  function renderTrendText() {
    const s = SERIES.tx || [], last = s[s.length - 1];
    $('#bigTrab').innerHTML = `<div><span class="n">${f1(last ? last.v : BR.tx)}<small>%</small></span><span class="l">${last ? 'taxa em ' + last.k : 'taxa de desocupação'}</span></div><div><span class="n">${mi(BR.deso)}<small>mi</small></span><span class="l">pessoas desocupadas</span></div>`;
    const rows = Object.keys(REG).map(k => ({ k, v: RA[k].tx })).sort((a, b) => b.v - a.v);
    const mx = Math.max(...rows.map(r => r.v)) * 1.15 || 1;
    $('#mini').innerHTML = `<div class="mini-h">Taxa por região</div>` + rows.map(r => `<div class="mr${dim(r.k)}" data-tip="${tipAttr(`<b>${REG[r.k].n}</b><br>${f1(r.v)}% · ${mi(RA[r.k].deso)} mi desocupados`)}"><span class="nm"><i class="dot" style="background:var(${REG[r.k].c})"></i>${REG[r.k].n}</span><span class="tr"><i style="width:${r.v / mx * 100}%"></i></span><b>${f1(r.v)}%</b></div>`).join('');
  }

  function drawTrend() {
    const el = $('#trend'), s = SERIES.tx || [];
    if (s.length < 2) { el.innerHTML = '<div class="empty">Sem série histórica para exibir.</div>'; return; }
    const v = s.map(p => p.v), n = s.length, W = Math.max(240, el.clientWidth), H = 210;
    const m = { l: 34, r: 52, t: 16, b: 28 };
    const lo = Math.max(0, Math.floor(Math.min(...v)) - 1), hi = Math.ceil(Math.max(...v)) + 1, step = hi - lo > 6 ? 2 : 1;
    const x = i => m.l + i * (W - m.l - m.r) / (n - 1), y = val => m.t + (1 - (val - lo) / (hi - lo)) * (H - m.t - m.b);
    const id = 'tg' + (++gradId);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${gradDef(id)}`;
    for (let t = lo; t <= hi; t += step) svg += `<line class="${t === lo ? 'ax' : 'gl'}" x1="${m.l}" x2="${W - m.r + 10}" y1="${y(t)}" y2="${y(t)}"/><text class="tx" x="${m.l - 10}" y="${y(t) + 4}" text-anchor="end">${t}%</text>`;
    s.forEach((p, i) => { if (i % 3 === 0 || i === n - 1) svg += `<text class="tx" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(p.k)}</text>`; });
    const pts = v.map((val, i) => [x(i), y(val)]), d = smooth(pts), last = pts[n - 1];
    svg += `<path d="${d}L${last[0]},${y(lo)}L${pts[0][0]},${y(lo)}Z" fill="url(#${id})"/><path class="ln" d="${d}"/>`;
    svg += `<g id="xh" style="display:none"><line class="xh" y1="${m.t}" y2="${y(lo)}"/><circle class="dt" r="5"/></g>`;
    svg += `<circle class="halo" cx="${last[0]}" cy="${last[1]}" r="10"/><circle class="dt" cx="${last[0]}" cy="${last[1]}" r="5"/><text class="tx-end" x="${last[0] + 14}" y="${last[1] + 5}">${f1(v[n - 1])}%</text>`;
    svg += `<rect x="${m.l}" y="0" width="${W - m.l - m.r + 10}" height="${H - m.b}" fill="transparent" id="hit"/></svg>`;
    el.innerHTML = svg;
    const root = el.querySelector('svg'), g = root.querySelector('#xh'), hit = root.querySelector('#hit');
    hit.addEventListener('mousemove', e => {
      const r = root.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - m.l) / ((W - m.l - m.r) / (n - 1)))));
      g.style.display = '';
      const ln = g.querySelector('line'); ln.setAttribute('x1', x(i)); ln.setAttribute('x2', x(i));
      const c = g.querySelector('circle'); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(v[i]));
      showTip(`<b>${esc(s[i].k)}</b><br>${f1(v[i])}% de desocupação`, e.clientX, e.clientY);
    });
    hit.addEventListener('mouseleave', () => { g.style.display = 'none'; hideTip(); });
  }

  function renderRegions() {
    const rows = Object.keys(REG).map(k => ({ k, p: RA[k].p, m: RA[k].m })).sort((a, b) => b.p - a.p);
    $('#stack').innerHTML = rows.map(r => `<i style="width:${r.p / BR.p * 100}%;background:var(${REG[r.k].c});${state.reg === 'all' || state.reg === r.k ? '' : 'opacity:.25'}" data-tip="${tipAttr(`<b>${REG[r.k].n}</b><br>${mi(r.p)} mi · ${f1(r.p / BR.p * 100)}%`)}"></i>`).join('');
    $('#leg').innerHTML = rows.map(r => `<div class="lg${dim(r.k)}"><span class="nm"><i class="dot" style="background:var(${REG[r.k].c})"></i>${REG[r.k].n}</span><span class="v">${mi(r.p)} mi</span><b>${f1(r.p / BR.p * 100)}%</b></div>`).join('');
    const byM = [...rows].sort((a, b) => b.m - a.m), mx = byM[0].m || 1;
    $('#munis').innerHTML = `<div class="mini-h">Municípios por região</div>` + byM.map(r => `<div class="mr${dim(r.k)}" data-tip="${tipAttr(`<b>${REG[r.k].n}</b><br>${nf.format(r.m)} municípios`)}"><span class="nm"><i class="dot" style="background:var(${REG[r.k].c})"></i>${REG[r.k].n}</span><span class="tr"><i style="width:${r.m / mx * 100}%"></i></span><b>${nf.format(r.m)}</b></div>`).join('');
  }

  /* ---------- tabela ---------- */
  function renderTable() {
    const { k, d } = state.sort, q = state.q.trim().toLowerCase();
    const list = UFS.filter(inReg).filter(u => !q || u.n.toLowerCase().includes(q) || u.u.toLowerCase() === q || REG[u.r].n.toLowerCase().includes(q))
      .sort((a, b) => k === 'n' ? d * a.n.localeCompare(b.n, 'pt-BR') : k === 'r' ? d * REG[a.r].n.localeCompare(REG[b.r].n, 'pt-BR') : d * (a[k] - b[k]));
    const cols = [['n', 'UF'], ['r', 'Região'], ['p', 'População'], ['m', 'Municípios'], ['rpc', 'Renda per capita'], ['rmt', 'Rend. mensal'], ['tx', 'Desocupação']];
    const mx = Math.max(...UFS.map(u => u.p)) || 1;
    $('#tblCount').textContent = `${list.length} de ${UFS.length} UFs${state.reg === 'all' ? '' : ' · ' + REG[state.reg].n}`;
    $('#tbl').innerHTML = `<thead><tr>${cols.map(([c, l]) => `<th scope="col"${k === c ? ` aria-sort="${d < 0 ? 'descending' : 'ascending'}"` : ''}><button type="button" data-sort="${c}">${l}</button></th>`).join('')}</tr></thead><tbody>${
      list.length ? list.map(u => `<tr><td><span class="uf">${u.u}</span>${esc(u.n)}</td><td><span class="r"><i class="dot" style="background:var(${REG[u.r].c})"></i>${REG[u.r].n}</span></td><td><span class="pb"><i style="width:${u.p / mx * 96}px"></i>${nf.format(u.p)}</span></td><td>${nf.format(u.m)}</td><td>${brl(u.rpc)}</td><td>${brl(u.rmt)}</td><td>${f1(u.tx)}%</td></tr>`).join('')
        : `<tr><td colspan="7" class="empty">Nenhuma UF encontrada para “${esc(state.q)}”.</td></tr>`}</tbody>`;
  }

  /* ---------- cabeçalho, controles, status ---------- */
  function renderReq() {
    const p = [];
    if (state.reg !== 'all') p.push('regiao=' + REG[state.reg].slug);
    p.push('indicador=' + METRICS[state.metric].param);
    $('#req').innerHTML = `<b>GET</b>/v1/ufs?${p.join('&amp;')}`;
  }
  function placeThumb(seg) {
    const b = seg.querySelector('[aria-pressed="true"]'), th = seg.querySelector('.thumb');
    if (!b || !th || !b.offsetWidth) return;
    th.style.width = b.offsetWidth + 'px';
    th.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  const syncSegs = () => $$('.seg').forEach(placeThumb);
  function syncPressed() {
    $$('#regSeg [data-reg]').forEach(b => b.setAttribute('aria-pressed', b.dataset.reg === state.reg));
    $$('#metricSeg [data-metric]').forEach(b => b.setAttribute('aria-pressed', b.dataset.metric === state.metric));
    $$('#rendaSeg [data-rmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rmode === state.rmode));
    syncSegs();
  }
  function setStatus(estado, erro) {
    const el = $('#status');
    el.dataset.state = estado;
    el.querySelector('span').textContent = { loading: 'Carregando…', mock: 'Dados de exemplo', api: 'API conectada', fallback: 'API indisponível · exemplo' }[estado];
    el.title = erro ? String(erro.message || erro) : '';
  }
  function updateNote(raw) {
    const note = $('#note');
    if (raw.fonte === 'api') note.textContent = 'Dados fornecidos pela API configurada em config.js.';
    else if (raw.fonte === 'fallback') note.innerHTML = 'A API não respondeu, então o painel mostra dados de exemplo. Motivo: ' + esc(raw.erro && raw.erro.message || 'desconhecido');
    else note.innerHTML = 'Dados de exemplo para validar o layout. Aponte o painel para a sua API em <code>config.js</code>.';
  }

  function renderAll() {
    renderKpis(); renderMap(); renderRank(); renderIncome(); renderTrendText(); drawTrend(); renderRegions(); renderTable(); renderReq();
    syncPressed(); applyFocus();
  }

  /* ---------- tooltip ---------- */
  const tip = $('#tip');
  function showTip(html, cx, cy) {
    tip.innerHTML = html; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = cx + 16, y = cy + 18;
    if (x + w > innerWidth - 8) x = cx - w - 16;
    if (y + h > innerHeight - 8) y = cy - h - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- eventos ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-reg],[data-metric],[data-rmode],[data-sel],[data-sort]');
    if (!t) return;
    if (t.dataset.reg) {
      state.reg = t.dataset.reg;
      if (state.reg !== 'all' && BY[state.sel].r !== state.reg) state.sel = UFS.find(inReg).u;
      state.focus = state.sel;
      renderAll();
      t.scrollIntoView({ inline: 'center', block: 'nearest' });
    } else if (t.dataset.metric) {
      state.metric = t.dataset.metric; renderMap(); renderRank(); renderReq(); syncPressed(); applyFocus();
    } else if (t.dataset.rmode) {
      state.rmode = t.dataset.rmode; renderIncome(); syncPressed();
    } else if (t.dataset.sel) {
      const id = t.dataset.sel, viaTile = t.classList.contains('tile');
      state.sel = id; state.focus = id; renderMap(); applyFocus();
      if (viaTile) { const nt = $(`.tile[data-sel="${id}"]`); if (nt && document.activeElement === document.body) nt.focus({ preventScroll: true }); }
    } else if (t.dataset.sort) {
      const k = t.dataset.sort;
      state.sort = state.sort.k === k ? { k, d: -state.sort.d } : { k, d: (k === 'n' || k === 'r') ? 1 : -1 };
      renderTable();
    }
  });
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-uf]'), u = el ? el.dataset.uf : state.sel;
    if (u !== state.focus) { state.focus = u; renderDetail(); applyFocus(); }
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest('[data-uf]');
    if (el && el.dataset.uf !== state.focus) { state.focus = el.dataset.uf; renderDetail(); applyFocus(); }
  });
  document.addEventListener('mousemove', e => {
    if (e.target.closest('#trend')) return;
    const t = e.target.closest('[data-tip]');
    if (t) showTip(t.dataset.tip, e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener('scroll', hideTip, true);
  $('#q').addEventListener('input', e => { state.q = e.target.value; renderTable(); });
  $('#retry').addEventListener('click', () => boot());

  // tema: alterna entre claro e escuro e lembra a escolha
  $('#themeBtn').addEventListener('click', () => {
    const atual = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const prox = atual === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = prox;
    try { localStorage.setItem('bn-theme', prox); } catch (e) { /* sem armazenamento: só não lembra */ }
  });

  let rw = 0;
  new ResizeObserver(en => { const w = Math.round(en[0].contentRect.width); if (w !== rw && BR) { rw = w; drawTrend(); } }).observe($('#trend'));
  addEventListener('resize', syncSegs);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncSegs);

  /* ---------- início ---------- */
  function showError(err) {
    setStatus('fallback', err);
    $('#status span').textContent = 'Sem dados';
    $('#bento').hidden = true;
    $('#erro').hidden = false;
    $('#erroMsg').textContent = err && err.message ? err.message : String(err);
  }
  async function boot() {
    const bento = $('#bento');
    $('#erro').hidden = true; bento.hidden = false;
    bento.classList.add('is-loading'); bento.setAttribute('aria-busy', 'true');
    setStatus('loading');
    try {
      const raw = await DataLayer.carregar();
      FONTE = raw.fonte;
      setData(raw);
      setStatus(raw.fonte, raw.erro);
      updateNote(raw);
      bento.classList.remove('is-loading'); bento.setAttribute('aria-busy', 'false');
      renderAll();
      requestAnimationFrame(() => { syncSegs(); requestAnimationFrame(() => $$('.seg').forEach(s => s.classList.add('ready'))); });
    } catch (err) {
      console.error('[Brasil em Números]', err);
      showError(err);
    }
  }
  boot();
})();
