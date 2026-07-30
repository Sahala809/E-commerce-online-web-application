import User from "../../models/userModel.js"

export const dashboardService = async (req, res) => {
    const users = await User.find()

    const totalUsers = await User.countDocuments()

    

    return {
        success: true,
        totalUsers,
        totalProducts:0,
        totalOrders:0,
        totalRevenue:0
    }

    
}