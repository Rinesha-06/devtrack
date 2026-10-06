import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/types';
import { db } from '../repositories/firestoreRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'devtrack-super-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = await db.get<User>('users', decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or token invalid.' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: error.message });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to perform this action. Required: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
