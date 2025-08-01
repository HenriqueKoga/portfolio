import uvicorn
from app.infrastructure.vault import load_secrets
from app.routes import routes
from fastapi import FastAPI

try:
    load_secrets()
except Exception as e:
    print(f"Failed to load secrets: {e}")
    # Depending on your deployment strategy, you might want to exit here
    # or handle it differently for production vs. development/testing.
    # For now, we'll let the application continue, but this might lead to
    # further errors if secrets are truly essential.
    pass

app = FastAPI(
    title="Comment Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

app.include_router(routes.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
