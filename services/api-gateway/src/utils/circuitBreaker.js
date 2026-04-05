class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 30000;
    this.successThreshold = options.successThreshold || 2;

    this.state = 'CLOSED';
    this.failures = 0;
    this.halfOpenSuccesses = 0;
    this.openedAt = null;
  }

  canRequest() {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      if (this.openedAt && now - this.openedAt >= this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenSuccesses = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses += 1;
      if (this.halfOpenSuccesses >= this.successThreshold) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.halfOpenSuccesses = 0;
      }
      return;
    }

    this.failures = 0;
  }

  onFailure() {
    if (this.state === 'HALF_OPEN') {
      this.tripOpen();
      return;
    }

    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.tripOpen();
    }
  }

  tripOpen() {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.failures = 0;
    this.halfOpenSuccesses = 0;
  }
}

module.exports = CircuitBreaker;
