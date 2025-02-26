import { hash, compare } from 'bcrypt';

const saltRounds = 10;

export const hashPassword = async (password: string) => {
  return hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string) => {
  return compare(password, hashedPassword);
};