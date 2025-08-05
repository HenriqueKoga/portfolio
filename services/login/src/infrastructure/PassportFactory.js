const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

function setupPassport(passport, authService) {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    passport.use(
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        }, async (_, __, profile, done) => {
            const name = profile.displayName || profile.username || profile._json.name || profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const user = await authService.findOrCreateUser(profile.id, name, 'google', email);
            done(null, user);
        })
    );

    passport.use(
        new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
        }, async (_, __, profile, done) => {
            const name = profile.displayName || profile.username || profile._json.name || profile.id;
            const email = profile._json.email || (profile.emails && profile.emails[0] ? profile.emails[0].value : null);
            const user = await authService.findOrCreateUser(profile.id, name, 'github', email);
            done(null, user);
        })
    );
}

module.exports = setupPassport;
