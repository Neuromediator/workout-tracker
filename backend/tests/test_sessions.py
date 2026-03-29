"""Session lifecycle: create → add exercise → log sets → complete → history."""


def test_create_empty_session(client):
    r = client.post("/api/sessions", json={})
    assert r.status_code == 201
    data = r.json()
    assert data["completed_at"] is None
    assert data["exercises"] == []


def test_full_session_lifecycle(client):
    # 1. Create an exercise
    r = client.post("/api/exercises", json={"name": "Squat", "muscle_group": "legs"})
    exercise_id = r.json()["id"]

    # 2. Start session
    r = client.post("/api/sessions", json={})
    assert r.status_code == 201
    session_id = r.json()["id"]

    # 3. Add exercise to session
    r = client.post(
        f"/api/sessions/{session_id}/exercises",
        json={"exercise_id": exercise_id},
    )
    assert r.status_code == 201
    session_data = r.json()
    assert len(session_data["exercises"]) == 1
    se_id = session_data["exercises"][0]["id"]
    # Should have 1 empty set by default
    assert len(session_data["exercises"][0]["sets"]) == 1

    # 4. Log a set
    r = client.post(
        f"/api/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 1, "reps": 10, "weight": 80.0, "rest_seconds": 90},
    )
    assert r.status_code == 200
    logged_set = r.json()["exercises"][0]["sets"][0]
    assert logged_set["reps"] == 10
    assert logged_set["weight"] == 80.0
    assert logged_set["rest_seconds"] == 90

    # 5. Add another set
    r = client.post(
        f"/api/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 2, "reps": 8, "weight": 85.0},
    )
    assert r.status_code == 200
    assert len(r.json()["exercises"][0]["sets"]) == 2

    # 6. Complete session
    r = client.put(f"/api/sessions/{session_id}/complete")
    assert r.status_code == 200
    assert r.json()["completed_at"] is not None

    # 7. Should appear in session list
    r = client.get("/api/sessions")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["id"] == session_id

    # 8. Get detail
    r = client.get(f"/api/sessions/{session_id}")
    assert r.status_code == 200
    assert len(r.json()["exercises"][0]["sets"]) == 2


def test_create_session_with_preset_exercises(client):
    """Create session with exercises and sets in one request (reuse flow)."""
    r = client.post("/api/exercises", json={"name": "Bench", "muscle_group": "chest"})
    exercise_id = r.json()["id"]

    r = client.post("/api/sessions", json={
        "exercises": [{
            "exercise_id": exercise_id,
            "order": 0,
            "sets": [
                {"set_number": 1, "reps": 0, "weight": 60.0},
                {"set_number": 2, "reps": 0, "weight": 60.0},
            ],
        }],
    })
    assert r.status_code == 201
    data = r.json()
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 2
    assert data["exercises"][0]["sets"][0]["weight"] == 60.0


def test_delete_session(client):
    r = client.post("/api/sessions", json={})
    session_id = r.json()["id"]

    r = client.delete(f"/api/sessions/{session_id}")
    assert r.status_code == 204

    r = client.get(f"/api/sessions/{session_id}")
    assert r.status_code == 404
