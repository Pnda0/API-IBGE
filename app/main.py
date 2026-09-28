from fastapi import FastAPI
from app.routers import estados

app = FastAPI(
    title="IBGE Data API",
    description="API própria para consulta de dados do IBGE",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "IBGE Data API",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }

# Registra todas as rotas de routers/estados.py no app
app.include_router(estados.router)

