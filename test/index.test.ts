import createMagicLink from '../src';

it('returns some properties', () => {
  expect(
    createMagicLink({
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
    Object {
      "strategy": [Function],
    }
  `);
});
