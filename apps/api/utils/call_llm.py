import os
from openai import OpenAI
from typing import Dict, Any, List
from dotenv import load_dotenv
from collections.abc import AsyncGenerator

load_dotenv()

openrouter_client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)

async def stream(
  model: str, 
  messages: List[Dict[str, str]], 
  temperature: float = 0.5, 
  top_p: float = 1
) -> AsyncGenerator[Dict[str, Any]]:
  try:
    response = openrouter_client.chat.completions.create(
      model=model,
      messages=messages,
      temperature=temperature,
      top_p=top_p,
      stream=True
    )
    id_sent = False

    for chunk in response:
      if not id_sent and hasattr(chunk, "id"):
        id_sent = True
        yield f"event: id\ndata: {chunk.id}"
      
      if chunk.choices[0].delta.content is not None:
        content = chunk.choices[0].delta.content
        yield f"data: {content}"
      
      if chunk.choices[0].finish_reason is not None:
        yield f"event: done\ndata: {chunk.choices[0].finish_reason}"

  except Exception as e:
    print(f"error: {e}")
    yield {
      "content": "Sorry, an error occurred while processing your request.",
      "done": True,
    }