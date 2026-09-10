from ibge_client import buscar_estados
import requests
import pprint

from ibge_client import buscar_populacao


from ibge_client import buscar_populacao


dados = buscar_populacao()

print(f"Tipo: {type(dados)}")
print(f"Quantidade: {len(dados)}")

primeiro = dados[0]

print("\nChaves do primeiro registro:")
print(primeiro.keys())

print("\nVariável:")
print(primeiro.get("variavel"))

print("\nUnidade:")
print(primeiro.get("unidade"))

print("\nQuantidade de resultados:")
print(len(primeiro.get("resultados", [])))

print("\nPrimeiro resultado:")
print(primeiro["resultados"][0])

estados = buscar_estados()

# print(f"Estados encontrados: {len(estados)}")   

# for estado in estados[:10]:
#     print(
#         estado["id"],
#         estado["sigla"],
#         estado["nome"],
#     )

