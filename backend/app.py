from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from routers import transactions, categories, budgets, auth

# Init
app = FastAPI(
    title="Budget Personnel API",
    description="API de gestion de budget avec authentification JWT",
    version="1.0.0"
)

# Inclusion des routeurs
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)

# Route de base
@app.get("/")
def root():
    return {
        "message": "API Budget Personnel",
        "version": "1.0.0",
        "endpoints": {
            "transactions": "/api/transactions",
            "categories": "/api/categories",
            "docs": "/docs"
        }
    }

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)}
    )