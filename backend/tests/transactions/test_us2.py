"""
US2 – Lister les transactions

Critères d’acceptation :
- toutes les transactions sont retournées
- HTTP 200
- tableau JSON 
- tous les attributs sont présents
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime
from pydantic import ValidationError
from schemas.transaction import TransactionRead
from scripts.saisie_transaction import TransactionService

# ========= SCHÉMAS =========

class TestSchemas:
    """Tests unitaires des schémas Pydantic"""

    def test_transaction_read_requires_id(self):
        """Validation TransactionRead requiert un ID"""
        
        t = TransactionRead(
            id=1,
            montant=100.00,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie="test"
        )
        assert t.id == 1

    def test_transaction_read_without_id_invalid(self):
        """Validation TransactionRead sans ID est invalide"""
        
        with pytest.raises(ValidationError):
            TransactionRead(
                montant=100.00,
                libelle="Test",
                type="DEPENSE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )

# ========= SERVICE =========

class TestService:
    """Tests unitaires du service - Logique métier isolée"""

    def test_get_transactions(self):
        """Récupération sans filtre"""
        
        # Mock DB
        mock_db = MagicMock()
        mock_t1 = MagicMock()
        mock_t1.id = 1
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = [mock_t1]
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db.query.return_value = mock_query
        
        # Test
        service = TransactionService(mock_db)
        result = service.get_transactions()
        
        assert len(result) == 1

    def test_get_transactions_sorted_descending(self):
        """Transactions triées par date décroissante"""
        
        # Mock DB
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db.query.return_value = mock_query
        
        # Test
        service = TransactionService(mock_db)
        service.get_transactions()
        
        # Vérifie que order_by a été appelé
        mock_join.order_by.assert_called()

# ========= API =========

class TestAPI:
    """Tests d'intégration pour la liste des transactions"""

    def test_full_list(self, client, mock_db_session):
        """Liste complète : API → Router → Service → Model"""

        # ARRANGE - Créer 3 transactions mockées
        transactions = []
        for i, (montant, libelle, type_t, cat) in enumerate([
            (45.50, "Courses", "DEPENSE", "alimentation"),
            (2500.00, "Salaire", "REVENU", "salaire"),
            (800.00, "Loyer", "DEPENSE", "logement")
        ], start=1):
            t = MagicMock()
            t.id = i
            t.montant = montant
            t.libelle = libelle
            t.type = type_t
            t.date = datetime(2026, 1, i)
            cat_obj = MagicMock()
            cat_obj.nom = cat
            t.categorie_obj = cat_obj
            t.categorie = cat
            transactions.append(t)
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = transactions
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        # ACT
        response = client.get("/api/transactions")
        
        # ASSERT
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["montant"] == 45.50
        assert data[1]["type"] == "REVENU"
        assert data[2]["libelle"] == "Loyer"

    def test_list_empty(self, client, mock_db_session):
        """Liste vide"""
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions")
        
        assert response.status_code == 200
        assert response.json() == []

    def test_retrieval_error(self, client, mock_db_session):
        """Gestion erreur lors récupération"""

        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_join.order_by.side_effect = Exception("DB Error")
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions")
        assert response.status_code == 500