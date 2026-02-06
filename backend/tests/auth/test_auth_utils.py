"""
Tests unitaires pour les fonctions d'authentification (auth.py)
"""
import pytest
import bcrypt
import jwt
from datetime import timedelta, datetime, timezone
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    register_user,
    authenticate_user,
    get_current_user_from_header,
    get_current_user_from_token,
    get_current_user_optional,
    SECRET_KEY,
    ALGORITHM
)
from models.models import User, InvalidCredentialsError, UserAlreadyExistsError


class TestHashPassword:
    """Tests pour la fonction hash_password()"""
    
    def test_hash_password_success(self):
        """Hachage réussi d'un mot de passe valide"""

        password = "password123"
        hashed = hash_password(password)
        
        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")
        # Vérifie que le hash est valide en le vérifiant
        assert bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        
    def test_hash_password_too_short(self):
        """Tentative de hachage avec un mot de passe trop court (< 8 caractères)"""

        with pytest.raises(ValueError, match="au moins 8 caractères"):
            hash_password("short")
            
    def test_hash_password_empty(self):
        """Tentative de hachage avec un mot de passe vide"""

        with pytest.raises(ValueError, match="au moins 8 caractères"):
            hash_password("")
            
    def test_hash_password_too_long(self):
        """Tentative de hachage avec un mot de passe trop long (> 72 bytes)"""

        long_password = "a" * 73
        with pytest.raises(ValueError, match="trop long"):
            hash_password(long_password)


class TestVerifyPassword:
    """Tests pour la fonction verify_password()"""
    
    def test_verify_password_success(self):
        """Vérification réussie d'un mot de passe valide"""

        password = "password123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        
    def test_verify_password_wrong_password(self):
        """Vérification échoue avec un mauvais mot de passe"""

        password = "password123"
        hashed = hash_password(password)
        
        assert verify_password("wrongpassword", hashed) is False
        
    def test_verify_password_invalid_hash(self):
        """Vérification échoue avec un hash invalide"""

        password = "password123"
        invalid_hash = "invalid_hash_format"
        
        assert verify_password(password, invalid_hash) is False
        
    def test_verify_password_empty_hash(self):
        """Vérification échoue avec un hash vide"""

        assert verify_password("password123", "") is False


class TestCreateAccessToken:
    """Tests pour la fonction create_access_token()"""
    
    def test_create_token_default_expiry(self):
        """Création réussie d'un token avec expiration par défaut"""

        user_id = 1
        username = "testuser"
        
        token = create_access_token(user_id, username)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Décode et vérifie le contenu
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["user_id"] == user_id
        assert payload["username"] == username
        assert "exp" in payload
        
    def test_create_token_custom_expiry(self):
        """Création d'un token avec expiration personnalisée"""

        user_id = 1
        username = "testuser"
        custom_delta = timedelta(minutes=60)
        
        token = create_access_token(user_id, username, expires_delta=custom_delta)
        
        assert token is not None
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = exp_datetime - now
        
        # Doit être entre 59 et 61 minutes (tolérance pour le temps d'exécution)
        assert 59 <= delta.total_seconds() / 60 <= 61


