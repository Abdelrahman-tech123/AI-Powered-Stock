from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings , debug_print
from app.routes import auth_routes , stock_routes , tickers_routes , ai_routes
from contextlib import asynccontextmanager
from app.ai_client import ai_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    debug_print("⚡ Lifespan startup running...")
    ai_manager.initialize()
    yield
    debug_print("🛑 Shutting down server...")

app = FastAPI(
    title="AI-Powered Stock",
    description="Backend python server with fastAPI and postgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

# venv\Scripts\Activate.ps1

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

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication Services"])
app.include_router(stock_routes.router , prefix="/api/services/stock" , tags=["Stock Services"])
app.include_router(tickers_routes.router , prefix="/api/services/tickers" , tags=["Stock Services"])
app.include_router(ai_routes.router , prefix="/api/services/ai" , tags=["AI Services"])

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "Welcome to AI-powered stock API v1.0",
        "database": "Connected to DataBase"
    }
