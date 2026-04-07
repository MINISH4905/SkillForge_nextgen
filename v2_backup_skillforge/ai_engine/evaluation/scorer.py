def calculate_score(passed, total):
    if total == 0:
        return 0

    percentage = (passed / total) * 100

    if percentage == 100:
        return 10
    elif percentage >= 70:
        return 7
    elif percentage >= 40:
        return 5
    else:
        return 2