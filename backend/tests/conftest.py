import pytest
import os
import sys
from unittest.mock import MagicMock
from datetime import date, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from models.models import Transaction, Budget, Categorie

# --- FIXTURES DE DONNÉES (DATA OBJECTS) ---

@pytest.fixture
def mock_categorie():
    """Crée un faux objet Categorie basé sur le modèle SQLAlchemy"""
    # On utilise un MagicMock qui imite la structure de l'objet Categorie
    cat = MagicMock(spec=Categorie)
    cat.id = 1
    cat.nom = "Alimentation"
    cat.icone = "🍔"
    return cat

@pytest.fixture
def mock_transaction():
    """Crée un faux objet Transaction basé sur le modèle SQLAlchemy"""
    transaction = MagicMock(spec=Transaction)
    transaction.id = 1
    transaction.montant = 50.0
    transaction.type = "DEPENSE"
    transaction.date = datetime(2026, 1, 5)
    transaction.categorie_id = 1
    transaction.categorie_obj = mock_categorie
    return transaction

@pytest.fixture
def mock_budget():
    """Crée un faux objet Budget basé sur le modèle SQLAlchemy"""
    budget = MagicMock(spec=Budget)
    budget.id = 1
    budget.categorie_id = 1
    budget.montant_fixe = 100.0
    budget.debut_periode = date(2026, 1, 1)
    budget.fin_periode = date(2026, 1, 31)
    return budget

@pytest.fixture
def mock_category_list():
    """Retourne une liste de fausses catégories pour les tests d'agrégation"""
    c1 = MagicMock(spec=Categorie)
    c1.id = 1
    c1.nom = "Alimentation"
    c1.icone = "🍔"

    c2 = MagicMock(spec=Categorie)
    c2.id = 2
    c2.nom = "Transport"
    c2.icone = "🚗"

    return [c1, c2]

@pytest.fixture
def mock_transaction_list(mock_categorie):
    """Retourne une liste de fausses transactions pour les tests d'agrégation"""
    t1 = MagicMock(spec=Transaction)
    t1.id = 1
    t1.montant = 50.0
    t1.type = "DEPENSE"
    t1.date = datetime(2026, 1, 5)
    t1.categorie_id = 1
    t1.categorie_obj = mock_categorie

    t2 = MagicMock(spec=Transaction)
    t2.id = 2
    t2.montant = 25.50
    t2.type = "REVENU"
    t2.date = datetime(2026, 1, 15)
    t2.categorie_id = 1
    t2.categorie_obj = mock_categorie

    t3 = MagicMock(spec=Transaction)
    t3.id = 3
    t3.montant = 100.0
    t3.type = "DEPENSE"
    t3.date = datetime(2025, 12, 31) # Hors période
    t3.categorie_id = 1
    t3.categorie_obj = mock_categorie
    
    return [t1, t2, t3]

# --- FIXTURES D'INFRASTRUCTURE (MOCKS DB) ---

@pytest.fixture
def mock_db_session():
    """
    Crée un Mock complet de la Session SQLAlchemy.
    C'est le cœur de notre stratégie de test sans DB réelle.
    """
    session = MagicMock()
    
    # Configuration de base : add, commit, refresh ne font rien (pass)
    session.add.return_value = None
    session.commit.return_value = None
    session.refresh.return_value = None
    session.rollback.return_value = None
    
    def side_effect_refresh(instance):
            if hasattr(instance, 'id') and instance.id is None:
                instance.id = 1 
            return None

    session.refresh.side_effect = side_effect_refresh

    return session

@pytest.fixture
def client(mock_db_session):
    """
    Client FastAPI qui utilise la fausse session DB via override_dependency.
    Permet de tester les routes sans lancer de vraie base.
    """
    from fastapi.testclient import TestClient
    from app import app
    from database import get_db

    def override_get_db():
        try:
            yield mock_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    # Nettoyage après les tests
    app.dependency_overrides.clear()