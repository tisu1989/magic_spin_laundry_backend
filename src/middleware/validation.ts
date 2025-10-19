import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'Only Gmail addresses are allowed' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (!validator.isMobilePhone(phone, 'any')) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  if (full_name.length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};