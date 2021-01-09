import util from 'util';
import { Request, Response } from 'express';
import { generateToken, decodeToken } from './token';
const Strategy = require('passport-strategy');

type VerifyCallback = (
  payload: any,
  verifyCallback: (err?: Error, user?: Object, info?: any) => void
) => void;

interface Options {
  secret: string;
  callbackUrl: string;
  confirmUrl: string;
  sendMagicLink: (
    destination: string,
    href: string,
    verificationCode: string
  ) => Promise<void>;
  verify: VerifyCallback;
}

declare class MagicLoginStrategy {
  constructor(options: Options);
  authenticate(req: Request): void;
  confirm(req: Request, res: Response): void;
  send(req: Request, res: Response): void;
}

function MagicLoginStrategy(options: Options) {
  Strategy.call(this);
  this.name = 'magiclogin';
  this.callbackUrl = options.callbackUrl;
  this.confirmUrl = options.confirmUrl;
  this._options = options;
}

util.inherits(MagicLoginStrategy, Strategy);

MagicLoginStrategy.prototype.authenticate = function(req) {
  const self = this;
  const payload = decodeToken({
    secret: self._options.secret,
    token: req.query.token as string,
  });
  const verifyCallback = function(err?: Error, user?: Object, info?: any) {
    if (err) {
      return self.error(err);
    } else if (!user) {
      return self.fail(info);
    } else {
      return self.success(user, info);
    }
  };

  self._options.verify(payload, verifyCallback);
};

MagicLoginStrategy.prototype.send = async function(
  req: Request,
  res: Response
) {
  if (!req.body.destination) {
    res.status(400).send('Please specify the destination.');
    return;
  }

  const code = Math.floor(Math.random() * 90000) + 10000 + '';
  const jwt = generateToken({
    secret: this._options.secret,
    destination: req.body.destination,
    code,
  });

  await this._options.sendMagicLink(
    req.body.destination,
    `${this._options.confirmUrl}?token=${jwt}`,
    code
  );

  res.json({ success: true, code });
};

MagicLoginStrategy.prototype.confirm = function(req: Request, res: Response) {
  const data = decodeToken({
    token: req.query.token as string,
    secret: this._options.secret,
  });

  if (data) {
    res.redirect(`${this._options.callbackUrl}?token=${req.query.token}`);
  } else {
    res.send('Expired login link. Please try again!');
  }
};

export default MagicLoginStrategy;
