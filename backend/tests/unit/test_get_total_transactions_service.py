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


def test_get_total_with_date_filter(mock_db_session):
    from unittest.mock import MagicMock
    from datetime import datetime

    t1 = MagicMock(); t1.montant = 20.0; t1.type = "REVENU"; t1.date = datetime(2026,1,5)
    t2 = MagicMock(); t2.montant = 10.0; t2.type = "DEPENSE"; t2.date = datetime(2026,1,10)
    t3 = MagicMock(); t3.montant = 5.0;  t3.type = "REVENU"; t3.date = datetime(2025,12,31)

    q = MagicMock()
    mock_db_session.query.return_value = q
    q.join.return_value = q
    q.filter.return_value = q

    q.all.return_value = [t1, t2]

    service = TransactionService(mock_db_session)
    total = service.get_total_transactions(date_debut="2026-01-01", date_fin="2026-01-31")

    # attendu : +20 -10 = 10
    assert pytest.approx(total, rel=1e-6) == 10.0
    assert mock_db_session.query.return_value.filter.called

def test_get_total_transactions_date_order_invalid_raises(mock_db_session):
    """Si la date de fin est antérieure à la date de début, on doit lever ValueError."""
    
    service = TransactionService(mock_db_session)
    with pytest.raises(ValueError):
        service.get_total_transactions(date_debut="2026-02-10", date_fin="2026-01-01")
