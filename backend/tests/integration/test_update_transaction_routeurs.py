import pytest
from datetime import datetime
from unittest.mock import MagicMock
from schemas.transaction import TransactionCreate

class TestUpdateTransactionRouter:
	def test_update_transaction_endpoint_success(self, client, mock_db_session, mock_transaction):
		"""Teste que la mise à jour d'une transaction renvoie 200 et les données modifiées."""

		payload = {
			"montant": 75.0,
			"libelle": "Nouvelle libelle"
		}

		mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

		if hasattr(mock_transaction, 'categorie_obj') and mock_transaction.categorie_obj:
			try:
				mock_transaction.categorie = mock_transaction.categorie_obj.nom
			except Exception:
				mock_transaction.categorie = str(mock_transaction.categorie_obj)

		response = client.put("/api/transactions/1", json=payload)

		assert response.status_code == 200
		data = response.json()
		assert data["id"] == mock_transaction.id
		assert data["montant"] == 75.0
		assert data["libelle"] == "Nouvelle libelle"

	def test_update_transaction_endpoint_nonexistent(self, client, mock_db_session):
		"""Teste que PUT sur une transaction inexistante retourne 400"""

		# Simule l'absence de transaction dans la DB
		mock_db_session.query.return_value.filter.return_value.first.return_value = None

		update_data = {"montant": 75.0}
		response = client.put("/api/transactions/999999", json=update_data)

		assert response.status_code == 400
		assert "non trouvée" in response.json()["detail"].lower()

