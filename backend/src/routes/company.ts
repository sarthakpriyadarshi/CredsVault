import { Hono, type Context } from 'hono';
import { Company, User, Credentials, Template } from '../utils/models';
import { generateCertificateImage } from '../utils/image';
import { sendEmail } from '../utils/email';
import { authenticateCompany } from '../middleware/authmiddleware';
import { Types } from 'mongoose';

const companyRouter = new Hono();

companyRouter.use('*', authenticateCompany);

companyRouter.post('/issue-cred', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  if (!companyId) return c.json({ error: 'Unauthorized' }, 401);
  const { userEmail, templateId, name } = await c.req.json();
  
  const company = await Company.findById(companyId);
  if (!company) return c.json({ message: 'Company not found' }, 404);

  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = new User({ email: userEmail, credentials: [] });
    await user.save();
  }

  const template = await Template.findById(templateId);
  if (!template || template.company.toString() !== companyId) {
    return c.json({ message: 'Template not found' }, 404);
  }

  const issueDate = new Date().toISOString().split('T')[0];
  const certificateImagePath = await generateCertificateImage(
    template.templateImage,
    name,
    issueDate
  );

  const cred = new Credentials({
    company: companyId,
    user: user._id,
    template: templateId,
    issueDate: new Date(),
    certificateImage: certificateImagePath,
  });
  await cred.save();

  user.credentials.push(cred._id as Types.ObjectId);
  await user.save();
  company.credentials.push(cred._id as Types.ObjectId);
  await company.save();
  const link = `http://localhost:3000/credentials/${(cred._id as Types.ObjectId).toString()}`;
  await sendEmail(user.email, 'Your new credential', `View at ${link}`);

  return c.json({ message: 'Credential issued', link });
});

companyRouter.post('/revoke-cred', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  const { credId } = await c.req.json();
  
  const cred = await Credentials.findOne({ _id: credId, company: companyId });
  if (!cred) return c.json({ message: 'Credential not found' }, 404);
  
  cred.isRevoked = true;
  await cred.save();
  return c.json({ message: 'Credential revoked' });
});

companyRouter.post('/create-template', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  const { name, templateImage } = await c.req.json();
  
  const template = new Template({ company: companyId, name, templateImage });
  await template.save();
  return c.json({ message: 'Template created' });
});

companyRouter.put('/profile', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  const updates = await c.req.json();
  
  const company = await Company.findByIdAndUpdate(companyId, updates, { new: true });
  if (!company) return c.json({ message: 'Company not found' }, 404);
  
  return c.json({ message: 'Profile updated' });
});

export default companyRouter;
