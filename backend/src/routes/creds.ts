import { Hono } from 'hono';
import { Credentials, type ICompany } from '../utils/models';

const credsRouter = new Hono();

credsRouter.get('/verify/:id', async (c) => {
  const { id } = c.req.param();
  const cred = await Credentials.findById(id).populate<{ company: ICompany }>('company');
  if (!cred || cred.isRevoked) {
    return c.json({ valid: false, message: 'Credential not found or revoked' }, 404);
  }
  return c.json({ valid: true, company: cred.company.name, issueDate: cred.issueDate });
});

export default credsRouter;