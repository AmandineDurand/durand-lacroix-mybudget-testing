import pytest
from unittest.mock import MagicMock
from models.models import Transaction, Categorie
from scripts.saisie_transaction import TransactionService

def test_delete_transaction_success(mock_db_session, mock_transaction, mock_transaction_list):
    """La suppression doit appeler delete+commit et renvoyer le total recalculé."""
    
    mock_query_find = MagicMock()
    mock_query_find.filter.return_value.first.return_value = mock_transaction
    
    remaining = [mock_transaction_list[1]]  # Seulement t2
    mock_query_total = MagicMock()
    mock_query_total.join.return_value.all.return_value = remaining
    
    mock_db_session.query.side_effect = [mock_query_find, mock_query_total]
    
    service = TransactionService(mock_db_session)
    total = service.delete_transaction(transaction_id=1)
    
    mock_db_session.delete.assert_called_once_with(mock_transaction)
    mock_db_session.commit.assert_called_once()
    
    assert pytest.approx(total, rel=1e-6) == 25.5

def test_delete_transaction_not_found(mock_db_session):
    """Si la transaction n'existe pas, une ValueError est levée."""
    q = MagicMock()
    q.filter.return_value.first.return_value = None
    mock_db_session.query.return_value = q
    
    service = TransactionService(mock_db_session)
    
    with pytest.raises(ValueError, match="Transaction non trouvée"):
        service.delete_transaction(transaction_id=999)
