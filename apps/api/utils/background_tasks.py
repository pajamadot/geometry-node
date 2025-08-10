import asyncio
from typing import Dict, Any, List

from agent.flow import create_agent_flow

def run_agent_flow(request_data: Dict[str, Any]):
  # basic shared data contains: model, user_query, sse_queue
  shared = {
    "model": request_data.get("model"),
    "user_query": request_data.get("user_query"),
    "sse_queue": request_data.get("sse_queue"),
    "request_data": request_data,
  }
  agent_flow = create_agent_flow()
  asyncio.run(agent_flow.run_async(shared))
  print("Agent flow completed")