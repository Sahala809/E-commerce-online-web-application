import "dotenv/config"

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/userModel.js";

console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
console.log("CLIENT SECRET:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/user/auth/google/callback"
        },
        
        async (accessToken, refreshToken, profile, done) => {

            try {

                const email = profile.emails[0].value;

                let user = await User.findOne({ email });

                if (!user) {

                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email,
                        phone: "",
                        password: "",
                        profileImage: profile.photos?.[0]?.value || "",
                        isVerified: true
                    });

                } else {

                    // Link Google account if user already exists
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }

                }

                return done(null, user);

            } catch (error) {

                return done(error, null);

            }

        }
    )
);

// Save user ID in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Retrieve user from session
passport.deserializeUser(async (id, done) => {

    try {

        const user = await User.findById(id);

        done(null, user);

    } catch (error) {

        done(error, null);

    }

});