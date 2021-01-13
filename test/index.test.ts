import MagicLinkStrategy from '../src';

it('returns some properties', () => {
  expect(
    new MagicLinkStrategy({
      secret: 'asdf',
      callbackUrl: '/auth/magiclink/callback',
      confirmUrl: '/auth/magiclink/confirm',
      sendMagicLink: async (destination, href) => {
        console.log(
          destination,
          `Click this link to finish logging in: https://yourcompany.com${href}`
        );
      },
      verify: (payload, callback) => {
        callback(payload.destination);
      },
    })
  ).toMatchInlineSnapshot(`
    MagicLoginStrategy {
      "_options": Object {
        "callbackUrl": "/auth/magiclink/callback",
        "confirmUrl": "/auth/magiclink/confirm",
        "secret": "asdf",
        "sendMagicLink": [Function],
        "verify": [Function],
      },
      "confirm": [Function],
      "name": "magiclogin",
      "send": [Function],
    }
  `);
});
