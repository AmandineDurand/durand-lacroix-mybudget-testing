from pydantic import BaseModel, Field, model_validator
from datetime import date

class BudgetBase(BaseModel):
    montant_fixe: float = Field(..., gt=0, description="Le montant doit être strictement positif")
    debut_periode: date
    fin_periode: date
    categorie_id: int


    @model_validator(mode="after")
    def check_dates(self):
        if self.fin_periode < self.debut_periode:
            raise ValueError("La date de fin doit être postérieure à la date de début")
        return self

class BudgetCreate(BudgetBase):
    pass

class BudgetRead(BudgetBase):
    id: int

    class Config:
        from_attributes = True

class BudgetStatus(BudgetRead):
    montant_depense: float
    montant_restant: float
    pourcentage_consomme: float
    est_depasse: bool