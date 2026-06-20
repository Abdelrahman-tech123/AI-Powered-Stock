from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth_routes

app = FastAPI(
    title="AI-Powered Stock",
    description="Backend python server with fastAPI and postgreSQL",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
    settings.NEXT_FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # السماح للمواقع المحددة فوق فقط
    allow_credentials=True,           # السماح بإرسال الـ Cookies والـ Auth Headers
    allow_methods=["*"],              # السماح بجميع أنواع الطلبات (GET, POST, PUT, DELETE)
    allow_headers=["*"],              # السماح بجميع أنواع الـ Headers
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "Welcome to AI-powered stock API v1.0",
        "database": "Connected to DataBase"
    }
