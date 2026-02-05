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

	def test_update_transaction_endpoint_montant_negatif(self, client):
		"""Teste que PUT avec montant négatif retourne 422 (validation Pydantic)"""

		payload = {"montant": -10.0}
		response = client.put("/api/transactions/1", json=payload)

		assert response.status_code == 422
		errors = response.json().get("detail", [])
		assert any(
			"montant" in str(err.get("loc", [])) or "Le montant doit" in err.get("msg", "")
			for err in errors
		)

	def test_update_transaction_endpoint_categorie_inexistante(self, client, mock_db_session, mock_transaction):
		"""Teste que PUT avec catégorie inexistante retourne 400"""

		# Le service doit retrouver la transaction existante, puis échouer à trouver la nouvelle catégorie
		def fake_query(model):
			q = MagicMock()
			if model.__name__ == 'Transaction':
				q.filter.return_value.first.return_value = mock_transaction
			else:
				q.filter.return_value.first.return_value = None
			return q

		mock_db_session.query.side_effect = fake_query

		payload = {"categorie": "Inexistante"}
		response = client.put("/api/transactions/1", json=payload)

		assert response.status_code == 400
		assert "n'existe" in response.json()["detail"].lower()

	def test_update_transaction_endpoint_type_invalide(self, client, mock_db_session, mock_transaction):
		"""Teste que PUT avec type invalide retourne 400"""

		# La transaction existe
		mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

		payload = {"type": "INVALID_TYPE"}
		response = client.put("/api/transactions/1", json=payload)

		assert response.status_code == 400
		detail = response.json().get("detail", "").lower()
		assert "type" in detail or "doit" in detail or "revenu" in detail or "depense" in detail

	def test_update_transaction_modify_multiple_fields(self, client, mock_db_session, mock_transaction):
		"""Teste que PUT peut modifier plusieurs champs à la fois"""

		# transaction existante retournée par la DB
		mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

		new_date = "2026-02-01T12:00:00"
		payload = {
			"montant": 123.45,
			"libelle": "Modifié",
			"type": "REVENU",
			"date": new_date,
			"categorie": "Alimentation"
		}

		response = client.put("/api/transactions/1", json=payload)

		assert response.status_code == 200
		data = response.json()

		# vérifications minimales
		assert data["montant"] == 123.45
		assert data["libelle"] == "Modifié"
		# type peut être renvoyé en majuscules selon la logique
		assert data["type"].upper() == "REVENU"
		# date doit être une chaîne ISO ou None
		assert isinstance(data.get("date"), (str, type(None)))

	def test_update_transaction_put_empty_body_noop(self, client, mock_db_session, mock_transaction):
		"""Teste que PUT avec un body vide ne modifie rien et retourne 200"""

		# Arrange: la DB retourne la transaction existante
		mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

		# s'assurer que la propriété 'categorie' est une chaîne pour la sérialisation
		if hasattr(mock_transaction, 'categorie_obj') and mock_transaction.categorie_obj:
			try:
				mock_transaction.categorie = mock_transaction.categorie_obj.nom
			except Exception:
				mock_transaction.categorie = str(mock_transaction.categorie_obj)

		orig_montant = float(mock_transaction.montant)
		orig_libelle = str(mock_transaction.libelle)
		orig_type = str(mock_transaction.type)

		# Act: envoi d'un body vide
		response = client.put("/api/transactions/1", json={})

		# Assert
		assert response.status_code == 200
		data = response.json()
		assert data["montant"] == orig_montant
		assert data["libelle"] == orig_libelle
		assert data["type"] == orig_type

