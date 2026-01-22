from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from scripts.saisie_budget import BudgetService
from schemas.budget import BudgetCreate, BudgetRead, BudgetStatus
from models.models import BudgetAlreadyExistsError

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
            montant=budget.montant_fixe,
            date_debut=budget.debut_periode,
            date_fin=budget.fin_periode
        )
        return nouveau_budget
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BudgetAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Erreur d'intégrité de la base de donnée")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
    
@router.get("/{budget_id}", response_model=BudgetStatus)
def get_budget_status(budget_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'état d'un budget (consommé, restant) par son ID.
    """
    service = BudgetService(db)
    try:
        budget_status = service.get_budget_status(budget_id)
        return budget_status
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
    
@router.get("/", response_model=list[BudgetStatus])
def get_budgets(
    categorie_id: int | None = Query(None, description="Filtrer par catégorie"),
    debut: date | None = Query(None, description="Date de début de période"),
    fin: date | None = Query(None, description="Date de fin de période"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter (pagination)"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre d'éléments à récupérer"),
    db: Session = Depends(get_db)
):
    """Récupère la liste des budgets enrichis (statuts calculés)."""
    service = BudgetService(db)
    
    budgets = service.get_budgets(
        categorie_id=categorie_id,
        debut_periode=debut,
        fin_periode=fin,
        skip=skip,
        limit=limit
    )
    return budgets