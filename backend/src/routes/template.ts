import { Hono } from 'hono';
import { Template } from '../utils/models';
import { authenticateCompany } from '../middleware/authmiddleware';

type ContextBindings = {
  Variables: {
    companyId: string;
  };
};

const templateRouter = new Hono<ContextBindings>();

templateRouter.use('*', authenticateCompany);

templateRouter.get('/', async (c) => {
  const companyId = c.get('companyId'); // Now TypeScript knows companyId exists
  if (!companyId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const templates = await Template.find({ company: companyId });
  return c.json(templates);
});

export default templateRouter;
