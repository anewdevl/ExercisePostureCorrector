"""Conservative exact aliases; unknown exercise variants are never auto-mapped."""
import re

CATALOG = [
    ("bicep-curl", "Bicep Curls", ["bicep curl", "biceps curl", "biceps curls"]),
    ("deadlift", "Deadlifts", ["deadlift"]),
    ("hammer-curl", "Hammer Curls", ["hammer curl"]),
    ("lunge", "Lunges", ["lunge"]),
    ("plank", "Plank", []),
    ("pull-up", "Pull-ups", ["pull up", "pull ups", "pullup", "pullups"]),
    ("push-up", "Push-ups", ["push up", "push ups", "pushup", "pushups"]),
    ("shoulder-press", "Shoulder Press", ["shoulder presses"]),
    ("squat", "Squats", ["squat"]),
]


def normalize(name):
    return re.sub(r"[^a-z0-9]+", " ", name.lower()).strip() if isinstance(name, str) else ""


def tracking_id(name):
    target = normalize(name)
    for identifier, label, aliases in CATALOG:
        if target in {normalize(value) for value in [identifier, label, *aliases]}:
            return identifier
    return None


def tracking_name(identifier):
    return next((label for key, label, _ in CATALOG if key == identifier), None)


def catalog():
    return [{"id": identifier, "name": name} for identifier, name, _ in CATALOG]
