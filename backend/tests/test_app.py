class TestApp:
    """Tests d'intégration de l'application"""

    def test_root_endpoint(self, client):
        """Route racine"""

        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["version"] == "1.0.0"

    def test_openapi(self, client):
        """Documentation OpenAPI"""

        response = client.get("/openapi.json")
        
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert data["info"]["title"] == "Budget Personnel API"

    def test_404(self, client):
        """Gestion 404"""

        response = client.get("/route-inexistante")
        assert response.status_code == 404