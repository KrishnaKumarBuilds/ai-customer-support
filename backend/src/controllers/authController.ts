import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'supportiq_enterprise_jwt_super_secret_key_2026_antigravity';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn: expiresIn as any }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, skills, company, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default to CUSTOMER unless explicitly set by admin or during demo setup
    const userRole = role && ['ADMIN', 'AGENT', 'CUSTOMER'].includes(role) ? role : 'CUSTOMER';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      skills: Array.isArray(skills) ? skills : [],
      company: company || '',
      phone: phone || '',
      availability: 'AVAILABLE'
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        availability: user.availability,
        company: user.company,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register user.',
      error: error.message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        availability: user.availability,
        company: user.company,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error.',
      error: error.message
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    return res.json({
      success: true,
      user: req.user
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { name, phone, company, skills, availability } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;

    // Only agents and admins can update skills & availability
    if (user.role === 'AGENT' || user.role === 'ADMIN') {
      if (Array.isArray(skills)) user.skills = skills;
      if (availability && ['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
        user.availability = availability;
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message
    });
  }
};
