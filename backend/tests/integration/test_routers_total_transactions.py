import pytest
from datetime import datetime
from unittest.mock import MagicMock
from models.models import Transaction


class TestTotalTransactionsIntegration:
    """Tests d'intégration pour l'endpoint GET /api/transactions/total"""

    def test_total_without_filters(self, client, mock_db_session, mock_category):
        """Test cas général : total sans filtres (toutes les transactions)"""

        t1 = MagicMock(spec=Transaction); t1.montant = 75.0; t1.type = "DEPENSE"; t1.date = datetime(2026, 1, 15); t1.categorie_obj = mock_category
        t2 = MagicMock(spec=Transaction); t2.montant = 125.0; t2.type = "REVENU"; t2.date = datetime(2026, 2, 1); t2.categorie_obj = mock_category

        mock_query = MagicMock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [t1, t2]
        mock_db_session.query.return_value = mock_query

        response = client.get("/api/transactions/total")

        assert response.status_code == 200
        assert response.json() == {"total": 50.0}