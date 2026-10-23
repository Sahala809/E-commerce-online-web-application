
import User from "../models/usermodel.js";

export const checkBlockedUser = async (req, res, next) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        const userId = req.session?.user;

        // No logged-in user: allow public pages such as login
        if (!userId) {
            return next();
        }

        // Always check the latest database status
        const user = await User.findById(userId).select("isBlocked");

        if (!user || user.isBlocked) {
            return req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }

                res.clearCookie("connect.sid");
                return res.redirect(303, "/user/login");
            });
        }

        return next();

    } catch (error) {
        return next(error);
    }
};
