from unittest.mock import MagicMock
from datetime import datetime
from models.models import Transaction, TypeTransaction

class TestModeles:
    """Tests unitaires des modèles SQLAlchemy"""

    def test_transaction_creation(self):
        """Création d'une Transaction"""

        t = Transaction(
            id=1,
            montant=100.50,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie_id=1
        )
        assert t.montant == 100.50
        assert t.type == "DEPENSE"

    def test_transaction_category(self):
        """Propriété categorie retourne le nom"""
        
        cat = MagicMock()
        cat.nom = "alimentation"
        
        t = Transaction(
            id=1,
            montant=50.0,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie_id=1
        )
        t.categorie_obj = cat
        
        assert t.categorie == "alimentation"

    def test_transaction_category_without_object(self):
        """Propriété categorie retourne None si pas d'objet"""
        
        t = Transaction(
            id=1,
            montant=50.0,
            libelle="Test",
            type="DEPENSE",
            date=datetime(2026, 1, 1),
            categorie_id=1
        )
        t.categorie_obj = None
        
        assert t.categorie is None

    def test_transaction_type_enum(self):
        """Enum TypeTransaction"""
        
        assert TypeTransaction.REVENU.value == "revenu"
        assert TypeTransaction.DEPENSE.value == "dépense"

    def test_transaction_foreign_key_category(self):
        """FK vers categorie existe"""
        
        fks = Transaction.__table__.columns['categorie_id'].foreign_keys
        assert len(list(fks)) > 0

    def test_transaction_nullable_constraints(self):
        """Contraintes nullable correctes"""
        
        assert Transaction.__table__.columns['montant'].nullable is False
        assert Transaction.__table__.columns['utilisateur_id'].nullable is True