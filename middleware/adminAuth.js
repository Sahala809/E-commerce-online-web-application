export const isAdminLogin = (req, res, next) => {

    if (!req.session.admin) {

        return res.redirect("/admin/login");

    }

    next();

};

export const isAdminLogout = (req, res, next) => {

    if (req.session.admin) {

        return res.redirect("/admin/dashboard");

    }

    next();

};