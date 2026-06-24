# for reading .env file

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str = ""
    JWT_SECRET : str = ""
    JWT_ALGORITHM : str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES : int = 1440
    GROQ_API_KEY : str = ""
    DEBUG_MODE : bool = True
    NEXT_FRONTEND_URL : str = "http://localhost:3000"
    class Config:
        env_file = ".env"

settings = Settings()

def debug_print(*args, **kwargs ):
        if (settings.DEBUG_MODE):
            print("[DEBUG] : " , *args, **kwargs)