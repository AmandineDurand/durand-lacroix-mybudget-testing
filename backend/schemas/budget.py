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

class BudgetFilterParams(BaseModel):
    categorie_id: int | None = Field(None, description="Filtrer par catégorie")
    debut: date | None = Field(None, description="Date de début")
    fin: date | None = Field(None, description="Date de fin")
    skip: int = Field(0, ge=0, description="Pagination skip")
    limit: int = Field(100, ge=1, le=1000, description="Pagination limit")

    @model_validator(mode='after')
    def check_dates(self):
        if self.debut and self.fin and self.debut > self.fin:
            raise ValueError("La date de début doit être antérieure à la date de fin")
        return self