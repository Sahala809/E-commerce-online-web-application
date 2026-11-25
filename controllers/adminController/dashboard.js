import {
    dashboardService
} from "../../services/admin/dashbordService.js";


export const loadDashboard = async (req, res) => {
    try {
        const result = await dashboardService();

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/dashboard", {
            activePage: "dashboard",
            pageTitle: "Dashboard",

            
            totalUsers: result.totalUsers || 0,
            totalProducts: result.totalProducts || 0,
            totalOrders: result.totalOrders || 0,
            totalRevenue: result.totalRevenue || 0,

            
            bestSellingProducts: result.bestSellingProducts || [],
            recentOrders: result.recentOrders || [],
            weeklyTopCustomers: result.weeklyTopCustomers || [],
            salesChartData: result.salesChartData || [],
            
            successMessage,
            errorMessage
        });

    } catch (error) {
        console.log("LOAD DASHBOARD ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/login");
    }
};
