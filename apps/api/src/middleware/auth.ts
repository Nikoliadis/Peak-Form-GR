import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: 'TRAINER' | 'ATHLETE';
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(role: 'TRAINER' | 'ATHLETE') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
}
