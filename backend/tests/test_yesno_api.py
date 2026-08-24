"""Backend tests for yesno /api/answer endpoint."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://quick-verdict-3.preview.emergentagent.com").rstrip("/")
ANSWER_URL = f"{BASE_URL}/api/answer"
ROOT_URL = f"{BASE_URL}/api/"

TIMEOUT = 90


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(session):
    r = session.get(ROOT_URL, timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


def test_definite_yes(session):
    r = session.post(ANSWER_URL, json={"question": "Is Paris the capital of France?"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["answer"] == "YES"
    assert d["certainty"] == "DEFINITE_YES"
    assert d["yesProbability"] + d["noProbability"] == 100
    assert d["yesProbability"] == 100
    assert d["reason"].strip() != ""
    assert isinstance(d["evidence"], list)
    assert isinstance(d["sources"], list)


def test_definite_no(session):
    r = session.post(ANSWER_URL, json={"question": "Is 2 plus 2 equal to 5?"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["answer"] == "NO"
    assert d["yesProbability"] + d["noProbability"] == 100


def test_probabilistic(session):
    r = session.post(ANSWER_URL, json={"question": "Will it rain tomorrow in London?"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["answer"] in ("YES", "NO")
    assert d["certainty"] in {"PROBABILISTIC", "SUBJECTIVE", "TIME_SENSITIVE", "INSUFFICIENT_INFORMATION"}
    assert d["yesProbability"] + d["noProbability"] == 100
    assert 0 <= d["yesProbability"] <= 100


def test_empty_question(session):
    r = session.post(ANSWER_URL, json={"question": ""}, timeout=15)
    assert r.status_code == 422


def test_too_short(session):
    r = session.post(ANSWER_URL, json={"question": "a"}, timeout=15)
    assert r.status_code == 422


def test_too_long(session):
    q = "a" * 501
    r = session.post(ANSWER_URL, json={"question": q}, timeout=15)
    assert r.status_code == 422


def test_no_key_leak(session):
    # Trigger validation error and ensure no key/traceback leaks
    r = session.post(ANSWER_URL, json={"question": "x"}, timeout=15)
    assert "sk-emergent" not in r.text
    assert "Traceback" not in r.text
