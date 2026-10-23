
import User from "../models/usermodel.js";

export const isLogin = async (req, res, next) => {
    // Prevent browser from caching protected pages
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    try {
        const userId = req.session?.user;

        if (!userId) {
            return res.redirect(303, "/user/login");
        }

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
