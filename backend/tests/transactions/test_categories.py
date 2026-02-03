from unittest.mock import MagicMock
from models.models import Categorie

# ========= MODELES =========

class TestModeles:
    """Tests unitaires des modèles SQLAlchemy"""

    def test_category_creation(self):
        """Création d'une Categorie"""
        
        c = Categorie(id=1, nom="Test", icone="✅")
        assert c.nom == "Test"

    def test_category_name_unique(self):
        """Contrainte unique sur nom"""
        
        nom_col = Categorie.__table__.columns['nom']
        assert nom_col.unique is True

# ========= API =========

class TestAPI:
    """Tests d'intégration pour les catégories"""

    def test_list_categories(self, client, mock_db_session):
        """Liste des catégories"""

        cats = []
        for i, nom in enumerate(["alimentation", "transport", "logement"], start=1):
            cat = MagicMock()
            cat.id = i
            cat.nom = nom
            cat.icone = "🔶"
            cats.append(cat)
        
        mock_db_session.query.return_value.all.return_value = cats
        
        response = client.get("/api/categories/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["nom"] == "alimentation"

    def test_list_categories_empty(self, client, mock_db_session):
        """Liste vide"""

        mock_db_session.query.return_value.all.return_value = []
        
        response = client.get("/api/categories/")
        assert response.status_code == 200
        assert response.json() == []