#!/usr/bin/env python3
"""Servidor de desenvolvimento do painel.

Serve os arquivos do painel e uma API de exemplo em /v1/*, com CORS liberado.
Serve para testar o modo "API" antes de a sua API real existir, e como referência
do formato que o painel espera (os dados vêm de mock-data.js).

Uso:
    python mock-api.py            # porta 8000
    python mock-api.py 9000       # outra porta

Depois abra:
    http://localhost:8000/                            -> painel com dados de exemplo
    http://localhost:8000/?api=http://localhost:8000  -> painel lendo desta API
"""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

RAIZ = os.path.dirname(os.path.abspath(__file__))
SLUGS = {"sudeste": "SE", "nordeste": "NE", "sul": "S", "norte": "N", "centro-oeste": "CO"}


def carregar_dados():
    """mock-data.js é 'window.MOCK = { ...JSON... };' — extrai o JSON."""
    with open(os.path.join(RAIZ, "mock-data.js"), encoding="utf-8") as f:
        txt = f.read()
    ini = txt.index("window.MOCK = ") + len("window.MOCK = ")
    fim = txt.rstrip().rindex(";")
    return json.loads(txt[ini:fim])


DADOS = carregar_dados()


def rota_ufs(query):
    ufs = DADOS["ufs"]
    regiao = (query.get("regiao") or [None])[0]
    if regiao:
        sigla = SLUGS.get(regiao.lower(), regiao.upper())
        ufs = [u for u in ufs if u["regiao"] == sigla]
    return ufs


ROTAS = {
    "/v1/ufs": rota_ufs,
    "/v1/censos": lambda q: DADOS["censos"],
    "/v1/series": lambda q: DADOS["series"],
    "/v1/health": lambda q: {"status": "ok"},
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        url = urlparse(self.path)
        if not url.path.startswith("/v1/"):
            return super().do_GET()
        rota = ROTAS.get(url.path.rstrip("/"))
        if rota is None:
            return self.responder(404, {"erro": "rota não encontrada", "rotas": sorted(ROTAS)})
        self.responder(200, rota(parse_qs(url.query)))

    def responder(self, status, corpo):
        dados = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Painel:  http://localhost:{porta}/")
    print(f"Com API: http://localhost:{porta}/?api=http://localhost:{porta}")
    print("Ctrl+C para parar.")
    try:
        ThreadingHTTPServer(("", porta), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")
