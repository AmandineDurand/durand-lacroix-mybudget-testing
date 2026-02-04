import pytest
from unittest.mock import MagicMock
from scripts.saisie_transaction import TransactionService

def make_query_chain(mock_db_session, results):
    q = MagicMock()
    mock_db_session.query.return_value = q
    q.join.return_value = q
    q.filter.return_value = q
    q.all.return_value = results
    return q

def test_get_total_transactions_service_basic(mock_db_session, mock_transaction_list):
    service = TransactionService(mock_db_session)
    make_query_chain(mock_db_session, mock_transaction_list)

    total = service.get_total_transactions()

    assert pytest.approx(total, rel=1e-6) == -124.5
