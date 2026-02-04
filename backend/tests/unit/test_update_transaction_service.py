import pytest
from datetime import datetime
from unittest.mock import MagicMock
from models.models import Transaction, Categorie
from scripts.saisie_transaction import TransactionService


class TestUpdateTransactionService:
    """Tests unitaires du service de modification de transaction"""

    def test_update_transaction_montant_valid(self, mock_db_session):
        """Teste que le service peut modifier le montant"""
        
        # Arrange
        mock_transaction = MagicMock(spec=Transaction)
        mock_transaction.montant = 50.0
        
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction
        
        service = TransactionService(mock_db_session)
        
        # Act
        updated = service.update_transaction(transaction_id=1, montant=75.0)
        
        # Assert
        assert mock_transaction.montant == 75.0
        mock_db_session.commit.assert_called_once()

    def test_update_transaction_categorie_valid(self, mock_db_session):
        """Teste que le service peut changer la catégorie"""

        # Arrange
        mock_transaction = MagicMock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.categorie_id = 1
        
        new_categorie = MagicMock(spec=Categorie)
        new_categorie.id = 2
        
        # Première requête: transaction, deuxième: nouvelle catégorie
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_transaction,
            new_categorie
        ]
        
        service = TransactionService(mock_db_session)
        
        # Act
        updated = service.update_transaction(transaction_id=1, categorie="Transport")
        
        # Assert
        assert mock_transaction.categorie_id == 2
        mock_db_session.commit.assert_called_once()

    
    def test_update_transaction_all_fields(self, mock_db_session):
        """Teste que le service peut modifier tous les champs"""

        # Arrange
        old_categorie = MagicMock(spec=Categorie)
        old_categorie.id = 1
        
        new_categorie = MagicMock(spec=Categorie)
        new_categorie.id = 2
        
        mock_transaction = MagicMock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.montant = 50.0
        mock_transaction.libelle = "Courses"
        mock_transaction.type = "DEPENSE"
        mock_transaction.date = datetime(2026, 1, 5)
        mock_transaction.categorie_id = 1
        mock_transaction.categorie_obj = old_categorie
        
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_transaction,
            new_categorie
        ]
        
        service = TransactionService(mock_db_session)
        new_date = datetime(2026, 1, 20)
        
        # Act
        updated = service.update_transaction(
            transaction_id=1,
            montant=150.0,
            libelle="Trajet mensuel",
            type="REVENU",
            date=new_date,
            categorie="Transport"
        )
        
        # Assert
        assert mock_transaction.montant == 150.0
        assert mock_transaction.libelle == "Trajet mensuel"
        assert mock_transaction.type == "REVENU"
        assert mock_transaction.date == new_date
        assert mock_transaction.categorie_id == 2
        mock_db_session.commit.assert_called_once()

    def test_update_transaction_not_found(self, mock_db_session):
        """Teste que le service lève une exception si la transaction n'existe pas"""

        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        service = TransactionService(mock_db_session)
        
        with pytest.raises(ValueError, match="Transaction non trouvée"):
            service.update_transaction(transaction_id=999, montant=100.0)