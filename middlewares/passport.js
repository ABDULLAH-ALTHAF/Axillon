const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user-model");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        } else {
          let userReferral = "";
          for (let i = 0; i < 12; i++) {
            userReferral += Math.floor(Math.random() * 10);
          }
          console.log(userReferral); 

          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            referral:userReferral,
            status: true,
            isAdmin: false,
          });
          await user.save();
          return done(null, user);
        }
      } catch (erorr) {
        console.log(erorr);
        return done(erorr, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

module.exports = passport;
