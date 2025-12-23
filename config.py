import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    ADMIN_LOGIN = os.getenv("ADMIN_LOGIN")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
    # Session config
    SESSION_COOKIE_NAME = 'bod_session'
    PERMANENT_SESSION_LIFETIME = 30 * 24 * 60 * 60  # 30 days
