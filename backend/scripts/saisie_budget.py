from datetime import date
from sqlalchemy import func, cast, and_, Date
from sqlalchemy.orm import Session
from models.models import Budget, Categorie, BudgetAlreadyExistsError, Transaction, BudgetNotFoundError, CategorieNotFoundError
from schemas.budget import BudgetStatus


class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def _valider_contraintes_budget(self, categorie_id: int, montant: float, date_debut: date, date_fin: date, exclude_budget_id: int | None = None):
        """
        Valide les règles métiers communes pour l'ajout et la modification.
        Lève des exceptions si les contraintes ne sont pas respectées.
        """
        if date_fin < date_debut:
            raise ValueError("La date de fin doit être postérieure à la date de début")

        if montant <= 0:
            raise ValueError("Le montant doit être strictement positif")
        
        categorie = self.db.query(Categorie).filter(Categorie.id == categorie_id).first()
        if not categorie:
            raise CategorieNotFoundError(f"La catégorie avec l'ID {categorie_id} n'existe pas")

        query = self.db.query(Budget).filter(
            Budget.categorie_id == categorie_id,
            Budget.debut_periode <= date_fin,
            Budget.fin_periode >= date_debut
        )

        if exclude_budget_id is not None:
            query = query.filter(Budget.id != exclude_budget_id)

        budget_conflit = query.first()

        if budget_conflit:
            if budget_conflit.debut_periode == date_debut and budget_conflit.fin_periode == date_fin: #type: ignore
                 raise BudgetAlreadyExistsError("Un budget existe déjà pour cette catégorie et ces dates exactes")
            
            raise BudgetAlreadyExistsError(f"Un budget existe déjà sur cette période (chevauchement avec {budget_conflit.debut_periode} - {budget_conflit.fin_periode})") #type: ignore

    def add_budget(self, categorie_id: int, montant: float, date_debut: date, date_fin: date) -> Budget:

        self._valider_contraintes_budget(categorie_id, montant, date_debut, date_fin)

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
            raise BudgetNotFoundError(f"Le budget {budget_id} n'existe pas")

        total_depense = self.db.query(func.sum(Transaction.montant)).filter(
            Transaction.categorie_id == budget.categorie_id,
            # Cast du DateTime en Date pour inclure toute la journée
            cast(Transaction.date, Date) >= budget.debut_periode,
            cast(Transaction.date, Date) <= budget.fin_periode,
            Transaction.type == "DEPENSE"
        ).scalar()

        if total_depense is None:
            total_depense = 0.0

        total_depense = round(total_depense, 2)

        restant = round(budget.montant_fixe - total_depense, 2) #type:ignore
        
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
    
    def get_budgets(self, categorie_id: int | None = None, debut_periode: date | None = None, fin_periode: date | None = None, skip: int = 0, limit: int = 0) -> list[BudgetStatus]:
        """
        Récupère la liste des budgets, avec filtres optionnels.
        """
        query = self.db.query(
            Budget,
            func.coalesce(func.sum(Transaction.montant), 0.0).label("total_depense")
        )

        query = query.outerjoin(
            Transaction,
            and_(
                Budget.categorie_id == Transaction.categorie_id,
                Transaction.type == "DEPENSE",
                cast(Transaction.date, Date) >= Budget.debut_periode,
                cast(Transaction.date, Date) <= Budget.fin_periode
            )
        )

        if debut_periode and fin_periode and debut_periode > fin_periode:
            raise ValueError("La date de début doit être antérieure ou égale à la date de fin.")
        
        if categorie_id is not None:
            categorie_existe = self.db.query(Categorie).filter(Categorie.id == categorie_id).first()
            if not categorie_existe:
                raise CategorieNotFoundError(f"Catégorie introuvable (ID: {categorie_id})")
            query = query.filter(Budget.categorie_id == categorie_id)

        if debut_periode:
            query = query.filter(cast(Budget.fin_periode, Date) >= debut_periode)

        if fin_periode:
            query = query.filter(cast(Budget.debut_periode, Date) <= fin_periode)

        query = query.group_by(Budget.id)

        if limit > 0:
            query = query.offset(skip).limit(limit)

        results = query.all()

        budget_status_list = []
        for budget_obj, total_depense in results:
            
            total_depense = round(total_depense, 2)
            restant = round(budget_obj.montant_fixe - total_depense, 2)
            
            pourcentage = 0.0
            if budget_obj.montant_fixe > 0:
                pourcentage = round((total_depense / budget_obj.montant_fixe) * 100, 2)
            
            est_depasse = restant < 0

            # Création de l'objet de réponse enrichi
            status_obj = BudgetStatus(
                id=budget_obj.id,
                categorie_id=budget_obj.categorie_id,
                montant_fixe=budget_obj.montant_fixe,
                debut_periode=budget_obj.debut_periode,
                fin_periode=budget_obj.fin_periode,
                montant_depense=total_depense,
                montant_restant=restant,
                pourcentage_consomme=pourcentage,
                est_depasse=est_depasse
            )
            budget_status_list.append(status_obj)
            
        return budget_status_list
    
    def update_budget(self, budget_id: int, categorie_id: int | None = None, montant: float | None = None, date_debut: date | None = None, date_fin: date | None = None) -> Budget:
        """
        Modifie un budget existant (catégorie, montant ou période).
        Vérifie l'unicité et l'absence de chevauchement avec d'autres budgets.
        """
        budget = self.db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            raise BudgetNotFoundError(f"Le budget {budget_id} n'existe pas")

        if (categorie_id == budget.categorie_id and 
            montant == budget.montant_fixe and 
            date_debut == budget.debut_periode and 
            date_fin == budget.fin_periode):
            raise ValueError("Aucune modification apportée au budget")

        self._valider_contraintes_budget(
            categorie_id=categorie_id if categorie_id is not None else budget.categorie_id, # type: ignore
            montant=montant if montant is not None else budget.montant_fixe, # type: ignore
            date_debut=date_debut if date_debut is not None else budget.debut_periode, # type: ignore
            date_fin=date_fin if date_fin is not None else budget.fin_periode, # type: ignore
            exclude_budget_id=budget_id # type: ignore
        )


        if categorie_id is not None:
            budget.categorie_id = categorie_id # type: ignore
        if montant is not None:
            budget.montant_fixe = montant # type: ignore
        if date_debut is not None:
            budget.debut_periode = date_debut # type: ignore
        if date_fin is not None:
            budget.fin_periode = date_fin # type: ignore

        self.db.commit()
        self.db.refresh(budget)
        
        return budget