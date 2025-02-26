import { Schema, model, Document, Types } from 'mongoose';

// Define TypeScript interfaces
export interface IUser extends Document {
  email: string;
  name?: string;
  linkedIn?: string;
  about?: string;
  displayPicture?: string;
  customLink?: string;
  generation?: number;
  credentials: Types.ObjectId[];
  password: string;
}

export interface ICompany extends Document {
  name: string;
  email: string;
  website?: string;
  logo?: string;
  credentials: Types.ObjectId[];
  password: string;
}

export interface ITemplate extends Document {
  company: Types.ObjectId;
  name: string;
  templateImage: string;
}

export interface ICredential extends Document {
  company: Types.ObjectId | ICompany; // This allows population
  user: Types.ObjectId;
  template: Types.ObjectId;
  issueDate: Date;
  isRevoked: boolean;
  certificateImage?: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: null },
  linkedIn: { type: String, default: null },
  about: { type: String, default: null },
  displayPicture: { type: String, default: null },
  customLink: { type: String, default: null },
  generation: { type: Number, default: null },
  credentials: [{ type: Schema.Types.ObjectId, ref: 'Credentials' }],
  password: { type: String, required: true },
});

export const User = model<IUser>('User', userSchema);

const companySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // <-- add this line
  website: { type: String },
  logo: { type: String },
  credentials: [{ type: Schema.Types.ObjectId, ref: 'Credential' }],
  password: { type: String, required: true },
});

export const Company = model<ICompany>('Company', companySchema);

const templateSchema = new Schema<ITemplate>({
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  name: { type: String, required: true },
  templateImage: { type: String, required: true },
});

export const Template = model<ITemplate>('Template', templateSchema);

const credentialSchema = new Schema<ICredential>({
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  template: { type: Schema.Types.ObjectId, ref: 'Template' },
  issueDate: { type: Date, default: Date.now },
  isRevoked: { type: Boolean, default: false },
  certificateImage: { type: String },
});

export const Credentials = model<ICredential>('Credentials', credentialSchema);
