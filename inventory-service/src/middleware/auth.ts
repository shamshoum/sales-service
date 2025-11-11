import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {

  const token = req.headers.token as string;

  if (!token) {
    logger.warn('Authentication failed: No token provided', { 
      path: req.path,
      ip: req.ip 
    });
    
    // Check again before sending response
    if (!res.headersSent && !req.destroyed) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a token in the headers.'
      });
    }
    return;
  }

  const expectedToken = process.env.AUTH_TOKEN || 'inventory-service-secret-token-12345';

  if (token !== expectedToken) {
    logger.warn('Authentication failed: Invalid token', { 
      path: req.path,
      ip: req.ip 
    });
    
    // Check again before sending response
    if (!res.headersSent && !req.destroyed) {
      res.status(403).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }
    return;
  }

  logger.debug('Authentication successful', { path: req.path });
  next();
}

