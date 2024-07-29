import { Request, Response } from 'express';
import { SignOptions } from 'jsonwebtoken';
import { StrategyCreatedStatic } from 'passport';
import { generateToken, decodeToken } from './token';

type VerifyCallback = (
  payload: any,
  verifyCallback: (err?: Error | null, user?: Object, info?: any) => void,
  req: Request
) => void;

interface Options {
  secret: string;
  callbackUrl: string;
  jwtOptions?: SignOptions;
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

interface Payload {
  [key: string]: any;
  destination: string;
}

interface MagicLinkInfo {
  href: string;
  code: string;
}

class MagicLoginStrategy {
  name: string = 'magiclogin';

  constructor(private _options: Options) {}

  authenticate(
    this: StrategyCreatedStatic & MagicLoginStrategy,
    req: Request
  ): void {
    const self = this;

    let payload = null;

    try {
      payload = decodeToken(
        self._options.secret,
        (req.query.token || req.body?.token) as string
      );
    } catch (error) {
      const defaultMessage = 'No valid token provided';
      const message = error instanceof Error ? error.message : defaultMessage;

      return self.fail(message);
    }

    const verifyCallback = function (
      err?: Error | null,
      user?: Object,
      info?: any
    ) {
      if (err) {
        return self.error(err);
      } else if (!user) {
        return self.fail(info);
      } else {
        return self.success(user, info);
      }
    };

    self._options.verify(payload, verifyCallback, req);
  }

  send = (req: Request, res: Response): void => {
    const payload: Payload = req.method === 'GET' ? req.query : req.body;
    if (
      req.method === 'POST' &&
      !req.headers['content-type']?.match('application/json')
    ) {
      res
        .status(400)
        .send('Content-Type must be application/json when using POST method.');
      return;
    }

    if (!payload.destination) {
      res.status(400).send('Please specify the destination.');
      return;
    }

    const { href, code } = this.create(payload);

    this._options
      .sendMagicLink(payload.destination, href, code, req)
      .then(() => {
        res.json({ success: true, code });
      })
      .catch((error: any) => {
        console.error(error);
        res.json({ success: false, error });
      });
  };

  create(destination: string): MagicLinkInfo;
  create(payload: Payload): MagicLinkInfo;
  create(payload: Payload | string): MagicLinkInfo {
    if (typeof payload === 'string') {
      payload = { destination: payload };
    }
    const code = Math.floor(Math.random() * 90000) + 10000 + '';
    const jwt = generateToken(
      this._options.secret,
      {
        ...payload,
        code,
      },
      this._options.jwtOptions
    );
    const href = `${this._options.callbackUrl}?token=${jwt}`;

    return { href, code };
  }

  /** @deprecated */
  confirm = (req: Request, res: Response): void => {
    console.warn(
      `magicLink.confirm was removed in v1.0.7, it is no longer necessary.`
    );
    res.redirect(`${this._options.callbackUrl}?token=${req.query.token}`);
  };
}

export default MagicLoginStrategy;
