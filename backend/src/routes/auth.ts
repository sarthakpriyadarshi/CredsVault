import { Hono, type Context } from 'hono';
import { User, Company } from '../utils/models';
import { hashPassword, comparePassword } from '../utils/password';
import { sign } from 'jsonwebtoken';

const authRouter = new Hono();

authRouter.post('/user-register', async (c: Context) => {
  const { email, password, name } = await c.req.json(); // FIXED
  const user = new User({ email, name, password: await hashPassword(password) });
  await user.save();
  const token = sign({ userId: user._id }, process.env.JWT_SECRET || 'default-secret-key'); // FIXED
  return c.json({ token });
});

authRouter.post('/user-login', async (c: Context) => {
  const { email, password } = await c.req.json(); // FIXED
  const user = await User.findOne({ email });
  if (user && await comparePassword(password, user.password)) {
    const token = sign({ userId: user._id }, process.env.JWT_SECRET || 'default-secret-key'); // FIXED
    console.log(`User Token: ${token}`)
    return c.json({ token });
  }
  return c.json({ message: 'Login failed' }, 401);
});

authRouter.post('/company-register', async (c: Context) => {
  const { name, email, password } = await c.req.json(); // FIXED
  const company = new Company({ name, email, password: await hashPassword(password) });
  await company.save();
  const token = sign({ companyId: company._id }, process.env.JWT_SECRET || 'default-secret-key'); // FIXED
  return c.json({ token });
});

authRouter.post('/company-login', async (c: Context) => {
  const { email, password } = await c.req.json(); // FIXED
  const company = await Company.findOne({ email });
  if (company && await comparePassword(password, company.password)) {
    const token = sign({ companyId: company._id }, process.env.JWT_SECRET || 'default-secret-key'); // FIXED
    console.log(`Company Token: ${token}`)
    return c.json({ token });
  }
  return c.json({ message: 'Login failed' }, 401);
});

export default authRouter;
