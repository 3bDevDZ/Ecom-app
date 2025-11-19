/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-namespace */
import 'express-session';

declare module 'express-session' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface SessionData {
    // Add custom session props if needed
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
    }
  }
}
