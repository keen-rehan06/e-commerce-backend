import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import passport from "passport";

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret:process.env.GOOGLE_AUTH_CLIENT_SECRET,
    callbackURL:process.env.CALLBACK_URL
},
function(accessToken,refreshToken,profile,cb) {
    return cb(null,profile);
}
));

passport.serializeUser(function(user,done){
    done(null,user);
})

passport.deserializeUser(function(user,done){
    done(null,user);
});

export default GoogleStrategy;