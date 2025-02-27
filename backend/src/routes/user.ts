import { Hono } from 'hono';
import type { Context } from 'hono';
import { User } from '../utils/models';
import { authenticateUser } from '../middleware/authmiddleware';

// Extend Hono's Context type
type CustomContext = Context & {
  get: <T = unknown>(key: 'userId') => T;
};

const userRouter = new Hono();

// Apply authentication middleware
userRouter.use('*', authenticateUser);

userRouter.get('/credentials', async (c: CustomContext) => {
  const userId = c.get<string>('userId'); // Explicitly type userId as string
  const user = await User.findById(userId).populate('credentials');
  if (!user) return c.json({ message: 'User not found' }, 404);
  if (!user.credentials || user.credentials.length === 0) {
    return c.json({ message: 'No credentials issued' });
  }
  return c.json(user.credentials);
});

userRouter.get('/profile', async (c: CustomContext) => {
  const userId = c.get<string>('userId');
  const user = await User.findById(userId).select("-password");
  if (!user) return c.json({ message: 'User not found' }, 404);
  return c.json(user)
})

userRouter.put('/profile', async (c: CustomContext) => {
  const userId = c.get<string>('userId'); // Explicitly type userId as string
  const updates = await c.req.json();
  const user = await User.findByIdAndUpdate(userId, updates, { new: true });
  if (!user) return c.json({ message: 'User not found' }, 404);
  return c.json({ message: 'Profile updated' });
});

export default userRouter;
