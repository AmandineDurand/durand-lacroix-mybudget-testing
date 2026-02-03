"""
US1 – Ajouter une transaction

Critères d’acceptation :
- tous les champs sont renseignés
- montant positif
- type valide
- date valide
- catégorie existante
- HTTP 201 / 400
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime
from pydantic import ValidationError
from schemas.transaction import TransactionCreate
from scripts.saisie_transaction import TransactionService

# ========= SCHÉMAS =========

class TestSchemas:
    """Tests unitaires des schémas Pydantic"""

    def test_positive_amount_accepted(self):
        """Validation montant positif accepté"""
        
        t = TransactionCreate(
            montant=100.50,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie="test"
        )
        assert t.montant == 100.50

    def test_negative_amount_rejected(self):
        """Validation montant négatif rejeté"""
        
        with pytest.raises(ValidationError) as exc:
            TransactionCreate(
                montant=-50.00,
                libelle="Test",
                type="DEPENSE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )
        assert "positif" in str(exc.value).lower()

    def test_zero_amount_rejected(self):
        """Validation montant zéro rejeté"""
        
        with pytest.raises(ValidationError):
            TransactionCreate(
                montant=0.00,
                libelle="Test",
                type="DEPENSE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )

    def test_income_type_accepted(self):
        """Validation type REVENU accepté"""
        
        t = TransactionCreate(
            montant=100.00,
            libelle="Test",
            type="REVENU",
            date=datetime(2026, 1, 1),
            categorie="test"
        )
        assert t.type == "REVENU"

    def test_type_case_conversion(self):
        """Validation conversion automatique revenu → REVENU"""
        
        t = TransactionCreate(
            montant=100.00,
            libelle="Test",
            type="revenu",
            date=datetime(2026, 1, 1),
            categorie="test"
        )
        assert t.type == "REVENU"

    def test_invalid_type_rejected(self):
        """Validation type invalide rejeté"""
        
        with pytest.raises(ValidationError):
            TransactionCreate(
                montant=100.00,
                libelle="Test",
                type="INVALIDE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )

    def test_required_field_amount(self):
        """Validation montant est obligatoire"""
        
        with pytest.raises(ValidationError):
            TransactionCreate(
                libelle="Test",
                type="DEPENSE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )

    def test_required_field_label(self):
        """Validation libellé est obligatoire"""
        
        with pytest.raises(ValidationError):
            TransactionCreate(
                montant=100.00,
                type="DEPENSE",
                date=datetime(2026, 1, 1),
                categorie="test"
            )

# ========= SERVICE =========

class TestService:
    """Tests unitaires du service - Logique métier isolée"""

    def test_create_transaction_with_valid_category(self):
        """Création transaction avec catégorie existante"""

        # Mock DB
        mock_db = MagicMock()
        mock_cat = MagicMock()
        mock_cat.id = 1
        mock_cat.nom = "test"
        
        # Mock query pour trouver catégorie
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_cat
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        # Test
        service = TransactionService(mock_db)
        data = TransactionCreate(
            montant=100.00,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie="test"
        )
        
        result = service.create_transaction(data)
        
        assert mock_db.add.called
        assert mock_db.commit.called

    def test_create_transaction_with_nonexistent_category(self):
        """Erreur si catégorie n'existe pas"""
        
        # Mock DB - catégorie non trouvée
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = None
        mock_query.filter.return_value = mock_filter
        mock_query.all.return_value = []
        mock_db.query.return_value = mock_query
        
        # Test
        service = TransactionService(mock_db)
        data = TransactionCreate(
            montant=100.00,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie="inexistante"
        )
        
        with pytest.raises(ValueError) as exc:
            service.create_transaction(data)
        
        assert "n'existe pas" in str(exc.value)

# ========= API =========

class TestAPI:
    """Tests d'intégration pour l'ajout de transactions via API"""

    def test_add_expense(self, client, mock_db_session, mock_category, mock_refresh):
        """Ajout dépense : API → Router → Service → Schema → Model"""
        
        # ARRANGE - Mock DB
        mock_category.id = 1
        mock_category.nom = "alimentation"
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_category
        mock_query.filter.return_value = mock_filter
        mock_db_session.query.return_value = mock_query

        mock_db_session.refresh.side_effect = mock_refresh
        
        # ACT - Requête API
        response = client.post("/api/transactions", json={
            "montant": 45.50,
            "libelle": "Courses Carrefour",
            "type": "DEPENSE",
            "categorie": "alimentation",
            "date": "2026-01-06T00:00:00"
        })
        
        # ASSERT - Vérifications
        assert response.status_code == 201
        data = response.json()
        assert data["montant"] == 45.50
        assert data["libelle"] == "Courses Carrefour"
        assert data["type"] == "DEPENSE"
        assert data["categorie"] == "alimentation"
        
        # Vérifie que la DB a été appelée
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_reject_negative_amount(self, client):
        """Rejet montant négatif : API → Router → Schema"""

        # ACT
        response = client.post("/api/transactions", json={
            "montant": -50.00,
            "libelle": "Loyer",
            "type": "REVENU",
            "categorie": "logement",
            "date": "2026-01-01T00:00:00"
        })
        
        # ASSERT
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert any("positif" in err["msg"].lower() for err in detail)

    def test_add_income(self, client, mock_db_session, mock_category, mock_refresh):
        """Ajout d'un REVENU"""
        
        mock_category.nom = "salaire"
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_category
        mock_query.filter.return_value = mock_filter
        mock_db_session.query.return_value = mock_query

        mock_db_session.refresh.side_effect = mock_refresh
        
        response = client.post("/api/transactions", json={
            "montant": 2500.00,
            "libelle": "Salaire",
            "type": "REVENU",
            "categorie": "salaire",
            "date": "2026-01-05T00:00:00"
        })
        
        assert response.status_code == 201
        assert response.json()["type"] == "REVENU"

    def test_type_conversion(self, client, mock_db_session, mock_category, mock_refresh):
        """Conversion lowercase → UPPERCASE"""
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_category
        mock_query.filter.return_value = mock_filter
        mock_db_session.query.return_value = mock_query

        mock_db_session.refresh.side_effect = mock_refresh
        
        response = client.post("/api/transactions", json={
            "montant": 100.00,
            "libelle": "Test",
            "type": "revenu",  # minuscule
            "categorie": "test",
            "date": "2026-01-01T00:00:00"
        })
        
        assert response.status_code == 201
        assert response.json()["type"] == "REVENU"  # converti

    def test_category_not_found(self, client, mock_db_session):
        """Catégorie inexistante"""
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = None  # Catégorie non trouvée
        mock_query.filter.return_value = mock_filter
        mock_query.all.return_value = []
        mock_db_session.query.return_value = mock_query
        
        response = client.post("/api/transactions", json={
            "montant": 50.00,
            "libelle": "Test",
            "type": "DEPENSE",
            "categorie": "inexistante",
            "date": "2026-01-01T00:00:00"
        })
        
        assert response.status_code == 400
        assert "n'existe pas" in response.json()["detail"]

    def test_db_error(self, client, mock_db_session, mock_category):
        """Gestion erreur DB"""
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = mock_category
        mock_query.filter.return_value = mock_filter
        mock_db_session.query.return_value = mock_query
        mock_db_session.commit.side_effect = Exception("DB Error")
        
        response = client.post("/api/transactions", json={
            "montant": 50.00,
            "libelle": "Test",
            "type": "DEPENSE",
            "categorie": "test",
            "date": "2026-01-01T00:00:00"
        })
        
        assert response.status_code == 500
