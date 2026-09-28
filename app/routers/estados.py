from fastapi import APIRouter, HTTPException
from app.etl.ibge_client import buscar_estados, buscar_municipios  


router = APIRouter(
    prefix="/estados",   # todas as rotas deste arquivo começam com /estados
    tags=["Estados"],    # agrupa as rotas na documentação automática
)


@router.get("/")
def listar_estados():
    # TODO: chame buscar_estados() e retorne o resultado
    return buscar_estados()

@router.get("/{sigla_estado}/municipios")
def listar_municipios(sigla_estado: str):
    # TODO: chame buscar_municipios() com a sigla do estado e retorne o resultado
    municipios = buscar_municipios(sigla_estado)
    if not municipios:
        raise HTTPException(status_code=404, detail="Estado não encontrado")

    return municipios