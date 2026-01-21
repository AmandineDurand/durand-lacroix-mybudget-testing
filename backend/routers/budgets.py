from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from scripts.saisie_budget import BudgetService 
from schemas.budget import BudgetCreate, BudgetRead

router = APIRouter(
    prefix="/api/budgets",
    tags=["budgets"]
)

@router.post("/", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):

    try :
        service = BudgetService(db)

        nouveau_budget = service.add_budget(
            categorie_id=budget.categorie_id,
            montant=budget.montant,
            date_debut=budget.date_debut,
            date_fin=budget.date_fin
        )
        return nouveau_budget
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))