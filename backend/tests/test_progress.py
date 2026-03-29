"""Progress endpoint tests — need completed sessions to produce data."""


def _create_completed_session(client, exercise_id, weight, reps):
    """Helper: create session, add exercise, log set, complete."""
    r = client.post("/api/sessions", json={
        "exercises": [{
            "exercise_id": exercise_id,
            "order": 0,
            "sets": [{"set_number": 1, "reps": reps, "weight": weight}],
        }],
    })
    session_id = r.json()["id"]
    client.put(f"/api/sessions/{session_id}/complete")
    return session_id


def test_summary_empty(client):
    r = client.get("/api/progress/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_sessions"] == 0


def test_summary_with_data(client):
    r = client.post("/api/exercises", json={"name": "Deadlift", "muscle_group": "back"})
    eid = r.json()["id"]

    _create_completed_session(client, eid, 100, 5)
    _create_completed_session(client, eid, 110, 5)

    r = client.get("/api/progress/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_sessions"] == 2
    assert data["total_sets"] >= 2


def test_personal_bests(client):
    r = client.post("/api/exercises", json={"name": "Squat", "muscle_group": "legs"})
    eid = r.json()["id"]

    _create_completed_session(client, eid, 80, 5)
    _create_completed_session(client, eid, 100, 3)

    r = client.get("/api/progress/personal-bests")
    assert r.status_code == 200
    bests = r.json()
    assert len(bests) >= 1
    squat_best = next(b for b in bests if b["exercise_id"] == eid)
    assert squat_best["weight"] == 100


def test_exercise_trend(client):
    r = client.post("/api/exercises", json={"name": "OHP", "muscle_group": "shoulders"})
    eid = r.json()["id"]

    _create_completed_session(client, eid, 40, 8)
    _create_completed_session(client, eid, 42.5, 8)

    r = client.get(f"/api/progress/exercise/{eid}")
    assert r.status_code == 200
    trend = r.json()
    assert len(trend) == 2


def test_weekly_counts(client):
    r = client.post("/api/exercises", json={"name": "Row", "muscle_group": "back"})
    eid = r.json()["id"]

    _create_completed_session(client, eid, 60, 10)

    r = client.get("/api/progress/weekly?weeks=4")
    assert r.status_code == 200
    weeks = r.json()
    assert len(weeks) == 4
    # At least one week should have count > 0
    assert any(w["count"] > 0 for w in weeks)


def test_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
