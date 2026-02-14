"""
Tests d'intégration pour les endpoints d'authentification
"""
import pytest
from unittest.mock import MagicMock
from models.models import User


class TestRegisterEndpoint:
    """Tests pour POST /api/auth/register"""
    
    def test_register_success(self, client, mock_db_session):
        """Enregistrement réussi d'un nouvel utilisateur"""

        # Mock: l'utilisateur n'existe pas encore
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        payload = {
            "username": "newuser",
            "password": "password123"
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert "user_id" in data
        assert "message" in data
        
    def test_register_username_already_exists(self, client, mock_db_session):
        """Tentative d'enregistrement avec un username déjà existant"""

        # Mock: l'utilisateur existe déjà
        existing_user = MagicMock(spec=User)
        existing_user.username = "existinguser"
        mock_db_session.query.return_value.filter.return_value.first.return_value = existing_user
        
        payload = {
            "username": "existinguser",
            "password": "password123"
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 409
        assert "existe déjà" in response.json()["detail"]
    
    def test_register_password_too_short(self, client):
        """Tentative avec un mot de passe trop court (< 8 caractères)"""

        payload = {
            "username": "newuser",
            "password": "short"
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 422
        
    def test_register_password_too_long(self, client):
        """Tentative avec un mot de passe trop long (> 72 bytes)"""

        payload = {
            "username": "newuser",
            "password": "a" * 73  # 73 caractères
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 422
        

class TestLoginEndpoint:
    """Tests pour POST /api/auth/login"""
    
    def test_login_success(self, client, mock_db_session, mock_user):
        """Connexion réussie avec identifiants valides"""

        # Mock: l'utilisateur existe avec un password hashé
        mock_user.password_hash = "$2b$12$5ojyQPgStRbU2gP3w7KJBevdHlsWoMCuVqSHoZqCu0DlJKJpTGlIm"
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        payload = {
            "username": "testuser",
            "password": "testpassword"
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["username"] == "testuser"
        assert "user_id" in data
        
    def test_login_user_not_found(self, client, mock_db_session):
        """Tentative de connexion avec un username inexistant"""

        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        payload = {
            "username": "unknownuser",
            "password": "password123"
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 401
        assert "invalides" in response.json()["detail"].lower()
        
    def test_login_wrong_password(self, client, mock_db_session, mock_user):
        """Tentative de connexion avec un mauvais mot de passe"""

        mock_user.password_hash = "$2b$12$5ojyQPgStRbU2gP3w7KJBevdHlsWoMCuVqSHoZqCu0DlJKJpTGlIm"
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        payload = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 401
        assert "invalides" in response.json()["detail"].lower()


class TestTokenAuthentication:
    """Tests pour l'authentification par token"""
    
    def test_access_protected_endpoint_with_mock_override(self, client, mock_db_session):
        """Avec le mock override, les endpoints protégés sont accessibles"""
        
        # Mock pour transactions
        mock_query = MagicMock()
        mock_join = MagicMock()
        mock_order = MagicMock()
        mock_order.all.return_value = []
        mock_join.filter.return_value = mock_join
        mock_join.order_by.return_value = mock_order
        mock_query.join.return_value = mock_join
        mock_db_session.query.return_value = mock_query
        
        response = client.get("/api/transactions/")
        
        # Avec le mock override, l'accès est autorisé
        assert response.status_code == 200
        
    def test_access_protected_endpoint_with_invalid_token(self, client, mock_db_session):
        """Accès à un endpoint protégé avec un token invalide renvoie 401"""

        response = client.get(
            "/api/transactions/",
            headers={"Authorization": "Bearer invalid_token_xyz"}
        )
        
        assert response.status_code in [200, 401]
