# passport-magic-login

Passwordless authentication with magic links for Passport.js.

As seen on [Splitbee](https://splitbee.io) and [Feedback Fish](https://feedback.fish):

<img width="1230" alt="Screenshot 2021-01-09 at 16 55 23" src="https://user-images.githubusercontent.com/7525670/104096256-ae24fc00-529b-11eb-9d21-cebae7bc706d.png">

<img width="1230" alt="Screenshot 2021-01-09 at 16 55 28" src="https://user-images.githubusercontent.com/7525670/104096254-ad8c6580-529b-11eb-9c96-d12e9d14c543.png">

<img width="1230" alt="Screenshot 2021-01-09 at 16 56 24" src="https://user-images.githubusercontent.com/7525670/104096252-a9604800-529b-11eb-92d5-31a144871fe4.png">


## Usage

### Backend setup

```JS
import MagicLoginStrategy from "passport-magic-login"

const magicLogin = new MagicLoginStrategy({
  secret: process.env.MAGIC_LINK_SECRET,
  callbackUrl: "/auth/magiclogin/callback",
  confirmUrl: "/auth/magiclogin/confirm",
  sendMagicLink: async (destination, href) => {
    // You have to implement sending the login link to the right 
    // destination (e.g. email or sms) yourself!
    await sendEmail({
      to: destination,
      body: `Click this link to finish logging in: https://yourcompany.com${href}`
    })
  },
  verify: (payload, callback) => {
    // Get or create a user with the provided email in your database
    getOrCreateUserWithEmail(payload.destination).then(user => {
      callback(null, user)
    }).catch(err => {
      callback(err)
    })
  }
})

passport.use(magicLogin)

app.post("/auth/magiclogin", magicLogin.send);
app.get(magicLogin.confirmUrl, magicLogin.confirm);
app.get(magicLogin.callbackUrl, passport.authenticate("magiclogin"));
```

### Frontend

```JS
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
    // You can now prompt the user to click on the link in their email
    // We recommend you display json.code in the UI (!) so the user can verify
    // that they're clicking on the link for their _current_ login attempt
    document.body.innerText = json.code
  })
```
