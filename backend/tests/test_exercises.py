"""Exercise CRUD tests."""


def test_list_exercises_empty(client):
    r = client.get("/api/exercises")
    assert r.status_code == 200
    assert r.json() == []


def test_create_and_get_exercise(client):
    r = client.post("/api/exercises", json={
        "name": "Bench Press",
        "muscle_group": "chest",
        "tags": ["compound"],
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Bench Press"
    assert data["muscle_group"] == "chest"
    assert data["is_custom"] is True
    exercise_id = data["id"]

    # GET by id
    r = client.get(f"/api/exercises/{exercise_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Bench Press"

    # List includes it
    r = client.get("/api/exercises")
    assert len(r.json()) == 1


def test_filter_exercises_by_muscle_group(client):
    client.post("/api/exercises", json={"name": "Squat", "muscle_group": "legs"})
    client.post("/api/exercises", json={"name": "Bench", "muscle_group": "chest"})

    r = client.get("/api/exercises?muscle_group=legs")
    data = r.json()
    assert len(data) == 1
    assert data[0]["name"] == "Squat"


def test_delete_exercise(client):
    r = client.post("/api/exercises", json={"name": "Curl", "muscle_group": "arms"})
    eid = r.json()["id"]

    r = client.delete(f"/api/exercises/{eid}")
    assert r.status_code == 204

    r = client.get(f"/api/exercises/{eid}")
    assert r.status_code == 404
