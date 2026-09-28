from pydantic import BaseModel


class Estado(BaseModel):
    id: int
    sigla: str
    nome: str
    regiao: str

class Municipio(BaseModel):
    id: int
    nome: str
    microrregiao: str | None = None   # "é texto OU None; se não vier, fica None"
    mesorregiao: str | None = None   # "é texto OU None; se não vier, fica None"
    uf: str

