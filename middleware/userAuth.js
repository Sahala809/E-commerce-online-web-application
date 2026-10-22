import User from "../models/userModel.js";

export const isLogin = async (req, res, next) => {
    try {
        const userId = req.session?.user;

        if (!userId) {
            return res.redirect("/user/login");
        }

        const user = await User.findById(userId).select("isBlocked");

        if (!user || user.isBlocked) {
            return req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }

                res.clearCookie("connect.sid");
                res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

                return res.redirect(303, "/user/login");
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};