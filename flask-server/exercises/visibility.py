"""Only require joints actually used by each exercise processor."""
REQUIRED_JOINTS = {
    'Bicep Curls': (12, 14, 16),
    'Hammer Curls': (11, 12, 13, 14, 15, 16),
    'Shoulder Press': (11, 12, 13, 14, 15, 16),
    'Pull-ups': (11, 12, 13, 14, 15, 16),
    'Push-ups': (11, 12, 13, 14, 15, 16, 23, 24, 27, 28),
    'Squats': (23, 25, 27),
    'Deadlifts': (11, 23, 25, 27),
    'Lunges': (11, 12, 23, 24, 25, 26, 27, 28),
    'Plank': (11, 12, 23, 24, 25, 26, 27, 28),
}


def joints_visible(landmarks, exercise, threshold=.6):
    if landmarks is None:
        return False
    return all(landmarks.landmark[index].visibility >= threshold
               for index in REQUIRED_JOINTS[exercise])
