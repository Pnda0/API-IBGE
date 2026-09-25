/* Dados de EXEMPLO no mesmo formato que a API deve devolver.
   Usados quando APP_CONFIG.apiBase está vazio (ou a API falha e fallbackToMock = true).
   Também servem de fonte para o servidor de teste (mock-api.py) — mantenha JSON estrito. */
window.MOCK = {
  "ufs": [
    {"uf":"SP","nome":"São Paulo","regiao":"SE","populacao":44411238,"municipios":645,"renda_per_capita":2650,"rendimento_trabalho":4100,"taxa_desocupacao":5.3,"desocupados":1247512},
    {"uf":"MG","nome":"Minas Gerais","regiao":"SE","populacao":20539989,"municipios":853,"renda_per_capita":2000,"rendimento_trabalho":3350,"taxa_desocupacao":4.1,"desocupados":446334},
    {"uf":"RJ","nome":"Rio de Janeiro","regiao":"SE","populacao":16055174,"municipios":92,"renda_per_capita":2400,"rendimento_trabalho":4000,"taxa_desocupacao":7,"desocupados":595647},
    {"uf":"ES","nome":"Espírito Santo","regiao":"SE","populacao":3833712,"municipios":78,"renda_per_capita":2200,"rendimento_trabalho":3400,"taxa_desocupacao":4.4,"desocupados":89402},
    {"uf":"BA","nome":"Bahia","regiao":"NE","populacao":14141626,"municipios":417,"renda_per_capita":1370,"rendimento_trabalho":2450,"taxa_desocupacao":8.1,"desocupados":607100},
    {"uf":"PE","nome":"Pernambuco","regiao":"NE","populacao":9058931,"municipios":184,"renda_per_capita":1400,"rendimento_trabalho":2450,"taxa_desocupacao":8.3,"desocupados":398502},
    {"uf":"CE","nome":"Ceará","regiao":"NE","populacao":8794957,"municipios":184,"renda_per_capita":1350,"rendimento_trabalho":2350,"taxa_desocupacao":6.6,"desocupados":307648},
    {"uf":"MA","nome":"Maranhão","regiao":"NE","populacao":6776699,"municipios":217,"renda_per_capita":1000,"rendimento_trabalho":2100,"taxa_desocupacao":6.4,"desocupados":229866},
    {"uf":"PB","nome":"Paraíba","regiao":"NE","populacao":3974687,"municipios":223,"renda_per_capita":1420,"rendimento_trabalho":2400,"taxa_desocupacao":6.5,"desocupados":136928},
    {"uf":"RN","nome":"Rio Grande do Norte","regiao":"NE","populacao":3302729,"municipios":167,"renda_per_capita":1550,"rendimento_trabalho":2500,"taxa_desocupacao":7.1,"desocupados":124282},
    {"uf":"AL","nome":"Alagoas","regiao":"NE","populacao":3127683,"municipios":102,"renda_per_capita":1250,"rendimento_trabalho":2250,"taxa_desocupacao":8,"desocupados":132614},
    {"uf":"PI","nome":"Piauí","regiao":"NE","populacao":3271199,"municipios":224,"renda_per_capita":1300,"rendimento_trabalho":2100,"taxa_desocupacao":6,"desocupados":104024},
    {"uf":"SE","nome":"Sergipe","regiao":"NE","populacao":2210004,"municipios":75,"renda_per_capita":1500,"rendimento_trabalho":2450,"taxa_desocupacao":9,"desocupados":105417},
    {"uf":"PA","nome":"Pará","regiao":"N","populacao":8120131,"municipios":144,"renda_per_capita":1200,"rendimento_trabalho":2450,"taxa_desocupacao":6.5,"desocupados":279739},
    {"uf":"AM","nome":"Amazonas","regiao":"N","populacao":3941613,"municipios":62,"renda_per_capita":1300,"rendimento_trabalho":2600,"taxa_desocupacao":7.8,"desocupados":162946},
    {"uf":"RO","nome":"Rondônia","regiao":"N","populacao":1581196,"municipios":52,"renda_per_capita":1900,"rendimento_trabalho":3050,"taxa_desocupacao":3.2,"desocupados":26817},
    {"uf":"TO","nome":"Tocantins","regiao":"N","populacao":1511460,"municipios":139,"renda_per_capita":1700,"rendimento_trabalho":2750,"taxa_desocupacao":4.9,"desocupados":39253},
    {"uf":"AC","nome":"Acre","regiao":"N","populacao":830018,"municipios":22,"renda_per_capita":1300,"rendimento_trabalho":2600,"taxa_desocupacao":8,"desocupados":35193},
    {"uf":"AP","nome":"Amapá","regiao":"N","populacao":733759,"municipios":16,"renda_per_capita":1200,"rendimento_trabalho":2650,"taxa_desocupacao":8.9,"desocupados":34611},
    {"uf":"RR","nome":"Roraima","regiao":"N","populacao":636707,"municipios":15,"renda_per_capita":1800,"rendimento_trabalho":3000,"taxa_desocupacao":4.9,"desocupados":16535},
    {"uf":"PR","nome":"Paraná","regiao":"S","populacao":11444380,"municipios":399,"renda_per_capita":2350,"rendimento_trabalho":3500,"taxa_desocupacao":3.4,"desocupados":206228},
    {"uf":"RS","nome":"Rio Grande do Sul","regiao":"S","populacao":10882965,"municipios":497,"renda_per_capita":2450,"rendimento_trabalho":3700,"taxa_desocupacao":4,"desocupados":230719},
    {"uf":"SC","nome":"Santa Catarina","regiao":"S","populacao":7610361,"municipios":295,"renda_per_capita":2650,"rendimento_trabalho":3600,"taxa_desocupacao":2.6,"desocupados":104871},
    {"uf":"GO","nome":"Goiás","regiao":"CO","populacao":7056495,"municipios":246,"renda_per_capita":2050,"rendimento_trabalho":3300,"taxa_desocupacao":4.8,"desocupados":179517},
    {"uf":"MT","nome":"Mato Grosso","regiao":"CO","populacao":3658649,"municipios":142,"renda_per_capita":2250,"rendimento_trabalho":3300,"taxa_desocupacao":3,"desocupados":58173},
    {"uf":"MS","nome":"Mato Grosso do Sul","regiao":"CO","populacao":2757013,"municipios":79,"renda_per_capita":2300,"rendimento_trabalho":3400,"taxa_desocupacao":3,"desocupados":43837},
    {"uf":"DF","nome":"Distrito Federal","regiao":"CO","populacao":2817381,"municipios":1,"renda_per_capita":3300,"rendimento_trabalho":6100,"taxa_desocupacao":6.5,"desocupados":97059}
  ],
  "censos": [
    {"ano":1970,"populacao":93139037},
    {"ano":1980,"populacao":119002706},
    {"ano":1991,"populacao":146825475},
    {"ano":2000,"populacao":169799170},
    {"ano":2010,"populacao":190755799},
    {"ano":2022,"populacao":203080756}
  ],
  "series": {
    "desocupacao": [
      {"periodo":"3T23","valor":7.7},
      {"periodo":"4T23","valor":7.5},
      {"periodo":"1T24","valor":7.9},
      {"periodo":"2T24","valor":7.1},
      {"periodo":"3T24","valor":6.6},
      {"periodo":"4T24","valor":6.2},
      {"periodo":"1T25","valor":7},
      {"periodo":"2T25","valor":6.6},
      {"periodo":"3T25","valor":6},
      {"periodo":"4T25","valor":5.6},
      {"periodo":"1T26","valor":6.1},
      {"periodo":"2T26","valor":5.6}
    ],
    "renda_per_capita": [
      {"periodo":"2018","valor":1632},
      {"periodo":"2019","valor":1693},
      {"periodo":"2020","valor":1754},
      {"periodo":"2021","valor":1836},
      {"periodo":"2022","valor":1897},
      {"periodo":"2023","valor":1938},
      {"periodo":"2024","valor":1979},
      {"periodo":"2025","valor":2040}
    ],
    "rendimento_trabalho": [
      {"periodo":"2018","valor":2944},
      {"periodo":"2019","valor":3010},
      {"periodo":"2020","valor":3076},
      {"periodo":"2021","valor":3143},
      {"periodo":"2022","valor":3192},
      {"periodo":"2023","valor":3225},
      {"periodo":"2024","valor":3258},
      {"periodo":"2025","valor":3308}
    ]
  }
};
