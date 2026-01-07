from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, relationship
from pydantic import BaseModel, field_validator
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
import enum
from app import Base, get_db

# Enum pour le type de transaction
class TypeTransaction(str, enum.Enum):
    REVENU = "revenu"
    DEPENSE = "dépense"

# Modèle SQLAlchemy pour Catégorie
class Categorie(Base):
    __tablename__ = "categorie"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, unique=True)
    description = Column(String)
    icone = Column(String(10))
    
    # Relation
    transactions = relationship("Transaction", back_populates="categorie_obj")

# Modèle SQLAlchemy pour Transaction
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    montant = Column(Float, nullable=False)
    libelle = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Stocke 'revenu' ou 'dépense'
    date = Column(DateTime, nullable=False)
    categorie_id = Column(Integer, ForeignKey('categorie.id'), nullable=False)
    utilisateur_id = Column(Integer, nullable=True)  # Optionnel pour MVP
    
    # Relation
    categorie_obj = relationship("Categorie", back_populates="transactions")

# Schéma Pydantic
class TransactionSchema(BaseModel):
    id: Optional[int] = None
    montant: float
    libelle: str
    type: str
    categorie: str  # Nom de la catégorie (sera converti en categorie_id)
    date: str
    
    @field_validator('montant')
    @classmethod
    def montant_positif(cls, v):
        if v <= 0:
            raise ValueError("Le montant doit être positif")
        return v
    
    @field_validator('type')
    @classmethod
    def type_valide(cls, v):
        v_upper = v.upper()
        if v_upper not in ['REVENU', 'DEPENSE']:
            raise ValueError("Le type doit être 'REVENU' ou 'DEPENSE'")
        return v_upper
    
    @field_validator('date')
    @classmethod
    def date_valide(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError("La date n'est pas valide")
    
    class Config:
        from_attributes = True

# Router
router = APIRouter(prefix="/api", tags=["api"])

@router.post("/transactions", response_model=TransactionSchema, status_code=201)
def creer_transaction(
    transaction: TransactionSchema,
    db: Session = Depends(get_db)
):
    """
    USER STORY 1 : Ajouter une transaction
    """
    try:
        # Conversion de la date
        date_obj = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
        
        # Recherche de la catégorie par nom (insensible à la casse)
        categorie = db.query(Categorie).filter(
            Categorie.nom.ilike(transaction.categorie)
        ).first()
        
        if not categorie:
            raise HTTPException(
                status_code=400, 
                detail=f"La catégorie '{transaction.categorie}' n'existe pas. "
                       f"Catégories disponibles : {', '.join([c.nom for c in db.query(Categorie).all()])}"
            )
        
        # Création de la transaction
        db_transaction = Transaction(
            montant=transaction.montant,
            libelle=transaction.libelle,
            type=transaction.type,  # Directement REVENU ou DEPENSE
            categorie_id=categorie.id,
            date=date_obj,
            utilisateur_id=1  # NULL pour MVP sans authentification
        )
        
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        # Retour avec le nom de la catégorie
        return TransactionSchema(
            id=db_transaction.id,
            montant=db_transaction.montant,
            libelle=db_transaction.libelle,
            type=db_transaction.type,
            categorie=db_transaction.categorie_obj.nom,
            date=str(db_transaction.date)
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création : {str(e)}")

@router.get("/transactions", response_model=List[TransactionSchema])
def lister_transactions(
    date_debut: Optional[str] = Query(None, description="Date de début (format YYYY-MM-DD)"),
    date_fin: Optional[str] = Query(None, description="Date de fin (format YYYY-MM-DD)"),
    categorie: Optional[str] = Query(None, description="Catégorie à filtrer"),
    db: Session = Depends(get_db)
):
    """
    USER STORY 2, 3, 4 : Lister et filtrer les transactions
    """
    try:
        # Query de base avec jointure
        query = db.query(Transaction).join(Categorie)
        
        # Filtre par date de début
        if date_debut:
            try:
                date_debut_obj = datetime.fromisoformat(date_debut)
                query = query.filter(Transaction.date >= date_debut_obj)
            except ValueError:
                raise HTTPException(status_code=400, detail="La date de début n'est pas valide")
        
        # Filtre par date de fin
        if date_fin:
            try:
                date_fin_obj = datetime.fromisoformat(date_fin)
                date_fin_obj = date_fin_obj.replace(hour=23, minute=59, second=59)
                query = query.filter(Transaction.date <= date_fin_obj)
            except ValueError:
                raise HTTPException(status_code=400, detail="La date de fin n'est pas valide")
        
        # Filtre par catégorie (sur le nom)
        if categorie:
            query = query.filter(Categorie.nom.ilike(categorie))
        
        # Exécution de la requête
        transactions = query.order_by(Transaction.date.desc()).all()
        
        # Formatage de la réponse
        return [
            TransactionSchema(
                id=t.id,
                montant=float(t.montant),
                libelle=t.libelle,
                type=t.type,
                categorie=t.categorie_obj.nom,
                date=str(t.date)
            )
            for t in transactions
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération : {str(e)}")

# Endpoint bonus : lister les catégories disponibles
@router.get("/categories", response_model=List[dict])
def lister_categories(db: Session = Depends(get_db)):
    """Retourne la liste des catégories disponibles"""
    categories = db.query(Categorie).all()
    return [{"id": c.id, "nom": c.nom, "icone": c.icone} for c in categories]