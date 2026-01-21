from pydantic import BaseModel, Field, model_validator
from datetime import date

class BudgetBase(BaseModel):
    montant: float = Field(..., gt=0, description="Le montant doit être strictement positif")
    date_debut: date
    date_fin: date
    categorie_id: int

    @model_validator(mode="after")
    def check_dates(self):
        if self.date_fin < self.date_debut:
            raise ValueError("La date de fin doit être postérieure à la date de début")
        return self

class BudgetCreate(BudgetBase):
    pass

class BudgetRead(BudgetBase):
    id: int

    class Config:
        from_attributes = True