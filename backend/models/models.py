from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
import enum

# Erreur métier :
class BudgetAlreadyExistsError(Exception):
    pass

class BudgetNotFoundError(Exception):
    pass

class CategorieNotFoundError(Exception):
    pass

class UserAlreadyExistsError(Exception):
    pass

class InvalidCredentialsError(Exception):
    pass

class UserNotFoundError(Exception):
    pass

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

    # getter qui renvoie le nom de la catégorie
    @property
    def categorie(self):
        # si un cache intermédiaire a été défini (par le service), l'utiliser
        if getattr(self, '_categorie_cache', None) is not None:
            return self._categorie_cache
        return self.categorie_obj.nom if self.categorie_obj else None

    # setter permettant d'autoriser des assignations sûres (utilisé par le service)
    @categorie.setter
    def categorie(self, value):
        try:
            if value is None:
                self._categorie_cache = None
            elif isinstance(value, str):
                self._categorie_cache = value
            elif hasattr(value, 'nom'):
                self._categorie_cache = value.nom
            else:
                self._categorie_cache = str(value)
        except Exception:
            self._categorie_cache = None

class Budget(Base):
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, index=True)
    montant_fixe = Column(Float, nullable=False)
    debut_periode = Column(Date, nullable=False)
    fin_periode = Column(Date, nullable=False)
    
    categorie_id = Column(Integer, ForeignKey('categorie.id'), nullable=False)

    utilisateur_id = Column(Integer, nullable=True)


class User(Base):
    __tablename__ = "utilisateur"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)