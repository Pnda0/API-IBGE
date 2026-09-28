---
tags:
  - estudo
  - python
  - fastapi
  - api
tipo: referência
---

# FastAPI — Rotas e Routers

> [!abstract] Em uma frase
> Uma API em FastAPI é um **`app`** com **rotas**. Cada rota liga **método HTTP + URL** a uma **função Python**. As rotas são agrupadas por assunto em **routers** (um arquivo por assunto), e cada router é registrado no `app` com **`include_router`**.

> [!tip] Como usar esta nota
> - Começando um projeto do zero → [[#1. Receita do zero]]
> - Adicionando um assunto novo numa API que já existe → [[#Checklist — novo router]]
> - Algo deu errado → [[#Erros comuns]]

---

## 1. Receita do zero

### Instalar
```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install fastapi "uvicorn[standard]"
```

### Estrutura de pastas
```
meu-projeto/                 ← rodar os comandos SEMPRE daqui
└── app/
    ├── main.py              ← cria o app e registra os routers
    └── routers/
        ├── produtos.py      ← tudo de /produtos
        └── usuarios.py      ← tudo de /usuarios
```

### `app/main.py` — o ponto de entrada
```python
from fastapi import FastAPI

from app.routers import produtos, usuarios

app = FastAPI(title="Minha Loja")

app.include_router(produtos.router)
app.include_router(usuarios.router)


@app.get("/")
def raiz():
    return {"status": "online"}
```

### `app/routers/usuarios.py` — o router mínimo
```python
from fastapi import APIRouter

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.get("/")
def listar_usuarios():
    return [{"id": 1, "nome": "Ana"}]
```

### Rodar
```bash
uvicorn app.main:app --reload
```
| Parte | Significa |
|---|---|
| `app.main` | o arquivo `app/main.py` |
| `:app` | a variável `app` dentro dele |
| `--reload` | reinicia sozinho quando um arquivo é salvo |

Abrir **http://localhost:8000/docs** → escolher a rota → *Try it out* → *Execute*.

---

## 2. Rotas

Uma rota é uma **função** com um **decorador** em cima:

```python
@router.get("/")          # ← método HTTP + caminho
def listar_usuarios():    # ← função que responde
    return [...]          # ← o retorno vira JSON
```

### Os métodos HTTP (o "verbo" da requisição)

| Decorador | Para quê | Exemplo |
|---|---|---|
| `@router.get` | **Buscar** dados | listar produtos, ver um produto |
| `@router.post` | **Criar** algo novo | cadastrar produto |
| `@router.put` | **Atualizar** algo que existe | mudar o preço |
| `@router.delete` | **Remover** | apagar produto |

> [!info] O mesmo caminho pode ter vários métodos
> `GET /produtos/1` e `DELETE /produtos/1` são rotas **diferentes**. O que as distingue é o método.

> [!warning] Só dá para retornar *dados*
> O retorno precisa virar JSON: `dict`, `list`, `str`, número, `bool`, `None` (ou um modelo Pydantic). Devolver um objeto qualquer (um router, uma conexão...) gera erro.

---

## 3. Router (`APIRouter`)

> [!tip] Analogia
> O `app` é o **restaurante**. Cada router é um **cardápio** (bebidas, pratos, sobremesas). O `include_router` é **colocar o cardápio na mesa**: sem ele, o restaurante não sabe que aquele cardápio existe.

### Por que usar
Sem routers, **todas** as rotas moram no `main.py`, e ele cresce sem controle. Com routers:
- Cada arquivo cuida de **um assunto** (produtos, usuários, pedidos...).
- O `main.py` fica curto: só cria o `app` e registra os routers.
- O `/docs` fica organizado em seções (as `tags`).

### Anatomia
```python
from fastapi import APIRouter

router = APIRouter(
    prefix="/produtos",   # colado na frente de TODAS as rotas deste arquivo
    tags=["Produtos"],    # nome da seção no /docs
)


@router.get("/")              # → GET /produtos/
@router.get("/{produto_id}")  # → GET /produtos/{produto_id}
```

**Caminho final = `prefix` + caminho do decorador.**

> [!warning] `@router`, não `@app`
> Dentro do arquivo do router, o decorador é **`@router.get`**. O `app` nem existe ali.

### Registrando no app
```python
from app.routers import produtos

app.include_router(produtos.router)
```
Em português: *"app, inclua o router que está no arquivo produtos"*.
- Tem que vir **depois** de `app = FastAPI(...)`.
- **Uma linha por router.**

### Extra: prefixo na hora de incluir
O `include_router` também aceita `prefix` e `tags`. Isso é útil para versionar a API:
```python
app.include_router(produtos.router, prefix="/v1")
# GET /produtos/1  →  GET /v1/produtos/1
```

---

## 4. Recebendo dados do cliente

São 3 jeitos, e o FastAPI descobre qual é qual **olhando a assinatura da função**:

| Tipo | Onde vem | Exemplo de URL | Como o FastAPI reconhece |
|---|---|---|---|
| **Path param** | dentro do caminho | `/produtos/1` | o nome está entre `{}` no caminho |
| **Query param** | depois do `?` | `/produtos?categoria=telas` | não está no caminho e é tipo simples |
| **Body** | no corpo da requisição (JSON) | `POST /produtos` + JSON | o tipo é um modelo Pydantic |

### Path param — identifica **qual** recurso
```python
@router.get("/{produto_id}")
def buscar_produto(produto_id: int):
    ...
```
- O nome entre `{}` tem que ser **igual** ao nome do parâmetro da função.
- O tipo (`: int`) **converte e valida**: `/produtos/abc` → erro **422** automático.

### Query param — **filtra / configura** a busca
```python
@router.get("/")
def listar_produtos(categoria: str | None = None, limite: int = 10):
    ...
```
- `/produtos` → `categoria=None`, `limite=10`
- `/produtos?categoria=telas&limite=5` → `categoria="telas"`, `limite=5`
- **Com valor padrão = opcional. Sem valor padrão = obrigatório.**

### Body — **dados para criar/atualizar**
```python
from pydantic import BaseModel


class ProdutoEntrada(BaseModel):
    nome: str
    preco: float
    categoria: str


@router.post("/", status_code=201)
def criar_produto(dados: ProdutoEntrada):
    return dados.model_dump()   # vira dict
```
- O cliente manda `{"nome": "Mouse", "preco": 50, "categoria": "perifericos"}`.
- Se faltar campo ou vier tipo errado → **422** automático, sem nenhum `if` seu.
- Pydantic merece nota própria → [[Pydantic]]

> [!tip] Regra de bolso
> **Path** = *qual* coisa (`/produtos/1`). **Query** = *como* buscar (`?ordem=preco`). **Body** = *o conteúdo* que estou enviando.

---

## 5. Status code e erros

### Os códigos que mais aparecem
| Código | Nome | Quando |
|---|---|---|
| **200** | OK | deu certo (padrão do FastAPI) |
| **201** | Created | criou algo (usar no `POST`) |
| **204** | No Content | deu certo e não há nada para devolver (usar no `DELETE`) |
| **404** | Not Found | o recurso pedido não existe |
| **422** | Unprocessable Entity | dados inválidos (o FastAPI gera sozinho) |
| **500** | Internal Server Error | bug no seu código |

**Faixas:** `2xx` = sucesso · `4xx` = erro de quem pediu · `5xx` = erro do servidor.

### Mudar o código de sucesso
```python
@router.post("/", status_code=201)
@router.delete("/{produto_id}", status_code=204)
```

### Devolver erro: `HTTPException`
Padrão **buscar → verificar → devolver**:
```python
from fastapi import HTTPException


@router.get("/{produto_id}")
def buscar_produto(produto_id: int):
    for produto in produtos:                 # 1. buscar
        if produto["id"] == produto_id:
            return produto                   # 3. devolver (achou)

    raise HTTPException(                     # 2. não achou → erro
        status_code=404,
        detail="Produto não encontrado",
    )
```
- **`raise`, não `return`**: o `raise` interrompe a função na hora e o FastAPI transforma em resposta de erro.
- O cliente recebe: `{"detail": "Produto não encontrado"}` com status 404.

> [!warning] Não devolva 200 para "não existe"
> Uma lista vazia com 200 diz "existe, mas está vazio". Se o recurso **não existe**, o certo é **404**.

---

## 6. Exemplo completo — um CRUD num router

Dá para copiar e rodar: os dados ficam numa lista em memória (somem ao reiniciar).

```python
# app/routers/produtos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/produtos", tags=["Produtos"])

produtos = [
    {"id": 1, "nome": "Teclado", "preco": 150.0, "categoria": "perifericos"},
    {"id": 2, "nome": "Monitor", "preco": 900.0, "categoria": "telas"},
]


class ProdutoEntrada(BaseModel):
    nome: str
    preco: float
    categoria: str


@router.get("/")
def listar_produtos(categoria: str | None = None, limite: int = 10):
    resultado = produtos
    if categoria:
        resultado = [p for p in produtos if p["categoria"] == categoria]
    return resultado[:limite]


@router.get("/mais-baratos")          # caminho FIXO antes do caminho com {}
def mais_baratos():
    return sorted(produtos, key=lambda p: p["preco"])[:3]


@router.get("/{produto_id}")
def buscar_produto(produto_id: int):
    for produto in produtos:
        if produto["id"] == produto_id:
            return produto
    raise HTTPException(status_code=404, detail="Produto não encontrado")


@router.post("/", status_code=201)
def criar_produto(dados: ProdutoEntrada):
    novo = {"id": len(produtos) + 1, **dados.model_dump()}
    produtos.append(novo)
    return novo


@router.put("/{produto_id}")
def atualizar_produto(produto_id: int, dados: ProdutoEntrada):
    for produto in produtos:
        if produto["id"] == produto_id:
            produto.update(dados.model_dump())
            return produto
    raise HTTPException(status_code=404, detail="Produto não encontrado")


@router.delete("/{produto_id}", status_code=204)
def remover_produto(produto_id: int):
    for produto in produtos:
        if produto["id"] == produto_id:
            produtos.remove(produto)
            return
    raise HTTPException(status_code=404, detail="Produto não encontrado")
```

| Requisição | Resposta |
|---|---|
| `GET /produtos` | 200, lista |
| `GET /produtos?categoria=telas` | 200, só o monitor |
| `GET /produtos/1` | 200, o teclado |
| `GET /produtos/99` | **404** |
| `GET /produtos/abc` | **422** (não é `int`) |
| `POST /produtos` + JSON válido | **201**, produto criado |
| `POST /produtos` + JSON sem `preco` | **422** |
| `PUT /produtos/1` + JSON | 200, atualizado |
| `DELETE /produtos/2` | **204** |

---

## Erros comuns

> [!bug] Rota não aparece / 404 em tudo
> Esqueceu o `app.include_router(x.router)` no `main.py`. O router existe, mas o app não sabe dele.

> [!bug] Chamar a função do router por dentro de uma rota do app
> ```python
> @app.get("/produtos")
> def get_produtos():
>     return produtos.listar_produtos()
> ```
> Funciona, mas **ignora o router**: `prefix` e `tags` não valem, a rota cai em "default" no `/docs`, e cada rota nova teria que ser repetida. O certo é só `app.include_router(produtos.router)`.

> [!bug] `ModuleNotFoundError` nos imports
> Os imports têm que partir **sempre da mesma raiz**. Rodando `uvicorn app.main:app` na pasta do projeto, **todos** começam com `app.`:
> ```python
> from app.routers import produtos         # ✅
> from routers import produtos             # ❌ supõe outra raiz
> ```
> E **não** rodar com `python app/main.py`, porque isso muda a raiz.

> [!bug] Rota com caminho fixo nunca é chamada
> O FastAPI testa as rotas **na ordem em que foram escritas**. Se `/{produto_id}` vier antes de `/mais-baratos`, a URL `/produtos/mais-baratos` cai na primeira, tenta converter `"mais-baratos"` em `int` e dá **422**.
> **Regra:** caminhos fixos **antes** de caminhos com `{}`.

> [!bug] `307 Temporary Redirect` na barra do final
> Com `prefix="/produtos"` e `@router.get("/")`, a rota real é `/produtos/`. Pedindo `/produtos`, o FastAPI **redireciona**. O navegador segue sozinho, mas alguns clientes não. Para evitar, use o caminho que a rota define.

> [!bug] Código roda sozinho quando a API sobe
> Quando o Python **importa** um arquivo, executa tudo que está fora de funções. Teste solto no fim de um arquivo → apagar ou proteger:
> ```python
> if __name__ == "__main__":
>     print(buscar_algo())
> ```

---

## Checklist — novo router

- [ ] Criar `app/routers/<assunto>.py`
- [ ] `router = APIRouter(prefix="/<assunto>", tags=["<Assunto>"])`
- [ ] Escrever as rotas com `@router.<método>(...)`
- [ ] Caminhos fixos **antes** dos caminhos com `{}`
- [ ] `status_code=201` no POST, `204` no DELETE
- [ ] `HTTPException(404)` quando o recurso não existir
- [ ] No `main.py`: `from app.routers import <assunto>`
- [ ] No `main.py`: `app.include_router(<assunto>.router)`
- [ ] Abrir o `/docs`: a seção nova apareceu?
- [ ] Testar o caso de **sucesso** e o caso de **erro**

---

## Para praticar (sem olhar a nota)

1. Criar do zero uma API com um router `/livros` que tenha `GET` (listar) e `GET /{id}` com 404.
2. Adicionar um segundo router `/autores` e registrar os dois no `main.py`.
3. Em `/livros`, colocar um filtro por query: `?autor=...`.
4. Adicionar `POST /livros` com um modelo Pydantic e `status_code=201`.
5. Colocar os dois routers debaixo de `/v1` usando o `prefix` do `include_router`.

---

## Relacionado
- [[Pydantic]]: validar e formatar dados de entrada e saída
- [[HTTP - métodos e status codes]]
