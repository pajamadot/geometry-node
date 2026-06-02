import type { MiddlewareHandler } from 'hono';
import { createClerkClient } from '@clerk/backend';
import type { Env } from './index';

/** Verifies the Clerk session token from the Authorization: Bearer header. */
export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: { userId: string } }> =
  async (c, next) => {
    const clerk = createClerkClient({
      secretKey: c.env.CLERK_SECRET_KEY,
      publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    });
    const requestState = await clerk.authenticateRequest(c.req.raw, {
      authorizedParties: [c.env.ALLOWED_ORIGIN],
    });
    if (!requestState.isSignedIn) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }
    const auth = requestState.toAuth();
    const userId = auth.userId;
    if (!userId) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }
    c.set('userId', userId);
    await next();
  };
