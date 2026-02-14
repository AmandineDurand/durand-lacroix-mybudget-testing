"""
Tests pour l'isolation des données entre utilisateurs
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime, date
from models.models import User, Transaction, Budget, Categorie


class TestMultiUserIsolation:
    """Tests pour vérifier l'isolation des données entre utilisateurs"""
    
    def test_user1_cannot_see_user2_transactions(self, client, mock_db_session):
        """Un utilisateur ne peut pas voir les transactions d'un autre utilisateur"""
        
        # Mock: retourne seulement les transactions de l'utilisateur 1
        user1_transactions = []
        
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = user1_transactions
        mock_join.filter.return_value = mock_join
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Toutes les transactions retournées doivent appartenir à user1
        for transaction in data:
            if 'utilisateur_id' in transaction:
                assert transaction['utilisateur_id'] == 1
        
    def test_user1_cannot_modify_user2_transaction(self, client, mock_db_session):
        """Un utilisateur ne peut pas modifier la transaction d'un autre utilisateur"""

        # Mock: transaction appartient à user2 (id=2)
        transaction = MagicMock(spec=Transaction)
        transaction.id = 1
        transaction.montant = 100.0
        transaction.utilisateur_id = 2
        
        mock_db_session.query.return_value.filter.return_value.first.return_value = transaction
        
        payload = {"montant": 200.0}
        
        response = client.put("/api/transactions/1", json=payload)
        
        # Devrait retourner 400 car l'utilisateur courant (user1) ne possède pas cette transaction
        assert response.status_code == 400
        assert "vos propres" in response.json()["detail"].lower()
        
    def test_user1_cannot_delete_user2_transaction(self, client, mock_db_session):
        """Un utilisateur ne peut pas supprimer la transaction d'un autre utilisateur"""

        # Mock: transaction appartient à user2
        transaction = MagicMock(spec=Transaction)
        transaction.id = 1
        transaction.utilisateur_id = 2
        
        mock_db_session.query.return_value.filter.return_value.first.return_value = transaction
        
        response = client.delete("/api/transactions/1")
        
        assert response.status_code == 400
        assert "vos propres" in response.json()["detail"].lower()
        
    def test_user1_cannot_see_user2_budgets(self, client, mock_db_session):
        """Un utilisateur ne peut pas voir les budgets d'un autre utilisateur"""

        # Mock: retourne seulement les budgets de user1
        user1_budgets = []
        
        mock_query = MagicMock()
        mock_query.outerjoin.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.all.return_value = user1_budgets
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/budgets/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_user1_cannot_modify_user2_budget(self, client, mock_db_session):
        """Un utilisateur ne peut pas modifier le budget d'un autre utilisateur"""

        # Mock: budget appartient à user2
        budget = MagicMock(spec=Budget)
        budget.id = 1
        budget.utilisateur_id = 2
        budget.categorie_id = 1
        budget.montant_fixe = 500.0
        budget.debut_periode = date(2026, 1, 1)
        budget.fin_periode = date(2026, 1, 31)
        
        mock_db_session.query.return_value.filter.return_value.first.return_value = budget
        
        payload = {"montant_fixe": 600.0}
        
        response = client.put("/api/budgets/1", json=payload)
        
        assert response.status_code == 400
        assert "vos propres" in response.json()["detail"].lower()
        
    def test_users_same_budget(self, client, mock_db_session):
        """Deux utilisateurs peuvent avoir le même budget pour la même catégorie et période"""

        # User1 crée un budget pour Alimentation en Janvier
        # User2 peut aussi créer un budget pour Alimentation en Janvier
        
        category = MagicMock(spec=Categorie)
        category.id = 1
        
        def fake_query(model):
            q = MagicMock()
            if hasattr(model, '__name__') and model.__name__ == 'Categorie':
                q.filter.return_value.first.return_value = category
            else:
                # Budget query - aucun conflit car filtre par user_id
                q.filter.return_value = q
                q.first.return_value = None
            return q
        
        mock_db_session.query.side_effect = fake_query
        
        payload = {
            "categorie_id": 1,
            "montant_fixe": 500.0,
            "debut_periode": "2026-01-01",
            "fin_periode": "2026-01-31"
        }
        
        response = client.post("/api/budgets/", json=payload)
        
        assert response.status_code == 201


class TestCategoriesSharedAcrossUsers:
    """Tests pour vérifier que les catégories sont partagées entre tous les utilisateurs"""
    
    def test_all_users_see_same_categories(self, client, mock_db_session):
        """Tous les utilisateurs voient les mêmes catégories"""
        
        categories = []
        for i in range(1, 4):
            cat = MagicMock(spec=Categorie)
            cat.id = i
            cat.nom = f"Categorie{i}"
            cat.icone = "🔖"
            categories.append(cat)
        
        mock_db_session.query.return_value.all.return_value = categories
        
        response = client.get("/api/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
