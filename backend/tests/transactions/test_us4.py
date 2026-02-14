"""
US4 – Filtrer les transactions par catégorie

Critères d’acceptation :
- catégorie existante
- HTTP 200
- retourner les bonnes transactions selon la catégorie
- système insensible à la casse
"""
from unittest.mock import MagicMock
from datetime import datetime
from scripts.saisie_transaction import TransactionService

# ========= SERVICE =========

class TestService:
    """Tests unitaires du service - Logique métier isolée"""

    def test_get_transactions_with_category(self):
        """Filtre categorie appliqué"""
        
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
        service.get_transactions(categorie_nom="alimentation")
        
        # Vérifie que filter a été appelé pour catégorie
        mock_join.filter.assert_called()

# ========= API =========

class TestAPI:
    """Tests d'intégration pour le filtrage par catégorie"""

    def test_category_filtering(self, client, mock_db_session):
        """Filtrage catégorie insensible casse : API → Router → Service"""

        transactions = []
        for i in [1, 4]:
            t = MagicMock()
            t.id = i
            t.montant = 50.0
            t.libelle = f"Transaction {i}"
            t.type = "DEPENSE"
            t.date = datetime(2026, 1, i)
            cat = MagicMock()
            cat.nom = "alimentation"
            t.categorie_obj = cat
            t.categorie = "alimentation"
            transactions.append(t)
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = transactions
        # Make filter chainable
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?categorie=ALIMENTATION")
        
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_category_empty(self, client, mock_db_session):
        """Catégorie sans résultat"""

        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        # Make filter chainable
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?categorie=transport")
        
        assert response.status_code == 200
        assert response.json() == []

    def test_combined_filters(self, client, mock_db_session):
        """Filtres combinés (période + catégorie) : interaction entre filtres multiples"""

        transactions = []
        for i in [1, 3]:
            t = MagicMock()
            t.id = i
            t.montant = 50.0
            t.libelle = f"Transaction {i}"
            t.type = "DEPENSE"
            t.date = datetime(2026, 1, i)
            cat = MagicMock()
            cat.nom = "alimentation"
            t.categorie_obj = cat
            t.categorie = "alimentation"
            transactions.append(t)
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = transactions
        # Make filter chainable for multiple filters
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        mock_join.filter.return_value = mock_filter
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions?categorie=alimentation&date_debut=2026-01-01")
        
        assert response.status_code == 200
        assert len(response.json()) == 2