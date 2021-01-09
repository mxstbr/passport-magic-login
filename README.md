# passport-magic-login

Passwordless authentication with magic links for Passport.js 🔑

- User signup and login without passwords
- Supports magic links sent via email, SMS or any other method you prefer
- User interface agnostic: all you need is an input and a confirmation screen
- Handles secure token generation, expiration and confirmation

Originally implemented by [Tobias Lins](https://twitter.com/linstobias) for [Splitbee](https://splitbee.io). Here's a live, production example from [Feedback Fish](https://feedback.fish):

<img width="1230" alt="Screenshot 2021-01-09 at 16 55 23" src="https://user-images.githubusercontent.com/7525670/104096256-ae24fc00-529b-11eb-9d21-cebae7bc706d.png">

<img width="1230" alt="Screenshot 2021-01-09 at 16 55 28" src="https://user-images.githubusercontent.com/7525670/104096254-ad8c6580-529b-11eb-9c96-d12e9d14c543.png">

<img width="1230" alt="Screenshot 2021-01-09 at 16 56 24" src="https://user-images.githubusercontent.com/7525670/104096252-a9604800-529b-11eb-92d5-31a144871fe4.png">


## Usage

To use magic link authentication, you have to:

1. Setup the Passport strategy and Express routes on your server
2. POST a request with the users email or phone number from the client once they have entered it into the login input

### Backend setup

```JS
import MagicLoginStrategy from "passport-magic-login"

// Important note: all these options are REQUIRED!
const magicLogin = new MagicLoginStrategy({
  secret: process.env.MAGIC_LINK_SECRET, // Used to encrypt the authentication token. Needs to be long, unique and (duh) secret.
  callbackUrl: "/auth/magiclogin/callback", // The URL you want to expose for the callback
  confirmUrl: "/auth/magiclogin/confirm", // The URL you want to expose to confirm a token
  // Send the generated magic link with the token to the user provided destination
  // The destination is what you POST from the client, so it could be an email
  // or a phone number, whatever you choose.
  sendMagicLink: async (destination, href) => {
    // "href" is something like "/auth/magiclogin/confirm?token=<longtoken>"
    await sendEmail({
      to: destination,
      body: `Click this link to finish logging in: https://yourcompany.com${href}`
    })
  },
  // The classic Passport verify callback that every strategy has.
  // "payload" contains { "destination": "email or phone number" }
  // and you have to call callback() with the user data associated
  // with that email or phone number.
  verify: (payload, callback) => {
    // Get or create a user with the provided email from the database
    getOrCreateUserWithEmail(payload.destination).then(user => {
      callback(null, user)
    }).catch(err => {
      callback(err)
    })
  }
})

// Tell Passport about the magic login strategy
passport.use(magicLogin)

// Add the required routes to Express
app.post("/auth/magiclogin", magicLogin.send);
app.get(magicLogin.confirmUrl, magicLogin.confirm);
app.get(magicLogin.callbackUrl, passport.authenticate("magiclogin"));
```

### Frontend setup

```JS
// POST a request with the users email or phone number to the server
fetch(`/auth/magiclogin`, {
  method: `POST`,
  body: JSON.stringify({
    destination: email, // Could also be destination: phoneNumber if you want to use SMS
  }),
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(json => {
    if (json.success) {
      // The request successfully completed and the email to the user with the
      // magic login link was sent!
      // You can now prompt the user to click on the link in their email
      // We recommend you display json.code in the UI (!) so the user can verify
      // that they're clicking on the link for their _current_ login attempt
      document.body.innerText = json.code
    }
  })
```
