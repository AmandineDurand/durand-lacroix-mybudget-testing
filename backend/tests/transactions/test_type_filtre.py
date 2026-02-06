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

def test_get_transactions_type_invalide():
    """Filtre type invalide lève une ValueError"""
    
    # Mock DB
    mock_db = MagicMock()
    mock_query = MagicMock()
    mock_join = MagicMock()
    mock_filter = MagicMock()
    mock_filter.filter.side_effect = lambda x: mock_filter
    mock_join.filter.side_effect = lambda x: mock_filter
    mock_query.join.return_value = mock_join
    mock_db.query.return_value = mock_query
    
    # Test
    service = TransactionService(mock_db)
    
    with pytest.raises(ValueError, match="Le type doit être"):
        service.get_transactions(type_filtre="INVALID")

def test_get_total_transactions_with_type_filter():
    """get_total_transactions filtre par type et calcule correctement"""
    
    mock_db = MagicMock()
    
    transactions = []
    for montant, type_t in [
        (100.00, "DEPENSE"),    # -100
        (2500.00, "REVENU"),    # +2500
        (50.00, "DEPENSE")      # -50
    ]:
        t = MagicMock()
        t.montant = montant
        t.type = type_t
        t.date = datetime(2026, 1, 1)
        transactions.append(t)
    
    depenses = [t for t in transactions if t.type == "DEPENSE"]
    
    mock_query = MagicMock()
    mock_join = MagicMock()
    
    def filter_side_effect(condition):
        return mock_query
    
    mock_join.filter.side_effect = filter_side_effect
    mock_query.join.return_value = mock_join
    mock_query.all.return_value = depenses
    mock_db.query.return_value = mock_query
    
    service = TransactionService(mock_db)
    total = service.get_total_transactions(type_filtre="DEPENSE")
    
    assert total == -150.0
    with pytest.raises(ValueError, match="Le type doit être"):
        service.get_total_transactions(type_filtre="INVALID")

# ========= API =========

def test_list_filter_by_type(client, mock_db_session):
        """Filtre par type insensible à la casse : minuscules acceptées"""
        
        transactions = []
        t = MagicMock()
        t.id = 1
        t.montant = 2500.00
        t.libelle = "Salaire"
        t.type = "REVENU"
        t.date = datetime(2026, 1, 1)
        cat_obj = MagicMock()
        cat_obj.nom = "salaire"
        t.categorie_obj = cat_obj
        t.categorie = "salaire"
        transactions.append(t)
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = transactions
        mock_filter.order_by.return_value = mock_order
        # Make filter chainable - multiple filter() calls should work
        mock_filter.filter.return_value = mock_filter
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?type_filtre=revenu")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "REVENU"

def test_total_transactions_with_type_filter(client, mock_db_session):
        """total_transactions endpoint filtre par type"""
        
        transactions = []
        for montant, type_t in [
            (100.00, "DEPENSE"),
            (2500.00, "REVENU")
        ]:
            t = MagicMock()
            t.montant = montant
            t.type = type_t
            t.date = datetime(2026, 1, 1)
            transactions.append(t)
        
        depenses = [t for t in transactions if t.type == "DEPENSE"]
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = depenses
        
        # Make filter chainable and order_by return mock_order
        mock_join.filter.return_value = mock_join
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        
        # For get_total_transactions, we need different mock behavior
        # The query chain should be: query(Transaction).join(Categorie).filter(...).all()
        # without order_by
        def custom_all():
            return depenses
        
        mock_join.all.return_value = depenses
        mock_query.all.return_value = depenses
        
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions/total?type_filtre=DEPENSE")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == -100.0  # DEPENSE = négatif