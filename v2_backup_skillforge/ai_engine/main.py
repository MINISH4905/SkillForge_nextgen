from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import generate, evaluate, progress

# Create app FIRST
app = FastAPI(
    title="SkillForge AI Engine",
    version="1.0.0"
)

# Enable CORS for Django / Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(generate.router, prefix="/generate", tags=["Generation"])
app.include_router(evaluate.router, prefix="/evaluate", tags=["Evaluation"])
app.include_router(progress.router, prefix="/progress", tags=["Progress"])


# Health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "SkillForge AI Engine is running 🚀"
    }


# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",   # important for reload
        host="0.0.0.0",
        port=8001,
        reload=True
    )