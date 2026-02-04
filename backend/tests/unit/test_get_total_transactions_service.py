import pytest
from unittest.mock import MagicMock
from scripts.saisie_transaction import TransactionService

def test_total_with_mixed_types(mock_db_session):
    from unittest.mock import MagicMock
    from scripts.saisie_transaction import TransactionService
    from datetime import datetime

    t1 = MagicMock(); t1.montant = 100.0; t1.type = "REVENU"; t1.date = datetime(2026,1,1)
    t2 = MagicMock(); t2.montant = 40.0;  t2.type = "DEPENSE"; t2.date = datetime(2026,1,2)
    t3 = MagicMock(); t3.montant = 10.5;  t3.type = "REVENU"; t3.date = datetime(2026,1,3)

    q = MagicMock()
    mock_db_session.query.return_value = q
    q.join.return_value = q
    q.filter.return_value = q
    q.all.return_value = [t1, t2, t3]

    service = TransactionService(mock_db_session)
    total = service.get_total_transactions()
    # attendu : +100 -40 +10.5 = 70.5
    assert pytest.approx(total, rel=1e-6) == 70.5
