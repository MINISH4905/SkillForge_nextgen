import os


class Settings:
    APP_NAME: str = "AI Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    LOCAL_LLM_URL: str = os.getenv(
        "LOCAL_LLM_URL", "http://localhost:11434/v1/chat/completions"
    )
    LOCAL_MODEL_NAME: str = "llama3"

    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "120"))
    LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "5"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))

    DB_BASE_PATH: str = os.getenv("DB_BASE_PATH", "db/domains")


settings = Settings()