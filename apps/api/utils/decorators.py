import functools
import time
import asyncio

def measure_time(func):
  @functools.wraps(func)
  async def async_wrapper(*args, **kwargs):
    start_time = time.time()
    result = await func(*args, **kwargs)
    end_time = time.time()
    print(f"===============\n{func.__name__} took {end_time - start_time} seconds\n===============")
    return result

  @functools.wraps(func)
  def sync_wrapper(*args, **kwargs):
    start_time = time.time()
    result = func(*args, **kwargs)
    end_time = time.time()
    print(f"===============\n{func.__name__} took {end_time - start_time} seconds\n===============")
    return result

  if asyncio.iscoroutinefunction(func):
    return async_wrapper
  else:
    return sync_wrapper