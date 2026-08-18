export const checkBlockedUser = async (req, res, next) => {

    try {

        // User is not logged in
        if (!req.session.user) {
            return next();
        }

        const user = await User.findById(req.session.user);

        // User doesn't exist
        if (!user) {
            req.session.destroy(() => {
                return res.redirect("/user/login");
            });
            return;
        }

        // Admin blocked the user
        if (user.isBlocked) {

            req.session.destroy(() => {
                return res.redirect("/user/login?blocked=true");
            });

            return;
        }

        // User is okay
        next();

    } catch (error) {

        console.log("CHECK BLOCKED USER ERROR:", error);

        return res.redirect("/user/login");

    }
};