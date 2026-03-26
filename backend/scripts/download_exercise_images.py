"""One-time script to download exercise images from wger.de API."""
import json
import time
import urllib.request
from pathlib import Path

WGER_BASE = "https://wger.de"
OUT_DIR = Path(__file__).parent.parent / "app" / "static" / "exercises"
SEED_FILE = Path(__file__).parent.parent / "app" / "seed" / "exercises.json"

# Map our exercise names to wger search terms
SEARCH_TERMS = {
    "Barbell Bench Press": "Bench Press",
    "Incline Dumbbell Press": "Incline Bench Press",
    "Dumbbell Fly": "Dumbbell Fly",
    "Push-Up": "Push Up",
    "Cable Crossover": "Cable Crossover",
    "Barbell Back Squat": "Squat",
    "Romanian Deadlift": "Romanian Deadlift",
    "Leg Press": "Leg Press",
    "Leg Curl": "Leg Curl",
    "Leg Extension": "Leg Extension",
    "Walking Lunge": "Lunge",
    "Calf Raise": "Calf Raise",
    "Pull-Up": "Pull Up",
    "Barbell Row": "Barbell Row",
    "Seated Cable Row": "Seated Row",
    "Lat Pulldown": "Lat Pulldown",
    "Dumbbell Row": "Dumbbell Row",
    "Deadlift": "Deadlift",
    "Overhead Press": "Overhead Press",
    "Lateral Raise": "Lateral Raise",
    "Face Pull": "Face Pull",
    "Rear Delt Fly": "Rear Delt",
    "Barbell Curl": "Barbell Curl",
    "Dumbbell Hammer Curl": "Hammer Curl",
    "Tricep Pushdown": "Tricep Pushdown",
    "Overhead Tricep Extension": "Tricep Extension",
    "Dips": "Dips",
    "Plank": "Plank",
    "Hanging Leg Raise": "Hanging Leg Raise",
    "Cable Crunch": "Cable Crunch",
    "Ab Wheel Rollout": "Ab Wheel",
}


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("(", "").replace(")", "")


def search_exercise(term: str) -> str | None:
    """Search wger and return the first result's image URL."""
    url = f"{WGER_BASE}/api/v2/exercise/search/?term={urllib.request.quote(term)}&language=english&format=json"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        for s in data.get("suggestions", []):
            img = s.get("data", {}).get("image")
            if img:
                return WGER_BASE + img
    except Exception as e:
        print(f"  ERROR searching '{term}': {e}")
    return None


def download_image(url: str, dest: Path) -> bool:
    """Download image to dest path."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        dest.write_bytes(resp.read())
        return True
    except Exception as e:
        print(f"  ERROR downloading {url}: {e}")
        return False


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    seed_data = json.loads(SEED_FILE.read_text())

    results = {}
    for exercise_name, search_term in SEARCH_TERMS.items():
        slug = slugify(exercise_name)
        print(f"Searching: {exercise_name} (term: '{search_term}')...")

        image_url = search_exercise(search_term)
        if not image_url:
            print(f"  No image found, keeping muscle group SVG")
            results[exercise_name] = None
            time.sleep(0.5)
            continue

        # Determine extension
        ext = image_url.rsplit(".", 1)[-1].split("?")[0]
        if ext not in ("png", "jpg", "jpeg", "webp"):
            ext = "png"
        dest = OUT_DIR / f"{slug}.{ext}"

        if download_image(image_url, dest):
            local_url = f"/static/exercises/{slug}.{ext}"
            results[exercise_name] = local_url
            print(f"  OK -> {local_url}")
        else:
            results[exercise_name] = None

        time.sleep(1)  # Be nice to the API

    # Update seed data
    for item in seed_data:
        name = item["name"]
        if name in results and results[name]:
            item["image_url"] = results[name]

    SEED_FILE.write_text(json.dumps(seed_data, indent=2) + "\n")
    print(f"\nDone! Updated {sum(1 for v in results.values() if v)} / {len(results)} exercises")
    print(f"Seed file updated: {SEED_FILE}")


if __name__ == "__main__":
    main()
