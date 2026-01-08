from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.transaction import TransactionBase, TransactionRead
from scripts.saisie_transaction import TransactionService

router = APIRouter(
    prefix="/api/transactions",
    tags=["transactions"]
)

# helper pour instancier le service
def get_transaction_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(db)

@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionBase,
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        transaction = service.create_transaction(transaction_data)
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")

@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    date_debut: str | None = Query(None, description="Format YYYY-MM-DD"),
    date_fin: str | None = Query(None, description="Format YYYY-MM-DD"),
    categorie: str | None = None,
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        transactions = service.get_transactions(
            date_debut=date_debut, 
            date_fin=date_fin, 
            categorie_nom=categorie
        )
        return transactions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")