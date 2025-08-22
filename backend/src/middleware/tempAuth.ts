/**
 * @file tempAuth.ts
 * @description Temporary authentication middleware that sets a system user
 * This is a temporary solution until proper authentication is implemented
 * 
 * WARNING: This middleware provides no real security and should be replaced
 * with proper authentication (JWT, OAuth, etc.) before production use
 */

import { Request, Response, NextFunction } from 'express';
import '../types/express';

/**
 * Temporary authentication middleware that sets a default system user
 * This allows the application to function while maintaining the security
 * improvements made in commit 215cd0c
 * 
 * @param req Express request object
 * @param res Express response object  
 * @param next Express next function
 */
export const tempAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set a temporary system user - replace with real authentication
  req.user = {
    id: '00000000-0000-0000-0000-000000000001', // System user ID from migration
    username: 'system',
    role: 'admin'
  };
  
  next();
};

export default tempAuthMiddleware;