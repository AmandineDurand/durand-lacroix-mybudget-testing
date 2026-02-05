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
        categorie_nom: str | None = None,
        type_filtre: str | None = None
    ) -> list[Transaction]:

        query = self.db.query(Transaction).join(Categorie)
        # Validation et application des dates (assure debut <= fin si les deux fournis)
        dt_debut = None
        dt_fin = None

        if date_debut:
            try:
                dt_debut = datetime.fromisoformat(date_debut)
            except ValueError:
                raise ValueError("Format de date de début invalide")

        if date_fin:
            try:
                dt_fin = datetime.fromisoformat(date_fin)
                dt_fin = dt_fin.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise ValueError("Format de date de fin invalide")

        if dt_debut and dt_fin and dt_debut > dt_fin:
            raise ValueError("La date de début ne peut pas être après la date de fin")

        if dt_debut:
            query = query.filter(Transaction.date >= dt_debut)

        if dt_fin:
            query = query.filter(Transaction.date <= dt_fin)

        if categorie_nom:
            query = query.filter(Categorie.nom.ilike(categorie_nom))
        
        if type_filtre:
            type_upper = type_filtre.upper()
            if type_upper not in ['REVENU', 'DEPENSE']:
                raise ValueError("Le type doit être 'REVENU' ou 'DEPENSE'")
            query = query.filter(Transaction.type == type_upper)
            
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
        
        if not transaction:
            raise ValueError("Transaction non trouvée")
        
        if montant is not None:
            if montant <= 0:
                raise ValueError("Le montant doit être strictement positif")
            transaction.montant = montant
        
        if libelle is not None:
            transaction.libelle = libelle
        
        if type is not None:
            type_upper = type.upper()
            if type_upper not in ['REVENU', 'DEPENSE']:
                raise ValueError("Le type doit être 'REVENU' ou 'DEPENSE'")
            transaction.type = type_upper
        
        if date is not None:
            transaction.date = date
        
        if categorie is not None:
            new_categorie = self.db.query(Categorie).filter(
                Categorie.nom.ilike(categorie)
            ).first()
            
            if not new_categorie:
                raise ValueError(f"La catégorie '{categorie}' n'existe pas")
            
            transaction.categorie_id = new_categorie.id
        
        self.db.commit()
        self.db.refresh(transaction)

        try:
            if getattr(transaction, 'categorie_obj', None) is not None:
                transaction.categorie = transaction.categorie_obj.nom
            else:
                transaction.categorie = None
        except Exception:
            transaction.categorie = str(getattr(transaction, 'categorie', None))

        try:
            if getattr(transaction, 'id', None) is not None:
                transaction.id = int(transaction.id)
        except Exception:
            pass

        try:
            if getattr(transaction, 'montant', None) is not None:
                transaction.montant = float(transaction.montant)
        except Exception:
            pass

        try:
            if getattr(transaction, 'libelle', None) is not None:
                transaction.libelle = str(transaction.libelle)
        except Exception:
            transaction.libelle = None

        try:
            if getattr(transaction, 'type', None) is not None:
                transaction.type = str(transaction.type)
        except Exception:
            transaction.type = None

        try:
            if getattr(transaction, 'date', None) is not None:
                if not isinstance(transaction.date, datetime):
                    try:
                        transaction.date = datetime.fromisoformat(str(transaction.date))
                    except Exception:
                        transaction.date = str(transaction.date)
        except Exception:
            transaction.date = None
        
        return transaction

    def get_total_transactions(
        self,
        date_debut: str | None = None,
        date_fin: str | None = None,
        categorie_nom: str | None = None,
        type_filtre: str | None = None
    ) -> float:
        """Calcule le total en tenant compte des types:
        - 'REVENU' ajoute le montant
        - 'DEPENSE' soustrait le montant
        Les montants stockés sont supposés positifs.
        """

        query = self.db.query(Transaction).join(Categorie)

        dt_debut = None
        dt_fin = None

        if date_debut:
            try:
                dt_debut = datetime.fromisoformat(date_debut)
            except ValueError:
                raise ValueError("Format de date de début invalide")

        if date_fin:
            try:
                dt_fin = datetime.fromisoformat(date_fin)
                dt_fin = dt_fin.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise ValueError("Format de date de fin invalide")

        if dt_debut and dt_fin and dt_debut > dt_fin:
            raise ValueError("La date de début ne peut pas être après la date de fin")

        if dt_debut:
            query = query.filter(Transaction.date >= dt_debut)

        if dt_fin:
            query = query.filter(Transaction.date <= dt_fin)

        # Filtre par catégorie si fourni
        if categorie_nom:
            query = query.filter(Categorie.nom.ilike(categorie_nom))

        if type_filtre:
            type_upper = type_filtre.upper()
            if type_upper not in ['REVENU', 'DEPENSE']:
                raise ValueError("Le type doit être 'REVENU' ou 'DEPENSE'")
            query = query.filter(Transaction.type == type_upper)

        transactions = query.all()

        total = 0.0
        for t in transactions:
            try:
                montant = float(getattr(t, 'montant', 0) or 0)
            except Exception:
                montant = 0.0

            ttype = str(getattr(t, 'type', '')).upper() if getattr(t, 'type', None) is not None else ''
            if ttype == 'DEPENSE':
                total -= montant
            else:
                total += montant

        return float(total)
    
    def delete_transaction(self, transaction_id: int) -> float:
        """Supprime une transaction par son id et retourne le nouveau total recalculé."""
        transaction = self.db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()

        if not transaction:
            raise ValueError("Transaction non trouvée")

        self.db.delete(transaction)
        self.db.commit()

        query = self.db.query(Transaction).join(Categorie)
        transactions = query.all()

        total = 0.0
        for t in transactions:
            try:
                montant = float(getattr(t, 'montant', 0) or 0)
            except Exception:
                montant = 0.0

            ttype = str(getattr(t, 'type', '')).upper() if getattr(t, 'type', None) is not None else ''
            if ttype == 'DEPENSE':
                total -= montant
            else:
                total += montant

        return float(total)