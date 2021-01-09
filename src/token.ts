import jwt from 'jsonwebtoken';

type JwtPayload = {
  destination: string;
  code: string;
};

export const decodeToken = ({
  secret,
  token,
}: {
  secret: string;
  token?: string;
}) => {
  if (!token) {
    return false;
  }
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err) {
    return false;
  }
};

export const generateToken = ({
  secret,
  destination,
  code,
}: {
  secret: string;
  destination: string;
  code: string;
}) =>
  jwt.sign(
    {
      destination,
      code,
    },
    secret,
    {
      expiresIn: '60min',
    }
  );
