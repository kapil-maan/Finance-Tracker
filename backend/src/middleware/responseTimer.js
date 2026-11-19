/**
 * Middleware to calculate response time and attach X-Response-Time
 * and X-Cache headers for performance auditing and demonstration
 */
const responseTimer = (req, res, next) => {
  const start = process.hrtime();

  // Helper method for controllers to tag cache hits/misses
  res.setCacheStatus = (status) => {
    res.setHeader('X-Cache', status);
  };

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    // Setting header before finish if headers haven't been sent
    // For logging
    if (process.env.NODE_ENV !== 'test') {
      const cacheHeader = res.getHeader('X-Cache') || 'NONE';
      // Optional subtle log for debug
      // console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${timeInMs}ms) [Cache: ${cacheHeader}]`);
    }
  });

  // Attach X-Response-Time before response is written
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    res.setHeader('X-Response-Time', `${timeInMs}ms`);
    return originalWriteHead.apply(this, args);
  };

  next();
};

module.exports = responseTimer;
