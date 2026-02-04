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
        mock_query_total.join.return_value.all.return_value = remaining
        
        mock_db_session.query.side_effect = [mock_query_find, mock_query_total]
        
        response = client.delete("/api/transactions/1")
        
        assert response.status_code == 200
        data = response.json()
        assert pytest.approx(data.get("total", 0.0), rel=1e-6) == 25.5
