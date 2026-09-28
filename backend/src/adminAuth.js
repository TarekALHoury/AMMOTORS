function createRequireAdmin(adminAuth) {
  return async function requireAdmin(request, response, next) {
    if (!adminAuth) {
      return response.status(503).json({ message: 'Admin service is not configured.' });
    }

    const authorization = request.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      response.set('WWW-Authenticate', 'Bearer realm="AMMOTORS Admin"');
      return response.status(401).json({ message: 'Authentication required.' });
    }

    try {
      const user = await adminAuth.verifyIdToken(match[1], true);
      if (user.admin !== true) {
        return response.status(403).json({ message: 'Admin access required.' });
      }
      request.adminUser = user;
      return next();
    } catch {
      response.set('WWW-Authenticate', 'Bearer realm="AMMOTORS Admin", error="invalid_token"');
      return response.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
  };
}

module.exports = { createRequireAdmin };
