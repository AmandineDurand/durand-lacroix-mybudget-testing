from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from database import get_db
from auth import (
    register_user,
    authenticate_user,
    create_access_token,
    UserAlreadyExistsError,
    InvalidCredentialsError
)

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


class RegisterRequest(BaseModel):
    username: str
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError("Le mot de passe doit faire moins de 72 caractères (limitation bcrypt)")
        if len(v) < 8:
            raise ValueError("Le mot de passe doit faire au moins 8 caractères")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    user_id: int
    username: str
    access_token: str
    token_type: str


class RegisterResponse(BaseModel):
    user_id: int
    username: str
    message: str


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Enregistre un nouvel utilisateur
    
    Retourne un identifiant unique pour l'utilisateur créé
    """
    try:
        user = register_user(request.username, request.password, db)
        return RegisterResponse(
            user_id=user.id,
            username=user.username,
            message="Utilisateur créé avec succès"
        )
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement : {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authentifie un utilisateur et retourne un token JWT
    """
    try:
        user = authenticate_user(request.username, request.password, db)
        access_token = create_access_token(user.id, user.username)
        
        return AuthResponse(
            user_id=user.id,
            username=user.username,
            access_token=access_token,
            token_type="bearer"
        )
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la connexion : {str(e)}"
        )
