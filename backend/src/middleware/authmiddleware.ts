import type { Context } from 'hono';
import type { MiddlewareHandler, Env } from 'hono';
import { verify } from 'jsonwebtoken';

interface UserEnv extends Env {
    Variables: {
      userId?: string;
    };
  }
  
  export const authenticateUser: MiddlewareHandler<UserEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-key') as { userId: string };
    c.set('userId', decoded.userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
};

interface CompanyEnv extends Env {
    Variables: {
      companyId?: string;
    };
  }
  
  interface CompanyContext extends Context {
    var: {
      companyId?: string;
    };
  }

  export const authenticateCompany: MiddlewareHandler<CompanyEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-key') as { companyId: string };
    c.set('companyId', decoded.companyId);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
};