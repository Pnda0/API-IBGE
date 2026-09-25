# Brasil em Números

Painel de indicadores do Brasil (população, UFs, municípios, renda e desocupação).
HTML, CSS e JavaScript puros, sem build e sem dependências.

## Como rodar

**Só olhar o layout:** dê dois cliques em `index.html`. Usa dados de exemplo.

**Com servidor de teste (recomendado):**

```bash
python mock-api.py
```

- `http://localhost:8000/` → painel com dados de exemplo
- `http://localhost:8000/?api=http://localhost:8000` → painel lendo da API de exemplo (`/v1/*`)
- Acrescente `&theme=light` ou `&theme=dark` para forçar o tema (útil para tirar capturas de tela)

## Estrutura

| Arquivo | Para quê |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Todo o visual. Cores e tema no bloco **1. TOKENS** |
| `app.js` | Lógica: filtros, gráficos, tabela, tema |
| `data.js` | Camada de dados: busca na API, valida e converte |
| `config.js` | **Onde você liga na sua API** |
| `mock-data.js` | Dados de exemplo, no mesmo formato da API |
| `mock-api.py` | Servidor de teste: serve o painel e uma API de exemplo |
| `versao-1/` | Primeira versão do layout (arquivo único), guardada como referência |

## Ligar na sua API

1. Abra `config.js` e preencha `apiBase`:

   ```js
   apiBase: 'http://localhost:3000',
   ```

2. Sua API precisa responder estes endpoints (caminhos ajustáveis em `config.js`):

   | Endpoint | Obrigatório | O que devolve |
   |---|---|---|
   | `GET /v1/ufs` | sim | Lista das UFs |
   | `GET /v1/censos` | não | População em cada Censo (colunas do cartão de população) |
   | `GET /v1/series` | não | Séries históricas (linhas de tendência) |

3. Libere **CORS** na API para a origem de onde o painel é aberto.
   - FastAPI: `app.add_middleware(CORSMiddleware, allow_origins=["*"])`
   - Express: `app.use(require('cors')())`

Se a API falhar, o painel mostra os dados de exemplo e avisa no topo
(`fallbackToMock: false` em `config.js` troca isso por uma tela de erro).

### Formato das respostas

**`GET /v1/ufs`**: uma lista com as 27 UFs (também aceita `{ "dados": [...] }`).

```json
[
  {
    "uf": "SP",
    "nome": "São Paulo",
    "regiao": "SE",
    "populacao": 44411238,
    "municipios": 645,
    "renda_per_capita": 2650,
    "rendimento_trabalho": 4100,
    "taxa_desocupacao": 5.3,
    "desocupados": 1247512,
    "forca_trabalho": 23538000
  }
]
```

- `regiao`: `SE`, `NE`, `S`, `N` ou `CO` (também aceita o nome: "Sudeste", "Centro-Oeste"…).
- `renda_per_capita` e `rendimento_trabalho` em reais por mês; `taxa_desocupacao` em %.
- `desocupados` e `forca_trabalho` são **opcionais**. Sem eles, o painel estima
  (força de trabalho = 53% da população). Prefira mandar os valores reais.

**`GET /v1/censos`**

```json
[ { "ano": 2010, "populacao": 190755799 }, { "ano": 2022, "populacao": 203080756 } ]
```

**`GET /v1/series`**: cada série é uma lista de `{ periodo, valor }`, em ordem cronológica.

```json
{
  "desocupacao": [ { "periodo": "1T26", "valor": 6.1 }, { "periodo": "2T26", "valor": 5.6 } ],
  "renda_per_capita": [ { "periodo": "2024", "valor": 2040 }, { "periodo": "2025", "valor": 2053 } ],
  "rendimento_trabalho": [ { "periodo": "2024", "valor": 3260 }, { "periodo": "2025", "valor": 3308 } ]
}
```

Qualquer série ausente faz o painel esconder só aquele gráfico, sem quebrar.

### Meus campos têm outros nomes

Ajuste só o bloco **adaptadores** no começo de `data.js`. Exemplo: se a sua API devolve
`sigla` em vez de `uf`, troque `u: d.uf` por `u: d.sigla`. O resto do painel não muda.

### Autenticação

Cabeçalhos extras (token etc.) vão em `headers` no `config.js`:

```js
headers: { Authorization: 'Bearer SEU_TOKEN' },
```

## Personalizar

- **Cores, tema claro/escuro:** variáveis no bloco `1. TOKENS` do `style.css`.
- **Fonte:** variável `--font`. Em aparelhos Apple usa a SF Pro; nos demais, a Inter.
- **Textos:** no `index.html`.
- **Posição das UFs no mapa:** objeto `POS` no `app.js`.
- **Quais UFs aparecem no ranking:** `.slice(0, 14)` em `renderRank()`.

## Publicar

É um site estático: sirva a pasta em qualquer hospedagem (Netlify, Vercel, GitHub Pages,
Nginx) ou dentro do seu backend como arquivos estáticos. `mock-api.py` e `versao-1/` podem ficar de fora.
