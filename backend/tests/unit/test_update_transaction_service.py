from datetime import datetime
from unittest.mock import MagicMock
from models.models import Transaction, Categorie
from scripts.saisie_transaction import TransactionService


class TestUpdateTransactionService:
    """Tests unitaires du service de modification de transaction"""

    def test_update_transaction_montant_valid(self, mock_db_session):
        """Teste que le service peut modifier le montant"""
        
        # Arrange
        mock_categorie = MagicMock(spec=Categorie)
        mock_categorie.id = 1
        mock_categorie.nom = "Alimentation"
        
        mock_transaction = MagicMock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.montant = 50.0
        mock_transaction.libelle = "Courses"
        mock_transaction.type = "DEPENSE"
        mock_transaction.date = datetime(2026, 1, 5)
        mock_transaction.categorie_id = 1
        mock_transaction.categorie_obj = mock_categorie
        
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