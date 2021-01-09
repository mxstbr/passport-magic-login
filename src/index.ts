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

declare class MagicLinkStrategy {
  constructor(options: Options);
  authenticate(req: Request): void;
}

function MagicLinkStrategy(options: Options) {
  Strategy.call(this);
  this.name = 'magiclogin';
  this._options = options;
}

util.inherits(MagicLinkStrategy, Strategy);

MagicLinkStrategy.prototype.authenticate = function(req) {
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

  self.options.verify(payload, verifyCallback);
};

const createMagicLink = (options: Options) => {
  const sendMagicLink = async (req: Request, res: Response) => {
    if (!req.body.destination) {
      res.status(400).send('Please specify the destination.');
      return;
    }

    const code = Math.floor(Math.random() * 90000) + 10000 + '';
    const jwt = generateToken({
      secret: options.secret,
      destination: req.body.destination,
      code,
    });

    await options.sendMagicLink(
      req.body.destination,
      `${options.confirmUrl}?token=${jwt}`,
      code
    );

    res.json({ success: true, code });
  };

  const confirmMagicLink = async (req: Request, res: Response) => {
    const data = decodeToken({
      token: req.query.token as string,
      secret: options.secret,
    });

    if (data) {
      res.redirect(`${options.callbackUrl}?token=${req.query.token}`);
    } else {
      res.send('Expired login link. Please try again!');
    }
  };

  return {
    strategy: new MagicLinkStrategy(options),
    send: sendMagicLink,
    confirm: confirmMagicLink,
    confirmUrl: options.confirmUrl,
    callbackUrl: options.callbackUrl,
  };
};

export default createMagicLink;
