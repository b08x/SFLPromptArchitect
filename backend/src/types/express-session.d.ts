// backend/src/types/express-session.d.ts

import 'express-session';
import { AIProvider } from './aiProvider';

declare module 'express-session' {
  interface SessionData {
    apiKeys?: {
      [provider: string]: {
        encrypted: string;
        iv: string;
        tag: string;
        timestamp: number;
      };
    };
    baseUrls?: {
      [provider: string]: string;
    };
    preferredProvider?: AIProvider;
  }
}
