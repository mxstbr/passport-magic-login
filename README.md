# passport-magic-login

## Usage

### Backend setup

```JS
import createMagicLink from "passport-magic-login"

const magicLink = createMagicLink({
  secret: process.env.MAGIC_LINK_SECRET,
  callbackUrl: "/auth/magiclink/callback",
  confirmUrl: "/auth/magiclink/confirm",
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

passport.use(magicLink.strategy)

app.post("/auth/magiclink", magicLink.send);
app.get(magicLink.confirmUrl, magicLink.confirm);
app.get(magicLink.callbackUrl, passport.authenticate("magiclink"));
```

### Frontend

```JS
fetch(`/auth/magiclink`, {
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