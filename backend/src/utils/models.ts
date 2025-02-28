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

export interface Placeholder {
  key: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: string;
  fill?: string;
}

export interface ITemplate extends Document {
  company: Types.ObjectId;
  name: string;
  templateImage: string;
  placeholders: Placeholder[];
  createdAt: Date;
}

export interface ICredential extends Document {
  company: Types.ObjectId;
  user: Types.ObjectId;
  template: Types.ObjectId;
  issueDate: Date;
  expiryDate?: Date;
  downloads: number;
  featured: boolean;
  isRevoked: boolean;
  description?: string;
  certificateImage: string;
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
  email: { type: String, required: true, unique: true },
  website: { type: String },
  logo: { type: String },
  credentials: [{ type: Schema.Types.ObjectId, ref: 'Credential' }],
  password: { type: String, required: true },
});

export const Company = model<ICompany>('Company', companySchema);

const templateSchema = new Schema<ITemplate>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  templateImage: { type: String, required: true },
  placeholders: [{
    label: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fontSize: { type: Number, required: true, default: 20 },
    fontStyle: { type: String, default: 'normal' },
    fontFamily: { type: String, default: 'Arial' },
    align: { type: String, default: 'left' },
    fill: { type: String, default: 'black' },
  }],
  createdAt: { type: Date, default: Date.now },
});

export interface CompanyData {
  name: string;
  email: string;
  totalTemplates: number;
  totalCredentialsIssued: number;
  recentTemplates: number;
  pendingCredentials: number;
}

export const Template = model<ITemplate>('Template', templateSchema);

const credentialSchema = new Schema<ICredential>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  template: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  downloads: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
  description: { type: String },
  certificateImage: { type: String },
});

export const Credentials = model<ICredential>('Credentials', credentialSchema);