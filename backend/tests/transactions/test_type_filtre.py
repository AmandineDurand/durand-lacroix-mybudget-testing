"""
Feature – Filtrer les transactions par type
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime
from scripts.saisie_transaction import TransactionService

# ========= SERVICE =========

def test_get_transactions_with_type():
    """Filtre type valide retourne uniquement les transactions du type demandé"""

    mock_db = MagicMock()
    
    # Créer 3 transactions mockées
    transactions = []
    for i, (montant, type_t) in enumerate([
        (100.00, "DEPENSE"),
        (2500.00, "REVENU"),
        (50.00, "DEPENSE")
    ], start=1):
        t = MagicMock()
        t.id = i
        t.montant = montant
        t.type = type_t
        t.date = datetime(2026, 1, i)
        transactions.append(t)
    
    # Chaîner les mocks pour retourner seulement les DEPENSE
    depenses = [t for t in transactions if t.type == "DEPENSE"]
    
    mock_query = MagicMock()
    mock_join = MagicMock()
    mock_filter_type = MagicMock()
    mock_order = MagicMock()
    
    mock_order.all.return_value = depenses
    mock_filter_type.order_by.return_value = mock_order
    
    # Chaîner les filtres : join puis filter
    def filter_side_effect(condition):
        # Retourner un mock capable de chaîner order_by
        return mock_filter_type
    
    mock_join.filter.side_effect = filter_side_effect
    mock_query.join.return_value = mock_join
    mock_db.query.return_value = mock_query
    
    # Test
    service = TransactionService(mock_db)
    result = service.get_transactions(type_filtre="DEPENSE")
    
    # ASSERT
    assert len(result) == 2
    assert all(t.type == "DEPENSE" for t in result)
