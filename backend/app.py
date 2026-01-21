from fastapi import FastAPI
from routers import transactions, categories, budgets

# Init
app = FastAPI(
    title="Budget Personnel API",
    description="API de gestion de budget",
    version="1.0.0"
)

# Inclusion des routeurs
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