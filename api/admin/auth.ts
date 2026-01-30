import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';

export function verifyToken(req: VercelRequest): { userId: number } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function unauthorized(res: VercelResponse) {
  return res.status(401).json({ message: 'Unauthorized access' });
}

export function forbidden(res: VercelResponse) {
  return res.status(403).json({ message: 'Forbidden' });
}

export function methodNotAllowed(res: VercelResponse) {
  return res.status(405).json({ message: 'Method not allowed' });
}

export function notFound(res: VercelResponse) {
  return res.status(404).json({ message: 'Resource not found' });
}
