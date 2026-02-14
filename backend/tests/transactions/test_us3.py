"""
US3 – Filtrer les transactions par période

Critères d’acceptation :
- date début et fin valides
- HTTP 200 / 400
- retourner les bonnes transactions selon les dates
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime
from scripts.saisie_transaction import TransactionService

# ========= SERVICE =========

class TestService:
    """Tests unitaires du service - Logique métier isolée"""

    def test_get_transactions_with_start_date(self):
        """Filtre date_debut appliqué"""
        
        # Mock DB
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db.query.return_value = mock_query
        
        # Test
        service = TransactionService(mock_db)
        service.get_transactions(date_debut="2026-01-01")
        
        # Vérifie que filter a été appelé
        mock_join.filter.assert_called()

    def test_get_transactions_start_date_invalid(self):
        """date_debut invalide lève ValueError"""
        
        mock_db = MagicMock()
        service = TransactionService(mock_db)
        
        with pytest.raises(ValueError) as exc:
            service.get_transactions(date_debut="date-invalide")
        
        assert "invalide" in str(exc.value).lower()

    def test_get_transactions_end_date_invalid(self):
        """date_fin invalide lève ValueError"""
        
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        
        service = TransactionService(mock_db)
        
        with pytest.raises(ValueError) as exc:
            service.get_transactions(date_fin="invalid")
        
        assert "invalide" in str(exc.value).lower()

# ========= API =========

class TestAPI:
    """Tests d'intégration pour le filtrage par période"""

    def test_period_filtering(self, client, mock_db_session):
        """Filtrage date_debut + date_fin : API → Router → Service"""

        # Transactions dans période
        transactions = []
        for i in [2, 3]:
            t = MagicMock()
            t.id = i
            t.montant = 100.0
            t.libelle = f"Transaction {i}"
            t.type = "DEPENSE"
            t.date = datetime(2026, 1, i)
            cat = MagicMock()
            cat.nom = "test"
            t.categorie_obj = cat
            t.categorie = "test"
            transactions.append(t)
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = transactions
        # Make filter chainable - filter() returns self for multiple filter calls
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?date_debut=2026-01-01&date_fin=2026-01-05")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        ids = [t["id"] for t in data]
        assert 2 in ids and 3 in ids

    def test_period_empty(self, client, mock_db_session):
        """Période sans résultat"""

        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?date_fin=2026-01-05")
        
        assert response.status_code == 200
        assert response.json() == []

    def test_invalid_date(self, client):
        """Date invalide"""

        response = client.get("/api/transactions?date_debut=date-invalide")
        
        assert response.status_code == 400
        assert "invalide" in response.json()["detail"].lower()

    def test_filter_with_start_date_only(self, client, mock_db_session):
        """Filtrage avec uniquement date_debut"""

        t = MagicMock()
        t.id = 1
        t.montant = 100.0
        t.libelle = "Transaction"
        t.type = "DEPENSE"
        t.date = datetime(2026, 1, 10)
        cat = MagicMock()
        cat.nom = "test"
        t.categorie_obj = cat
        t.categorie = "test"
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = [t]
        # Make filter chainable
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?date_debut=2026-01-01")
        
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_filter_with_end_date_only(self, client, mock_db_session):
        """Filtrage avec uniquement date_fin"""

        t = MagicMock()
        t.id = 1
        t.montant = 100.0
        t.libelle = "Transaction"
        t.type = "DEPENSE"
        t.date = datetime(2025, 12, 15)
        cat = MagicMock()
        cat.nom = "test"
        t.categorie_obj = cat
        t.categorie = "test"
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = [t]
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?date_fin=2025-12-31")
        assert response.status_code == 200