import uvicorn
from app.infrastructure.vault import load_secrets
from app.routes import routes
from fastapi import FastAPI

load_secrets()

app = FastAPI(
    title="Comment Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

app.include_router(routes.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
