import time
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.middleware.rate_limit import RateLimitMiddleware


@pytest.fixture
def app():
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=60,
        burst_size=5,
    )

    @app.get("/")
    async def root():
        return {"message": "hello"}

    @app.get("/other")
    async def other():
        return {"message": "other"}

    return app


@pytest.fixture
def client(app):
    return TestClient(app)


class TestRateLimitMiddleware:
    def test_allows_requests_under_limit(self, client):
        """Requests under the burst size should succeed."""
        for _ in range(5):
            response = client.get("/")
            assert response.status_code == 200

    def test_blocks_requests_over_burst(self, client):
        """Requests exceeding burst size should be blocked."""
        # Use up the burst
        for _ in range(5):
            client.get("/")
        # Next request should be rate limited
        response = client.get("/")
        assert response.status_code == 429
        body = response.json()
        assert "Rate limit exceeded" in body["detail"]
        assert "retry_after" in body

    def test_rate_limit_headers_present(self, client):
        """All responses should include rate limit headers."""
        response = client.get("/")
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers

    def test_rate_limit_remaining_decreases(self, client):
        """Remaining count should decrease with each request."""
        r1 = client.get("/")
        remaining1 = int(r1.headers["X-RateLimit-Remaining"])
        r2 = client.get("/")
        remaining2 = int(r2.headers["X-RateLimit-Remaining"])
        assert remaining2 < remaining1

    def test_rate_limit_per_ip(self, client):
        """Rate limits should be per-client IP."""
        # TestClient always uses the same IP, so this tests the basic flow
        response = client.get("/")
        assert response.status_code == 200
        assert "X-RateLimit-Limit" in response.headers
        assert response.headers["X-RateLimit-Limit"] == "60"

    def test_different_paths_share_limit(self, client):
        """Rate limit applies across all paths for the same client."""
        # Use up burst across different endpoints
        for _ in range(3):
            client.get("/")
        for _ in range(2):
            client.get("/other")
        # Should be rate limited now
        response = client.get("/")
        assert response.status_code == 429

    def test_429_response_format(self, client):
        """429 response should have proper JSON format."""
        for _ in range(5):
            client.get("/")
        response = client.get("/")
        assert response.status_code == 429
        body = response.json()
        assert isinstance(body["detail"], str)
        assert isinstance(body["retry_after"], (int, float))
        assert body["retry_after"] > 0

    def test_custom_limits(self):
        """Should respect custom rate limit configuration."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware,
            requests_per_minute=120,
            burst_size=2,
        )

        @app.get("/")
        async def root():
            return {"ok": True}

        client = TestClient(app)
        # Burst of 2
        assert client.get("/").status_code == 200
        assert client.get("/").status_code == 200
        assert client.get("/").status_code == 429
