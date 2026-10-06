import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../repositories/firestoreRepository';
import { User, UserRole } from '../models/types';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      // Check if user already exists
      const existing = await db.list<User>('users', { email: email.toLowerCase() });
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      }

      const validRoles: UserRole[] = ['PROJECT_MANAGER', 'DEVELOPER', 'TESTER'];
      const userRole: UserRole = validRoles.includes(role) ? role : 'DEVELOPER';

      const passwordHash = await bcrypt.hash(password, 10);
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const newUser: User = {
        id,
        name,
        email: email.toLowerCase(),
        role: userRole,
        passwordHash,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('users', newUser);

      const token = generateToken(newUser);
      const { passwordHash: _, ...userSafe } = newUser;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: userSafe
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const users = await db.list<User>('users', { email: email.toLowerCase() });
      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = users[0];
      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
      }

      const token = generateToken(user);
      const { passwordHash: _, ...userSafe } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: userSafe
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { passwordHash: _, ...userSafe } = req.user;
    return res.status(200).json({ success: true, user: userSafe });
  }

  static async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await db.list<User>('users');
      const safeUsers = users.map(({ passwordHash: _, ...safe }) => safe);
      return res.status(200).json({ success: true, users: safeUsers });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;
      const users = await db.list<User>('users', { email: email?.toLowerCase() });
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = users[0];
      const passwordHash = await bcrypt.hash(newPassword || 'password123', 10);
      await db.update('users', user.id, { passwordHash });

      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Password reset failed', error: error.message });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const { name, photoURL, role } = req.body;
      const updates: Partial<User> = {};
      if (name) updates.name = name;
      if (photoURL) updates.photoURL = photoURL;
      if (role && req.user.role === 'PROJECT_MANAGER') updates.role = role;

      const updated = await db.update<User>('users', req.user.id, updates);
      return res.status(200).json({ success: true, user: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Profile update failed', error: error.message });
    }
  }
}
