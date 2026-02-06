from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, InvalidCredentialsError, UserAlreadyExistsError, UserNotFoundError

# Configuration de la sécurité
SECRET_KEY = "your-secret-key-change-in-production"  # TODO: à récupérer depuis une variable d'environnement
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Schéma de sécurité Bearer pour Swagger UI
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash un password avec bcrypt"""
    # Validation supplémentaire avant le hachage
    if not password or len(password) < 8:
        raise ValueError("Le mot de passe doit faire au moins 8 caractères")
    
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        raise ValueError(f"Le mot de passe est trop long: {len(password_bytes)} bytes (max 72)")
    
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        raise ValueError(f"Erreur lors du hachage du password: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un password correspond à son hash"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(
    user_id: int, 
    username: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crée un JWT token pour l'authentification
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    data = {
        "user_id": user_id,
        "username": username,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Vérifie et décode un JWT token
    Retourne les données du token si valide
    Lève une exception si invalide ou expiré
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        
        if user_id is None or username is None:
            raise InvalidCredentialsError("Token invalide")
        
        return {"user_id": user_id, "username": username}
    
    except jwt.ExpiredSignatureError:
        raise InvalidCredentialsError("Token expiré")
    except jwt.InvalidTokenError:
        raise InvalidCredentialsError("Token invalide")


def register_user(username: str, password: str, db: Session) -> User:
    """
    Enregistre un nouvel utilisateur
    Lève UserAlreadyExistsError si l'utilisateur existe déjà
    """
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise UserAlreadyExistsError(f"L'utilisateur '{username}' existe déjà")
    
    hashed_password = hash_password(password)
    new_user = User(username=username, password_hash=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def authenticate_user(username: str, password: str, db: Session) -> User:
    """
    Authentifie un utilisateur
    Retourne l'utilisateur si les identifiants sont valides
    Lève InvalidCredentialsError sinon
    """
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError("Identifiants invalides")
    
    return user


async def get_current_user_from_header(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance FastAPI pour récupérer l'utilisateur actuel à partir du header Authorization.
    Authentification REQUISE - lève HTTPException 401 si manquante ou invalide.
    Utilise HTTPBearer pour générer automatiquement les métadonnées OpenAPI.
    """
    token = credentials.credentials
    
    try:
        token_data = verify_token(token)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_current_user_from_token(
    token: str,
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance FastAPI pour récupérer l'utilisateur actuel à partir du token
    Lève HTTPException 401 si le token est invalide ou manquant
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        token_data = verify_token(token)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_current_user_optional(
    token: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dépendance FastAPI pour récupérer l'utilisateur actuel si un token est fourni
    Retourne None si pas de token (authentification optionnelle)
    Lève HTTPException 401 si le token est fourni mais invalide
    """
    if not token:
        return None
    
    try:
        token_data = verify_token(token)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user
