from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from routers import ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):
  # start
  app.state.jobs = {}

  yield

  # stop

app = FastAPI(
  title = "Geometry Backend",
  lifespan=lifespan,
)

app.include_router(ai_router.router, prefix="/api/v1")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["POST", "GET"],
  allow_headers=["*"],
)

@app.get("/chat")
async def get_chat_interface():
    return FileResponse("chat.html")

@app.get("/assistant-demo")
async def get_assistant_demo():
    return FileResponse("assistant_demo.html")

@app.get("/")
def read_root():
  return {"message": "Hello, World!"}

if __name__ == "__main__":
  import uvicorn
  uvicorn.run(
    "main:app", 
    host="localhost", 
    port=8000, 
    reload=True,
    reload_dirs=["."],
  )