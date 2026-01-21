# scripts/budget_service.py
from datetime import date
from sqlalchemy.orm import Session
from models.models import Budget

class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def add_budget(self, categorie_id: int, montant: float, date_debut: date, date_fin: date) -> Budget:

        if date_fin < date_debut:
            raise ValueError("La date de fin doit être postérieure à la date de début")

        nouveau_budget = Budget(
            categorie_id=categorie_id,
            montant=montant,
            date_debut=date_debut,
            date_fin=date_fin
        )
        
        # Interaction DB standard
        self.db.add(nouveau_budget)
        self.db.commit()
        self.db.refresh(nouveau_budget)
        
        return nouveau_budget