from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.models import Categorie

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"]
)

@router.get("/", response_model=list[dict[str, Any]])
def list_categories(db: Session = Depends(get_db)):
    """Liste des catégories disponibles"""
    categories = db.query(Categorie).all()
    return [{"id": c.id, "nom": c.nom, "icone": c.icone} for c in categories]