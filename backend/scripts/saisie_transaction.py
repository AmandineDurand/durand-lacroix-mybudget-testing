from datetime import datetime
from sqlalchemy.orm import Session

from models.models import Transaction, Categorie
from schemas.transaction import TransactionCreate

class TransactionService:
    def __init__(self, db: Session):
        self.db = db

    def create_transaction(self, transaction_data: TransactionCreate) -> Transaction:
        # recherche de la catégorie d'abord
        categorie = self.db.query(Categorie).filter(
            Categorie.nom.ilike(transaction_data.categorie)
        ).first()
        
        if not categorie:
            categories_dispo = [str(c.nom) for c in self.db.query(Categorie).all()]
            raise ValueError(
                f"La catégorie '{transaction_data.categorie}' n'existe pas. "
                f"Disponibles : {', '.join(categories_dispo)}"
            )
        
        # Création de l'objet ORM
        db_transaction = Transaction(
            montant=transaction_data.montant,
            libelle=transaction_data.libelle,
            type=transaction_data.type,
            categorie_id=categorie.id,
            date=transaction_data.date,
            utilisateur_id=1  # 1 pour l'instant, futur multi-utilisateurs
        )
        
        self.db.add(db_transaction)
        self.db.commit()
        self.db.refresh(db_transaction)
        return db_transaction

    def get_transactions(
        self, 
        date_debut: str | None = None, 
        date_fin: str | None = None, 
        categorie_nom: str | None = None
    ) -> list[Transaction]:

        query = self.db.query(Transaction).join(Categorie)
        
        if date_debut:
            try:
                dt_debut = datetime.fromisoformat(date_debut)
                query = query.filter(Transaction.date >= dt_debut)
            except ValueError:
                raise ValueError("Format de date de début invalide")
                
        if date_fin:
            try:
                dt_fin = datetime.fromisoformat(date_fin)
                # on règle la fin de journée pour inclure les transactions de la dite journée
                dt_fin = dt_fin.replace(hour=23, minute=59, second=59)
                query = query.filter(Transaction.date <= dt_fin)
            except ValueError:
                raise ValueError("Format de date de fin invalide")
        
        if categorie_nom:
            query = query.filter(Categorie.nom.ilike(categorie_nom))
            
        return query.order_by(Transaction.date.desc()).all()
    
    def update_transaction(
        self,
        transaction_id: int,
        montant: float | None = None,
        libelle: str | None = None,
        type: str | None = None,
        date: datetime | None = None,
        categorie: str | None = None
    ) -> Transaction:

        transaction = self.db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()
        
        if montant is not None:
            transaction.montant = montant
        
        if libelle is not None:
            transaction.libelle = libelle
        
        if type is not None:
            transaction.type = type
        
        if date is not None:
            transaction.date = date
        
        if categorie is not None:
            new_categorie = self.db.query(Categorie).filter(
                Categorie.nom.ilike(categorie)
            ).first()
            transaction.categorie_id = new_categorie.id
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction