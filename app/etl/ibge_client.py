import requests


IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1"
IBGE_AGREGADOS_URL = "https://servicodados.ibge.gov.br/api/v3/agregados"

def buscar_estados() -> list[dict]:
    url = f"{IBGE_BASE_URL}/localidades/estados"

    response = requests.get(url, timeout=30)
    response.raise_for_status()

    return response.json()


def buscar_municipios(sigla_estado: str) -> list[dict]:
    url = f"{IBGE_BASE_URL}/localidades/estados/{sigla_estado}/municipios"

    response = requests.get(url, timeout=30)
    response.raise_for_status()

    return response.json()

def buscar_populacao() -> list[dict]:
    url = (
        f"{IBGE_AGREGADOS_URL}/6579/"
        f"periodos/-1/"
        f"variaveis/9324"
        f"?localidades=N6[all]"
    )

    response = requests.get(url, timeout=60)
    response.raise_for_status()

    return response.json()

municipios_sp = buscar_municipios("SP")
print(f"Quantidade de municípios em São Paulo: {len(municipios_sp)}")

municipios_rj = buscar_municipios("RJ")
print(f"Quantidade de municípios em Rio de Janeiro: {len(municipios_rj)}")