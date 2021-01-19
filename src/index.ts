import { Request, Response } from 'express';
import { StrategyCreatedStatic } from 'passport';
import { generateToken, decodeToken } from './token';

type VerifyCallback = (
  payload: any,
  verifyCallback: (err?: Error, user?: Object, info?: any) => void
) => void;

interface Options {
  secret: string;
  callbackUrl: string;
  sendMagicLink: (
    destination: string,
    href: string,
    verificationCode: string,
    req: Request
  ) => Promise<void>;
  verify: VerifyCallback;

  /** @deprecated */
  confirmUrl?: string;
}

class MagicLoginStrategy {
  name: string = 'magiclogin';

  constructor(private _options: Options) {}

  authenticate(
    this: StrategyCreatedStatic & MagicLoginStrategy,
    req: Request
  ): void {
    const self = this;
    const payload = decodeToken(
      self._options.secret,
      req.query.token as string
    );

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
    const jwt = generateToken(this._options.secret, {
      ...req.body,
      code,
    });

    this._options
      .sendMagicLink(
        req.body.destination,
        `${this._options.callbackUrl}?token=${jwt}`,
        code,
        req
      )
      .then(() => {
        res.json({ success: true, code });
      })
      .catch((error: any) => {
        console.error(error);
        res.json({ success: false, error });
      });
  };

  /** @deprecated */
  confirm = (req: Request, res: Response): void => {
    console.warn(
      `magicLink.confirm was removed in v1.0.7, it is no longer necessary.`
    );
    res.redirect(`${this._options.callbackUrl}?token=${req.query.token}`);
  };
}

export default MagicLoginStrategy;
