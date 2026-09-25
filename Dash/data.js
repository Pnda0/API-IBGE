/* Camada de dados: busca (API ou exemplo), valida e converte para o formato interno do painel.

   Se os campos da SUA API tiverem outros nomes, ajuste só o bloco "adaptadores" abaixo —
   o resto do painel não precisa mudar.

   Formato interno de cada UF:
     u  sigla · n nome · r região (SE/NE/S/N/CO) · p população · m municípios
     rpc renda domiciliar per capita (R$) · rmt rendimento médio mensal do trabalho (R$)
     tx taxa de desocupação (%) · deso pessoas desocupadas (opcional) · pea força de trabalho (opcional)
*/
(function () {
  'use strict';
  const cfg = window.APP_CONFIG || {};

  /* ---------- adaptadores: nomes dos campos da API → formato interno ---------- */
  const adaptadores = {
    uf: d => ({
      u: d.uf,
      n: d.nome,
      r: d.regiao,
      p: d.populacao,
      m: d.municipios,
      rpc: d.renda_per_capita,
      rmt: d.rendimento_trabalho,
      tx: d.taxa_desocupacao,
      deso: d.desocupados ?? null,
      pea: d.forca_trabalho ?? null
    }),
    censo: d => ({ ano: d.ano, p: d.populacao }),
    ponto: d => ({ k: d.periodo, v: d.valor })
  };

  /* ---------- utilidades ---------- */
  const REGIOES = {
    SE: 'SE', SUDESTE: 'SE', NE: 'NE', NORDESTE: 'NE', S: 'S', SUL: 'S',
    N: 'N', NORTE: 'N', CO: 'CO', 'CENTRO-OESTE': 'CO', 'CENTRO OESTE': 'CO'
  };
  const sigla = v => REGIOES[String(v ?? '').trim().toUpperCase()];
  const lista = x => Array.isArray(x) ? x : (x && (x.dados || x.data || x.items || x.results)) || [];
  const num = (v, campo, ctx) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`Campo "${campo}" inválido em ${ctx}: ${JSON.stringify(v)}`);
    return n;
  };
  const numOpc = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);

  /* ---------- normalização (valida e falha com mensagem clara) ---------- */
  function normalizarUfs(brutas) {
    const arr = lista(brutas);
    if (!arr.length) throw new Error('A resposta de UFs veio vazia.');
    return arr.map(bruta => {
      const d = adaptadores.uf(bruta);
      const ctx = 'UF ' + (d.u ?? '?');
      const r = sigla(d.r);
      if (!d.u) throw new Error('Há uma UF sem sigla ("uf") na resposta.');
      if (!r) throw new Error(`Região inválida em ${ctx}: ${JSON.stringify(d.r)} (use SE, NE, S, N ou CO).`);
      return {
        u: String(d.u).toUpperCase(), n: String(d.n ?? d.u), r,
        p: num(d.p, 'populacao', ctx), m: num(d.m, 'municipios', ctx),
        rpc: num(d.rpc, 'renda_per_capita', ctx), rmt: num(d.rmt, 'rendimento_trabalho', ctx),
        tx: num(d.tx, 'taxa_desocupacao', ctx), deso: numOpc(d.deso), pea: numOpc(d.pea)
      };
    });
  }
  function normalizarCensos(brutos) {
    return lista(brutos).map(b => {
      const d = adaptadores.censo(b);
      return { ano: num(d.ano, 'ano', 'censos'), p: num(d.p, 'populacao', 'censos') };
    }).sort((a, b) => a.ano - b.ano);
  }
  function normalizarSerie(brutos) {
    return lista(brutos).map(b => {
      const d = adaptadores.ponto(b);
      return { k: String(d.k), v: num(d.v, 'valor', 'series') };
    });
  }
  function normalizarSeries(brutas) {
    if (!brutas) return {};
    return {
      tx: normalizarSerie(brutas.desocupacao),
      rpc: normalizarSerie(brutas.renda_per_capita),
      rmt: normalizarSerie(brutas.rendimento_trabalho)
    };
  }
  function normalizar(bruto) {
    return {
      ufs: normalizarUfs(bruto.ufs),
      censos: normalizarCensos(bruto.censos),
      series: normalizarSeries(bruto.series)
    };
  }

  /* ---------- API ---------- */
  function baseUrl() {
    const q = new URLSearchParams(location.search).get('api');
    return (q !== null ? q : cfg.apiBase || '').replace(/\/+$/, '');
  }
  async function getJSON(base, caminho) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), cfg.timeoutMs || 8000);
    try {
      const res = await fetch(base + caminho, {
        signal: ctl.signal,
        headers: { Accept: 'application/json', ...(cfg.headers || {}) }
      });
      if (!res.ok) throw new Error(`${caminho} respondeu ${res.status} ${res.statusText}`.trim());
      return await res.json();
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(`${caminho} demorou mais de ${(cfg.timeoutMs || 8000) / 1000}s para responder.`);
      if (e instanceof TypeError) throw new Error(`Não consegui falar com ${base}${caminho}. A API está no ar e liberou CORS?`);
      throw e;
    } finally { clearTimeout(timer); }
  }
  async function daApi(base) {
    const ep = cfg.endpoints || {};
    const [ufs, censos, series] = await Promise.all([
      getJSON(base, ep.ufs || '/v1/ufs'),
      getJSON(base, ep.censos || '/v1/censos').catch(() => []),   // opcional
      getJSON(base, ep.series || '/v1/series').catch(() => null)  // opcional
    ]);
    return normalizar({ ufs, censos, series });
  }

  /* ---------- exemplo ---------- */
  function doExemplo() {
    if (!window.MOCK) throw new Error('mock-data.js não foi carregado.');
    return normalizar(window.MOCK);
  }

  /* ---------- ponto de entrada ----------
     Devolve { ufs, censos, series, fonte: 'api' | 'mock' | 'fallback', erro? } */
  async function carregar() {
    const base = baseUrl();
    if (!base) return { ...doExemplo(), fonte: 'mock' };
    try {
      return { ...(await daApi(base)), fonte: 'api' };
    } catch (erro) {
      if (cfg.fallbackToMock === false) throw erro;
      console.warn('[Brasil em Números] API indisponível, usando dados de exemplo:', erro);
      return { ...doExemplo(), fonte: 'fallback', erro };
    }
  }

  window.DataLayer = { carregar };
})();
