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

const createMagicLink = (options: Options) => {
  function MagicLinkStrategy() {
    Strategy.call(this);
  }

  MagicLinkStrategy.prototype.authenticate = function(req: Request) {
    const self = this;
    const payload = decodeToken({
      secret: options.secret,
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

    options.verify(payload, verifyCallback);
  };

  util.inherits(MagicLinkStrategy, Strategy);

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
    strategy: MagicLinkStrategy,
    send: sendMagicLink,
    confirm: confirmMagicLink,
    confirmUrl: options.confirmUrl,
    callbackUrl: options.callbackUrl,
  };
};

export default createMagicLink;
