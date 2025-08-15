import asyncio
import uuid
import json
import datetime
from typing import AsyncGenerator, Dict, Any, List
from fastapi import APIRouter, Request, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse

from utils.call_llm import stream
from utils.background_tasks import run_agent_flow_async

DEFAULT_LLM_MODEL = "deepseek/deepseek-chat-v3-0324:free"
DEFAULT_LLM_MODEL = "anthropic/claude-3.7-sonnet"

router = APIRouter(prefix="/ai", tags=["ai"])
security = HTTPBearer()

# TODO: Temp
VALID_API_KEYS = ["sk-demo1", "sk-demo2"]

def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
  # TODO: Example version—should be updated to verify API keys via the database in production.
  api_key = credentials.credentials

  if credentials.scheme != "Bearer" \
    or credentials.credentials not in VALID_API_KEYS:
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key",
      )

  # TODO: Record access log

  return api_key


@router.post("/chat")
async def chat(request: Request, token: str=Depends(verify_api_key)):
  request_body = await request.json()

  model = request_body.get("model", DEFAULT_LLM_MODEL)
  messages = request_body.get("messages", [])
  
  async def stream_sse():
    # 1. thinking block
    thinking_block = {
      "type": "thinking",
      "content": "Agent is thinking..."
    }
    yield f"data: {json.dumps(thinking_block)}\n\n"

    # 2. markdown block
    async for chunk in stream(model, messages):
      if isinstance(chunk, str):
        markdown_block = {
          "type": "markdown",
          "content": chunk
        }
        yield f"data: {json.dumps(markdown_block)}\n\n"
      else:
        yield f"data: {json.dumps(chunk)}\n\n"
    
    # 3. done block
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
  
  return StreamingResponse(
    stream_sse(), 
    media_type="text/event-stream; charset=utf-8"
  )


@router.post("/assistant/add_job")
async def add_job(request: Request, background_tasks: BackgroundTasks, token: str=Depends(verify_api_key)):
  """
  This endpoint should be send message for each step of the flow by SSE.
  Each step should be a stream of messages.
  Each message could be a JSON object.
  Flow run in a back
  """
  print(f"\n\nadd_job token: {token}\n\n")

  request_body = await request.json()

  request_data = request_body.get("request_data", {
    "model": DEFAULT_LLM_MODEL,
    "user_query": "what you can do?",
  })

  print(f"\n\nmodel: {request_data['model']}\n\n")

  job_id = str(uuid.uuid4())
  sse_queue = asyncio.Queue()
  request.app.state.jobs[job_id] = sse_queue

  request_data["sse_queue"] = sse_queue

  background_tasks.add_task(run_agent_flow_async, request_data)

  return { "job_id": job_id }


@router.get("/assistant/stream/{job_id}")
async def get_job_stream(request: Request, job_id: str, token: str=Depends(verify_api_key)):

  async def event_stream():
    if job_id not in request.app.state.jobs:
      yield f"data: {json.dumps({'type': 'error', 'message': 'Job not found'})}\n\n"
    
    sse_queue = request.app.state.jobs[job_id]

    while True:
      msg = await sse_queue.get()
      yield f"data: {json.dumps(msg)}\n\n"

      if msg.get("step") == "done":
        print(f"\n\njob_id: {job_id} done\n\n")
        del request.app.state.jobs[job_id]
        break

  return StreamingResponse(
    event_stream(), 
    media_type="text/event-stream; charset=utf-8"
  )