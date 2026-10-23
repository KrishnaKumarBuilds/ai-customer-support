import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'supportiq_enterprise_jwt_super_secret_key_2026_antigravity';

    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: error.message
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user.role}'. Required roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
};
