from .runner import run_code
from .scorer import calculate_score
from .utils import normalize_test_cases


def evaluate_submission(code: str, test_cases: dict):
    test_cases = normalize_test_cases(test_cases)

    results = []
    passed = 0

    for name, case in test_cases.items():
        try:
            output = run_code(code, case["input"])
            expected = case["output"]

            success = output == expected

            if success:
                passed += 1

            results.append({
                "test_case": name,
                "input": case["input"],
                "expected": expected,
                "output": output,
                "passed": success
            })

        except Exception as e:
            results.append({
                "test_case": name,
                "error": str(e),
                "passed": False
            })

    score = calculate_score(passed, len(test_cases))

    return {
        "passed": passed,
        "total": len(test_cases),
        "score": score,
        "results": results
    }