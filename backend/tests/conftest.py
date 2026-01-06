import sys
import os
import pytest
from datetime import date


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importation des modules du projet après la configuration du path
from scripts.saisie_transaction import Transaction
from scripts.budget_manager import BudgetManager, Budget

# Données de test partagées)

@pytest.fixture
def manager():
    """
    Fournit une instance de BudgetManager pour chaque test.
    """
    return BudgetManager()

@pytest.fixture
def budget_alim():
    """
    Fournit un objet Budget pré-configuré.
    """
    return Budget("Alimentation", 300.0, 1, 1, 2026, 31, 1, 2026)

@pytest.fixture
def transaction_exemple():
    """
    Fournit une transaction standard pour les tests.
    """
    return Transaction(amount=25.50, category="Alimentation", date_obj=date(2026, 1, 6))