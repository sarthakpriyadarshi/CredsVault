import { Hono, type Context } from 'hono';
import { Company, User, Credentials, Template } from '../utils/models';
import type { CompanyData } from '../utils/models';
import { generateCertificateImage } from '../utils/image';
import { sendEmail } from '../utils/email';
import { authenticateCompany } from '../middleware/authmiddleware';
import { Types } from 'mongoose';

const companyRouter = new Hono();

companyRouter.use('*', authenticateCompany);

companyRouter.post('/issue-cred', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  if (!companyId) return c.json({ error: 'Unauthorized' }, 401);
  const { userEmail, templateId, data } = await c.req.json();

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

  // Validate that all placeholders have corresponding data
  const placeholders = template.placeholders;
  const dataWithServerValues = { ...data };
  const issueDate = new Date().toISOString().split('T')[0];
  if (placeholders.find(p => p.key === 'issueDate')) {
    dataWithServerValues.issueDate = issueDate;
  }

  for (const placeholder of placeholders) {
    if (!dataWithServerValues[placeholder.key]) {
      return c.json({ message: `Missing data for placeholder ${placeholder.key}` }, 400);
    }
  }

  const certificateImagePath = await generateCertificateImage(
    template.templateImage,
    placeholders,
    dataWithServerValues
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
  // Expecting payload: { name, file, elements }
  const { name, file, elements } = await c.req.json();

  // Extract placeholders from text elements.
  // Ensure that label is always defined (using a default if needed)
  const placeholders = elements
    .filter((el: any) => el.type === 'text')
    .map((el: any) => ({
      label: el.label || "Placeholder", // ensure label is defined
      x: el.x,
      y: el.y,
      width: el.width || 150,  // default width if missing
      height: el.height || 50, // default height if missing
      fontSize: el.fontSize || 20,
      fontStyle: el.fontStyle || 'normal',
      fontFamily: el.fontFamily || 'Arial',
      align: el.align || 'left',
      fill: el.fill || 'black',
    }));

  const template = new Template({
    company: companyId,
    name,
    templateImage: file,
    placeholders,
  });

  await template.save();
  return c.json({ message: 'Template created' });
});


companyRouter.get('/profile', async (c: Context) => {
  const companyId = c.get<string>('companyId');
  const company = await Company.findById(companyId).select("-password");
  if (!company) return c.json({ message: 'Company not found' }, 404);
  return c.json(company);
});


companyRouter.put('/profile', async (c: Context) => {
  const companyId = c.get('companyId') as string;
  const updates = await c.req.json();

  const company = await Company.findByIdAndUpdate(companyId, updates, { new: true });
  if (!company) return c.json({ message: 'Company not found' }, 404);

  return c.json({ message: 'Profile updated' });
});

companyRouter.get('/dashboard', async (c: Context) => {
  const companyId = c.get<string>('companyId');
  const company = await Company.findById(companyId).select('name email');
  if (!company) return c.json({ message: 'Company not found' }, 404);
  const totalTemplates = await Template.countDocuments({ company: companyId });
  const totalCredentialsIssued = await Credentials.countDocuments({ 
    company: companyId, 
    isRevoked: false 
  });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTemplates = await Template.countDocuments({ 
    company: companyId, 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  const pendingCredentials = await Credentials.countDocuments({ 
    company: companyId, 
    downloads: 0, 
    featured: false, 
    isRevoked: false 
  });
  const companyData: CompanyData = {
    name: company.name,
    email: company.email,
    totalTemplates,
    totalCredentialsIssued,
    recentTemplates,
    pendingCredentials,
  };

  return c.json(companyData);
});

export default companyRouter;