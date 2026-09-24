function createRateLimiter({ windowMs = 60_000, limit = 120, keyPrefix = 'public', now = Date.now } = {}) {
  const clients = new Map();
  return function rateLimit(request, response, next) {
    const timestamp = now();
    const key = `${keyPrefix}:${request.ip || request.socket?.remoteAddress || 'unknown'}`;
    let entry = clients.get(key);
    if (!entry || timestamp >= entry.resetAt) {
      entry = { count: 0, resetAt: timestamp + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;
    response.set({
      'RateLimit-Limit': String(limit),
      'RateLimit-Remaining': String(Math.max(0, limit - entry.count)),
      'RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
    });
    if (entry.count > limit) {
      response.set({ 'Cache-Control': 'no-store', 'Retry-After': String(Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1000))) });
      return response.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    if (clients.size > 10_000) {
      for (const [clientKey, value] of clients) if (timestamp >= value.resetAt) clients.delete(clientKey);
    }
    return next();
  };
}

module.exports = { createRateLimiter };
