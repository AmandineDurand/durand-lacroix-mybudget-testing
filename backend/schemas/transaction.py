from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime

# Propriétés communes
class TransactionBase(BaseModel):
    montant: float
    libelle: str
    type: str
    date: datetime
    categorie: str

    @field_validator('montant')
    @classmethod
    def montant_positif(cls, v):
        if v <= 0:
            raise ValueError("Le montant doit être positif")
        return v
    
    @field_validator('type')
    @classmethod
    def type_valide(cls, v):
        v_upper = v.upper()
        if v_upper not in ['REVENU', 'DEPENSE']:
            raise ValueError("Le type doit être 'REVENU' ou 'DEPENSE'")
        return v_upper

class TransactionCreate(TransactionBase):
    pass

# Schéma pour la LECTURE (get)
# class TransactionRead(TransactionBase):
#     id: int

#     class Config:
#         from_attributes = True
class TransactionRead(TransactionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)