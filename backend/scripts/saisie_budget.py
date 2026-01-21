# scripts/budget_service.py
from datetime import date
from sqlalchemy.orm import Session
from models.models import Budget, Categorie, BudgetAlreadyExistsError

class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def add_budget(self, categorie_id: int, montant: float, date_debut: date, date_fin: date) -> Budget:

        if date_fin < date_debut:
            raise ValueError("La date de fin doit être postérieure à la date de début")

        if montant <= 0 :
            raise ValueError("Le montant doit être strictement positif")
        
        categorie = self.db.query(Categorie).filter(Categorie.id == categorie_id).first()
        if not categorie:
            raise ValueError(f"La catégorie avec l'ID {categorie_id} n'existe pas")
        
        budget_conflit = self.db.query(Budget).filter( #couvre unicité et chevauchement
            Budget.categorie_id == categorie_id,
            Budget.date_debut <= date_fin,
            Budget.date_fin >= date_debut
        ).first()

        if budget_conflit:
            if budget_conflit.date_debut == date_debut and budget_conflit.date_fin == date_fin: #type: ignore
                 raise BudgetAlreadyExistsError("Un budget existe déjà pour cette catégorie et ces dates exactes")
            
            raise BudgetAlreadyExistsError(f"Un budget existe déjà sur cette période (chevauchement avec {budget_conflit.date_debut} - {budget_conflit.date_fin})")

        nouveau_budget = Budget(
            categorie_id=categorie_id,
            montant=montant,
            date_debut=date_debut,
            date_fin=date_fin
        )
        
        self.db.add(nouveau_budget)
        self.db.commit()
        self.db.refresh(nouveau_budget)
        
        return nouveau_budget