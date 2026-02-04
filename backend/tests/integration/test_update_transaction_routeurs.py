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

		# Préparer le mock pour renvoyer la transaction existante
		mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

		# S'assurer que la propriété 'categorie' est une chaîne (comme sur le modèle réel)
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

