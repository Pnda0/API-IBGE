/* Configuração do painel — é aqui que você liga na sua API.

   apiBase vazio  → usa os dados de exemplo (mock-data.js). Funciona abrindo o index.html direto.
   apiBase preenchido → busca os dados na sua API (ex.: 'http://localhost:8000').

   Para testar sem editar este arquivo, use o parâmetro na URL:
   http://localhost:8000/?api=http://localhost:8000
*/
window.APP_CONFIG = {
  apiBase: '',

  // Caminhos dos endpoints (relativos ao apiBase). Formato das respostas: veja o README.
  endpoints: {
    ufs: '/v1/ufs',
    censos: '/v1/censos',
    series: '/v1/series'        // opcional: sem ele o painel esconde as linhas de tendência
  },

  // Cabeçalhos extras (ex.: autenticação). Deixe {} se a API for pública.
  headers: {},

  timeoutMs: 8000,

  // Se a API falhar, mostra os dados de exemplo e avisa no topo em vez de quebrar a página.
  fallbackToMock: true
};
