import requests
import pprint

IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1"


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


pprint.pprint(buscar_estados())
pprint.pprint(buscar_municipios("SP"))