class TestVerifyToken:
    """Tests pour la fonction verify_token()"""
    
    def test_verify_token_success(self):
        """Vérification réussie d'un token valide"""

        user_id = 1
        username = "testuser"
        token = create_access_token(user_id, username)
        
        token_data = verify_token(token)
        
        assert token_data["user_id"] == user_id
        assert token_data["username"] == username
        
    def test_verify_token_expired(self):
        """Vérification échoue avec un token expiré"""

        user_id = 1
        username = "testuser"

        # Crée un token expiré (expiration dans le passé)
        expired_delta = timedelta(minutes=-10)
        token = create_access_token(user_id, username, expires_delta=expired_delta)
        
        with pytest.raises(InvalidCredentialsError, match="expiré"):
            verify_token(token)
            
    def test_verify_token_invalid_signature(self):
        """Vérification échoue avec un token ayant une signature invalide"""

        # Crée un token avec une clé différente
        token = jwt.encode(
            {"user_id": 1, "username": "test"}, 
            "wrong-secret-key-with-at-least-32-bytes-for-hmac-sha256", 
            algorithm=ALGORITHM
        )
        
        with pytest.raises(InvalidCredentialsError, match="invalide"):
            verify_token(token)
            
    def test_verify_token_malformed(self):
        """Vérification échoue avec un token malformé"""

        malformed_token = "not.a.valid.jwt.token"
        
        with pytest.raises(InvalidCredentialsError, match="invalide"):
            verify_token(malformed_token)
            
    def test_verify_token_missing_user_id(self):
        """Vérification échoue avec un token sans user_id"""

        token = jwt.encode(
            {"username": "test"},  # pas de user_id
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        with pytest.raises(InvalidCredentialsError, match="invalide"):
            verify_token(token)
            
    def test_verify_token_missing_username(self):
        """Vérification échoue avec un token sans username"""

        token = jwt.encode(
            {"user_id": 1},  # pas de username
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        with pytest.raises(InvalidCredentialsError, match="invalide"):
            verify_token(token)


class TestRegisterUser:
    """Tests pour la fonction register_user()"""
    
    def test_register_user_success(self):
        """Enregistrement réussi d'un nouvel utilisateur"""

        mock_db = MagicMock(spec=Session)
        # Mock: l'utilisateur n'existe pas
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        username = "newuser"
        password = "password123"
        
        new_user = register_user(username, password, mock_db)
        
        # Vérifie que l'utilisateur a été créé
        assert mock_db.add.called
        assert mock_db.commit.called
        assert mock_db.refresh.called
        
    def test_register_user_already_exists(self):
        """Tentative d'enregistrement avec un username déjà existant"""

        mock_db = MagicMock(spec=Session)
        # Mock: l'utilisateur existe déjà
        existing_user = MagicMock(spec=User)
        existing_user.username = "existinguser"
        mock_db.query.return_value.filter.return_value.first.return_value = existing_user
        
        username = "existinguser"
        password = "password123"
        
        with pytest.raises(UserAlreadyExistsError, match="existe déjà"):
            register_user(username, password, mock_db)
            
    def test_register_user_password_too_short(self):
        """Tentative d'enregistrement avec un mot de passe trop court"""

        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        username = "newuser"
        password = "short"  # < 8 caractères
        
        with pytest.raises(ValueError, match="au moins 8 caractères"):
            register_user(username, password, mock_db)


class TestAuthenticateUser:
    """Tests pour la fonction authenticate_user()"""
    
    def test_authenticate_user_success(self):
        """Authentification réussie avec identifiants valides"""

        mock_db = MagicMock(spec=Session)
        
        password = "password123"
        hashed = hash_password(password)
        mock_user = MagicMock(spec=User)
        mock_user.username = "testuser"
        mock_user.password_hash = hashed
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        user = authenticate_user("testuser", password, mock_db)
        
        assert user == mock_user
        
    def test_authenticate_user_not_found(self):
        """Authentification échoue avec un utilisateur inexistant"""

        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(InvalidCredentialsError, match="invalides"):
            authenticate_user("unknownuser", "password123", mock_db)
            
    def test_authenticate_user_wrong_password(self):
        """Authentification échoue avec un mauvais mot de passe"""

        mock_db = MagicMock(spec=Session)
        
        password = "password123"
        hashed = hash_password(password)
        mock_user = MagicMock(spec=User)
        mock_user.username = "testuser"
        mock_user.password_hash = hashed
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        with pytest.raises(InvalidCredentialsError, match="invalides"):
            authenticate_user("testuser", "wrongpassword", mock_db)


class TestGetCurrentUserFromToken:
    """Tests pour la fonction get_current_user_from_token()"""
    
    @pytest.mark.anyio
    async def test_get_user_from_token_success(self):
        """Récupération réussie de l'utilisateur à partir d'un token valide"""

        mock_db = MagicMock(spec=Session)
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.username = "testuser"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        token = create_access_token(1, "testuser")
        
        user = await get_current_user_from_token(token, mock_db)
        
        assert user == mock_user
        
    @pytest.mark.anyio
    async def test_get_user_from_token_missing(self):
        """Token manquant lève HTTPException 401"""

        mock_db = MagicMock(spec=Session)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_token(None, mock_db)
            
        assert exc_info.value.status_code == 401
        assert "manquant" in exc_info.value.detail.lower()
        
    @pytest.mark.anyio
    async def test_get_user_from_token_invalid(self):
        """Token invalide lève HTTPException 401"""

        mock_db = MagicMock(spec=Session)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_token("invalid_token", mock_db)
            
        assert exc_info.value.status_code == 401
        
    @pytest.mark.anyio
    async def test_get_user_from_token_user_not_found(self):
        """Utilisateur non trouvé dans la DB lève HTTPException 401"""

        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        token = create_access_token(999, "unknownuser")
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_token(token, mock_db)
            
        assert exc_info.value.status_code == 401
        assert "non trouvé" in exc_info.value.detail.lower()


class TestGetCurrentUserOptional:
    """Tests pour la fonction get_current_user_optional()"""
    
    @pytest.mark.anyio
    async def test_get_user_optional_with_valid_token(self):
        """Récupération réussie avec un token valide"""

        mock_db = MagicMock(spec=Session)
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.username = "testuser"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        token = create_access_token(1, "testuser")
        
        user = await get_current_user_optional(token, mock_db)
        
        assert user == mock_user
        
    @pytest.mark.anyio
    async def test_get_user_optional_without_token(self):
        """Sans token, retourne None au lieu de lever une exception"""

        mock_db = MagicMock(spec=Session)
        
        user = await get_current_user_optional(None, mock_db)
        
        assert user is None
        
    @pytest.mark.anyio
    async def test_get_user_optional_with_invalid_token(self):
        """Token invalide lève HTTPException 401"""

        mock_db = MagicMock(spec=Session)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_optional("invalid_token", mock_db)
            
        assert exc_info.value.status_code == 401


class TestGetCurrentUserFromHeader:
    """Tests pour la fonction get_current_user_from_header()"""
    
    @pytest.mark.anyio
    async def test_get_user_from_header_success(self):
        """Récupération réussie à partir du header Authorization"""

        mock_db = MagicMock(spec=Session)
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.username = "testuser"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        token = create_access_token(1, "testuser")
        credentials = MagicMock(spec=HTTPAuthorizationCredentials)
        credentials.credentials = token
        
        user = await get_current_user_from_header(credentials, mock_db)
        
        assert user == mock_user
        
    @pytest.mark.anyio
    async def test_get_user_from_header_invalid_token(self):
        """Token invalide dans le header lève HTTPException 401"""

        mock_db = MagicMock(spec=Session)
        
        credentials = MagicMock(spec=HTTPAuthorizationCredentials)
        credentials.credentials = "invalid_token"
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_header(credentials, mock_db)
            
        assert exc_info.value.status_code == 401
        
    @pytest.mark.anyio
    async def test_get_user_from_header_user_not_found(self):
        """Utilisateur non trouvé lève HTTPException 401"""
        
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        token = create_access_token(999, "unknownuser")
        credentials = MagicMock(spec=HTTPAuthorizationCredentials)
        credentials.credentials = token
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_from_header(credentials, mock_db)
            
        assert exc_info.value.status_code == 401
        assert "non trouvé" in exc_info.value.detail.lower()
