from datetime import date
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session
from models.models import Budget, Categorie, BudgetAlreadyExistsError, Transaction
from schemas.budget import BudgetStatus


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
            Budget.debut_periode <= date_fin,
            Budget.fin_periode>= date_debut
        ).first()

        if budget_conflit:
            if budget_conflit.date_debut == date_debut and budget_conflit.date_fin == date_fin: #type: ignore
                 raise BudgetAlreadyExistsError("Un budget existe déjà pour cette catégorie et ces dates exactes")
            
            raise BudgetAlreadyExistsError(f"Un budget existe déjà sur cette période (chevauchement avec {budget_conflit.date_debut} - {budget_conflit.date_fin})")

        nouveau_budget = Budget(
            categorie_id=categorie_id,
            montant_fixe=montant,
            debut_periode=date_debut,
            fin_periode=date_fin,
            utilisateur_id= 1 #pour future utilisation multi user
        )
        
        self.db.add(nouveau_budget)
        self.db.commit()
        self.db.refresh(nouveau_budget)
        
        return nouveau_budget
    
    def get_budget_status(self, budget_id: int) -> BudgetStatus:
        budget = self.db.query(Budget).filter(Budget.id == budget_id).first()

        if not budget:
            raise ValueError(f"Le budget {budget_id} n'existe pas")

        total_depense = self.db.query(func.sum(Transaction.montant)).filter(
            Transaction.categorie_id == budget.categorie_id,
            # Cast du DateTime en Date pour inclure toute la journée
            cast(Transaction.date, Date) >= budget.debut_periode,
            cast(Transaction.date, Date) <= budget.fin_periode,
            Transaction.type == "DEPENSE"
        ).scalar()

        if total_depense is None:
            total_depense = 0.0

        restant = budget.montant_fixe - total_depense
        
        pourcentage = 0.0
        if budget.montant_fixe > 0: #type: ignore
            pourcentage = round((total_depense / budget.montant_fixe) * 100, 2) #type: ignore
        
        est_depasse = restant < 0

        return BudgetStatus(
            id=budget.id, #type: ignore
            categorie_id=budget.categorie_id,  #type: ignore
            montant_fixe=budget.montant_fixe,  #type: ignore
            debut_periode=budget.debut_periode,  #type: ignore
            fin_periode=budget.fin_periode,  #type: ignore
            
            montant_depense=total_depense,  #type: ignore
            montant_restant=restant,  #type: ignore
            pourcentage_consomme=pourcentage,
            est_depasse=est_depasse  #type: ignore
        )
    
    def get_budgets(self, categorie_id: int | None = None, debut_periode: date | None = None, fin_periode: date | None = None) -> list[Budget]:
        """
        Récupère la liste des budgets, avec filtres optionnels.
        """
        query = self.db.query(Budget)

        if categorie_id is not None:
            query = query.filter(Budget.categorie_id == categorie_id)

        if debut_periode:
            query = query.filter(Budget.fin_periode >= debut_periode)

        if fin_periode:
            query = query.filter(Budget.debut_periode <= fin_periode)
            
        return query.all()