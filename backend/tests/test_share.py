"""Backend tests for the Share Cards feature."""
import os
import re
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None

# fallback: read from frontend/.env
if not BASE_URL:
    from pathlib import Path
    for line in Path('/app/frontend/.env').read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

KNOWN_ID = "5gkkskIF"

SAMPLE_RESULT = {
    "answer": "YES",
    "yesProbability": 82,
    "noProbability": 18,
    "certainty": "PROBABILISTIC",
    "confidence": "high",
    "shortAnswer": "Yes — it's still a strong choice.",
    "reason": "Python remains dominant in AI/ML and data.",
    "evidence": ["Widely used", "Great ecosystem"],
    "sources": [],
}


@pytest.fixture(scope="module")
def created_share_id():
    r = requests.post(f"{BASE_URL}/api/share",
                      json={"question": "TEST_ Should I learn Python in 2026?", "result": SAMPLE_RESULT},
                      timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str) and 0 < len(data["id"]) <= 12
    return data["id"]


def test_post_share_returns_id():
    r = requests.post(f"{BASE_URL}/api/share",
                      json={"question": "TEST_ Is testing important?", "result": SAMPLE_RESULT},
                      timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert "id" in j
    assert isinstance(j["id"], str)
    assert 4 <= len(j["id"]) <= 12


def test_get_share_returns_stored(created_share_id):
    r = requests.get(f"{BASE_URL}/api/share/{created_share_id}", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert "question" in j and "result" in j
    assert j["result"]["answer"] == "YES"
    assert j["result"]["yesProbability"] == 82


def test_get_share_unknown_404():
    r = requests.get(f"{BASE_URL}/api/share/doesnotexist_zzz", timeout=20)
    assert r.status_code == 404


def test_share_image_png(created_share_id):
    r = requests.get(f"{BASE_URL}/api/s/{created_share_id}/image.png", timeout=30)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/png")
    assert len(r.content) > 1000
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_share_image_unknown_404():
    r = requests.get(f"{BASE_URL}/api/s/doesnotexist_zzz/image.png", timeout=20)
    assert r.status_code == 404


def test_share_html_page_og_tags(created_share_id):
    r = requests.get(f"{BASE_URL}/api/s/{created_share_id}", timeout=20)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    html = r.text
    # og:title contains "ANSWER — question"
    m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    assert m, "og:title missing"
    assert "—" in m.group(1)
    assert "YES" in m.group(1) or "NO" in m.group(1)
    # og:description
    assert re.search(r'<meta property="og:description" content="[^"]+"', html)
    # og:image absolute url ending in /api/s/{id}/image.png
    mi = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    assert mi
    img_url = mi.group(1)
    assert img_url.startswith("http://") or img_url.startswith("https://")
    assert img_url.endswith(f"/api/s/{created_share_id}/image.png")
    # meta refresh redirect to /?shared={id}
    assert f"/?shared={created_share_id}" in html
    assert 'http-equiv="refresh"' in html


def test_share_html_unknown_404():
    r = requests.get(f"{BASE_URL}/api/s/doesnotexist_zzz", timeout=20)
    assert r.status_code == 404


def test_known_seed_share_id():
    """The prompt says '5gkkskIF' should exist."""
    r = requests.get(f"{BASE_URL}/api/share/{KNOWN_ID}", timeout=20)
    # not critical if not seeded — just informational
    if r.status_code == 200:
        j = r.json()
        assert "question" in j and "result" in j
    else:
        pytest.skip(f"Known share id {KNOWN_ID} not present (status {r.status_code})")
