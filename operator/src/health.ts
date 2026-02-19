/**
 * Health check HTTP endpoint for the operator service.
 *
 * @module
 */

import { createServer, type Server } from 'node:http';
import { type Logger } from 'pino';
import { type LifecycleManager } from './lifecycle.js';

export function startHealthServer(
  port: number,
  lifecycle: LifecycleManager,
  logger: Logger,
): Server {
  const server = createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        status: 'ok',
        currentState: lifecycle.currentState,
        consecutiveErrors: lifecycle.errorCount,
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    logger.info({ port }, 'Health server started');
  });

  return server;
}
