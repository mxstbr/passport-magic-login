import type { Request, Response } from 'express';
import type { StrategyCreatedStatic } from 'passport';
import { generateToken, decodeToken } from './token';

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

class MagicLoginStrategy {
  name: string = 'magiclogin';

  constructor(private _options: Options) { }

  authenticate(this: StrategyCreatedStatic & MagicLoginStrategy, req: Request): void {
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
  }

  send = (req: Request, res: Response): void => {
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
  
    this._options
      .sendMagicLink(
        req.body.destination,
        `${this._options.confirmUrl}?token=${jwt}`,
        code
      )
      .then(() => {
        res.json({ success: true, code });
      })
      .catch((error: any) => {
        console.error(error);
        res.json({ success: false, error });
      });
  }

  confirm = (req: Request, res: Response): void => {
    const data = decodeToken({
      token: req.query.token as string,
      secret: this._options.secret,
    });
  
    if (data) {
      res.redirect(`${this._options.callbackUrl}?token=${req.query.token}`);
    } else {
      res.send('Expired login link. Please try again!');
    }
  }
}

export default MagicLoginStrategy;
