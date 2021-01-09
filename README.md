# passport-magic-login

## Usage

### Backend setup

```JS
import MagicLoginStrategy from "passport-magic-login"

const magicLogin = new MagicLoginStrategy({
  secret: process.env.MAGIC_LINK_SECRET,
  callbackUrl: "/auth/magiclogin/callback",
  confirmUrl: "/auth/magiclogin/confirm",
  sendMagicLink: async (destination, href) => {
    // You have to implement send the login link to the right 
    // destination (e.g. email or sms) yourself!
    await sendEmail({
      to: destination,
      body: `Click this link to finish logging in: https://yourcompany.com${href}`
    })
  },
  verify: (payload, callback) => {
    loadUser(payload.destination).then(user => {
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
    destination: email,
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