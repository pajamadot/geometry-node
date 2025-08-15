import asyncio
from typing import Dict, Any, List

from agent.flow import create_agent_flow
from utils.decorators import measure_time

@measure_time
async def run_agent_flow_async(request_data: Dict[str, Any]):
  # basic shared data contains: model, user_query, sse_queue
  shared = {
    "model": request_data.get("model"),
    "user_query": request_data.get("user_query"),
    "sse_queue": request_data.get("sse_queue"),
    "request_data": request_data,
  }
  agent_flow = create_agent_flow()
  await agent_flow.run_async(shared)

  sse_queue = shared["sse_queue"]
  sse_queue.put_nowait({"step":"done", "content": "Agent flow completed"})