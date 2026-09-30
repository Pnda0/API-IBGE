from fastapi import APIRouter, HTTPException
from app.etl.ibge_client import buscar_estados, buscar_municipios
from app.schemas.estado import Estado, Municipio


router = APIRouter(
    prefix="/estados",   # todas as rotas deste arquivo começam com /estados
    tags=["Estados"],    # agrupa as rotas na documentação automática
)


@router.get("/", response_model=list[Estado])
def listar_estados(regiao: str | None = None):
    """
    Retorna a lista de todos os estados do Brasil.
    """
    dados_ibge = buscar_estados()

    estados = []
    for item in dados_ibge:
        estados.append(
            Estado(
                id=item["id"],
                sigla=item["sigla"],
                nome=item["nome"],
                regiao=item["regiao"]["nome"],
            )
        )
    if regiao:
        filtrados = []
        for estado in estados:
            if estado.regiao == regiao:
                filtrados.append(estado)
        estados = filtrados

    return estados


    
# {sigla_estado} vem da URL e é passado para o parâmetro de mesmo nome
@router.get("/{sigla_estado}/municipios", response_model=list[Municipio])
def listar_municipios(sigla_estado: str):
    municipios = buscar_municipios(sigla_estado)

    municipio = []
    for item in municipios:
        municipio.append(
            Municipio(
                id=item["id"],
                nome=item["nome"],
                microrregiao=item["microrregiao"]["nome"] if item["microrregiao"] else None,
                mesorregiao=item["microrregiao"]["mesorregiao"]["nome"] if item["microrregiao"] else None,
                uf=item["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]

            )
        )
    # Sigla inexistente → IBGE devolve lista vazia → respondemos 404
    if not municipios:
        raise HTTPException(status_code=404, detail="Estado não encontrado")

    return municipio


