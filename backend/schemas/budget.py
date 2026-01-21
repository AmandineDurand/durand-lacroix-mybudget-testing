from pydantic import BaseModel
from datetime import date

class BudgetBase(BaseModel):
    montant: float
    date_debut: date
    date_fin: date
    categorie_id: int

class BudgetCreate(BudgetBase):
    pass

class BudgetRead(BudgetBase):
    id: int

    class Config:
        from_attributes = True