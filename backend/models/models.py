from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
import enum


# type de transaction
class TypeTransaction(str, enum.Enum):
    REVENU = "revenu"
    DEPENSE = "dépense"

# Modèle SQLAlchemy pour la catégorie
class Categorie(Base):
    __tablename__ = "categorie"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, unique=True)
    description = Column(String)
    icone = Column(String(10))
    
    transactions = relationship("Transaction", back_populates="categorie_obj") # définit la relation avec transaction

# modèle SQLAlchemy pour la transaction
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    montant = Column(Float, nullable=False)
    libelle = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'revenu' ou 'dépense'
    date = Column(DateTime, nullable=False)
    categorie_id = Column(Integer, ForeignKey('categorie.id'), nullable=False)
    utilisateur_id = Column(Integer, nullable=True)  # pour futur usage multi-utilisateurs

    categorie_obj = relationship("Categorie", back_populates="transactions")

    @property
    def categorie(self):
        return self.categorie_obj.nom if self.categorie_obj else None

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    montant = Column(Float, nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    
    categorie_id = Column(Integer, ForeignKey('categorie.id'), nullable=False)