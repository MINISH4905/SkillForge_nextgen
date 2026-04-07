import ast


def normalize_test_cases(test_cases):
    normalized = {}

    # New format
    if any(k.startswith("case") for k in test_cases):
        return test_cases

    # Old format → convert
    i = 1
    while f"input{i}" in test_cases:
        raw_input = test_cases[f"input{i}"]
        raw_output = test_cases.get(f"output{i}")

        try:
            parsed_input = ast.literal_eval(raw_input)
            parsed_output = ast.literal_eval(raw_output)
        except:
            parsed_input = raw_input
            parsed_output = raw_output

        normalized[f"case{i}"] = {
            "input": parsed_input,
            "output": parsed_output
        }

        i += 1

    return normalized