import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import connectDB from './utils/database';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import companyRouter from './routes/company';
import templateRouter from './routes/template';
import credsRouter from './routes/creds';

const app = new Hono();

app.use('*', cors({
  origin: 'http://localhost:3001', // Allow requests from your frontend's origin
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies and other credentials
}));

app.use('/public/*', serveStatic({ root: './public' }));

app.route('/api/auth', authRouter);
app.route('/api/user', userRouter);
app.route('/api/company', companyRouter);
app.route('/api/template', templateRouter);
app.route('/api/creds', credsRouter);

connectDB();

export default { 
  port: 3000, 
  fetch: app.fetch, 
} 
