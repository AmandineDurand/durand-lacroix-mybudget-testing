from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from scripts.saisie_budget import BudgetService
from schemas.budget import BudgetCreate, BudgetFilterParams, BudgetRead, BudgetStatus, BudgetUpdate
from models.models import BudgetAlreadyExistsError, BudgetNotFoundError, CategorieNotFoundError

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
    except CategorieNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BudgetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
    
@router.get("/", response_model=list[BudgetStatus])
def get_budgets(
    params: BudgetFilterParams = Depends(),
    db: Session = Depends(get_db)
):
    """Récupère la liste des budgets enrichis (statuts calculés)."""
    try: 
        service = BudgetService(db)
        budgets = service.get_budgets(
            categorie_id=params.categorie_id,
            debut_periode=params.debut,
            fin_periode=params.fin,
            skip=params.skip,
            limit=params.limit
        )
        return budgets
    except CategorieNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
    
@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(budget_id: int, budget: BudgetUpdate, db: Session = Depends(get_db)):
    """
    Met à jour un budget existant (Catégorie, Montant ou Période).
    """
    service = BudgetService(db)
    updated_budget = service.update_budget(
        budget_id=budget_id,
        categorie_id=budget.categorie_id,
        montant=budget.montant_fixe,
        date_debut=budget.debut_periode,
        date_fin=budget.fin_periode
    )
    return updated_budget