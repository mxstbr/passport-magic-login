import jwt from 'jsonwebtoken';

type JwtPayload = {
  destination: string;
  code: string;
  [key: string]: any;
};

export const decodeToken = (secret: string, token?: string) => {
  if (typeof token !== 'string') {
    return false;
  }

  return jwt.verify(token, secret) as JwtPayload;
};

export const generateToken = (secret: string, payload: JwtPayload) =>
  jwt.sign(payload, secret, {
    expiresIn: '60min',
  });
