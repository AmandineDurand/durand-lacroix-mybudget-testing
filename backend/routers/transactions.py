from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate
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
    transaction_data: TransactionCreate,
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

@router.put("/{transaction_id}", response_model=TransactionRead, status_code=status.HTTP_200_OK)
def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        transaction = service.update_transaction(
            transaction_id=transaction_id,
            montant=transaction_data.montant,
            libelle=transaction_data.libelle,
            type=transaction_data.type,
            date=transaction_data.date,
            categorie=transaction_data.categorie
        )
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")
    
@router.get("/total")
def total_transactions(
    date_debut: str | None = Query(None, description="Format YYYY-MM-DD"),
    date_fin: str | None = Query(None, description="Format YYYY-MM-DD"),
    categorie: str | None = None,
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        total = service.get_total_transactions(
            date_debut=date_debut,
            date_fin=date_fin,
            categorie_nom=categorie
        )
        return {"total": total}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")
    
@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    service: TransactionService = Depends(get_transaction_service)
):
    total = service.delete_transaction(transaction_id=transaction_id)
    return {"total": total}