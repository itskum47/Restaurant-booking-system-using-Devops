import time
from typing import Any, Awaitable, Callable, Optional


class AsyncCircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: int = 30,
        half_open_success_threshold: int = 2,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.half_open_success_threshold = half_open_success_threshold

        self.state = "CLOSED"
        self.failures = 0
        self.half_open_successes = 0
        self.opened_at: Optional[float] = None

    def can_execute(self) -> bool:
        if self.state == "CLOSED":
            return True

        if self.state == "OPEN":
            now = time.time()
            if self.opened_at and (now - self.opened_at) >= self.recovery_timeout_seconds:
                self.state = "HALF_OPEN"
                self.half_open_successes = 0
                return True
            return False

        return True

    def on_success(self) -> None:
        if self.state == "HALF_OPEN":
            self.half_open_successes += 1
            if self.half_open_successes >= self.half_open_success_threshold:
                self.state = "CLOSED"
                self.failures = 0
                self.half_open_successes = 0
            return

        self.failures = 0

    def on_failure(self) -> None:
        if self.state == "HALF_OPEN":
            self.trip_open()
            return

        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.trip_open()

    def trip_open(self) -> None:
        self.state = "OPEN"
        self.opened_at = time.time()
        self.failures = 0
        self.half_open_successes = 0

    async def call(
        self,
        fn: Callable[[], Awaitable[Any]],
        fallback: Optional[Callable[[], Any]] = None,
    ) -> Any:
        if not self.can_execute():
            if fallback:
                return fallback()
            raise RuntimeError(f"circuit open for {self.name}")

        try:
            result = await fn()
            self.on_success()
            return result
        except Exception:
            self.on_failure()
            if fallback:
                return fallback()
            raise
