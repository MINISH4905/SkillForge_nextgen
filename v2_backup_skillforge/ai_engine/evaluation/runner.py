def run_code(user_code: str, test_input):
    restricted_globals = {
        "__builtins__": {
            "range": range,
            "len": len,
            "print": print,
            "int": int,
            "str": str,
            "list": list,
            "dict": dict,
            "set": set,
            "sum": sum,
            "max": max,
            "min": min,
            "abs": abs
        }
    }

    local_vars = {}

    exec(user_code, restricted_globals, local_vars)

    # Detect function
    func = None

    if "solution" in local_vars:
        func = local_vars["solution"]
    else:
        funcs = [v for v in local_vars.values() if callable(v)]
        if funcs:
            func = funcs[0]

    if not func:
        raise Exception("No valid function found")

    return func(*test_input)