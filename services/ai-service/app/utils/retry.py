import asyncio
from typing import Any, Awaitable, Callable


async def retry_async(
    fn: Callable[[], Awaitable[Any]],
    attempts: int = 3,
    base_delay: float = 0.25,
) -> Any:
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            return await fn()
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt >= attempts:
                break
            await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

    raise last_error
