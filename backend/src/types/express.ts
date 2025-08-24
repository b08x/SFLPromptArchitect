/**
 * @file express.ts
 * @description Express.js type extensions for authentication middleware integration
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

export {};