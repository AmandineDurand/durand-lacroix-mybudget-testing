import pytest
from unittest.mock import MagicMock


class TestDeleteTransactionRouter:
    """Tests d'intégration pour l'endpoint DELETE /api/transactions/{id}"""
    
    def test_delete_transaction_endpoint_success(self, client, mock_db_session, mock_transaction_list, mock_transaction):
        """Teste que DELETE supprime puis renvoie le total recalculé"""
        
        mock_query_find = MagicMock()
        mock_query_find.filter.return_value.first.return_value = mock_transaction
        
        remaining = [mock_transaction_list[1]]
        mock_query_total = MagicMock()
        mock_join = MagicMock()
        mock_join.filter.return_value = mock_join  # chainable filter
        mock_join.all.return_value = remaining
        mock_query_total.join.return_value = mock_join
        
        mock_db_session.query.side_effect = [mock_query_find, mock_query_total]
        
        response = client.delete("/api/transactions/1")
        
        assert response.status_code == 200
        data = response.json()
        assert pytest.approx(data.get("total", 0.0), rel=1e-6) == 25.5

    def test_delete_transaction_endpoint_not_found(self, client, mock_db_session):
        """Teste que DELETE sur une transaction inexistante retourne 400"""
        
        # Simule l'absence de transaction
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query
        
        response = client.delete("/api/transactions/999")
        
        assert response.status_code == 400
        assert "non trouvée" in response.json()["detail"].lower()
