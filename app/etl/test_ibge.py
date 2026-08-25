from ibge_client import buscar_estados
import requests
import pprint

estados = buscar_estados()

print(f"Estados encontrados: {len(estados)}")   

for estado in estados[:5]:
    print(
        estado["id"],
        estado["sigla"],
        estado["nome"],
    )
