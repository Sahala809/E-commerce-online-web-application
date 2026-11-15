
import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";

export const dashboardService = async () => {
    try {

        // =====================================
        // 1. SUMMARY COUNTS
        // =====================================

        const totalUsers = await User.countDocuments({
            role: "user"
        });

        const totalProducts = await Product.countDocuments();

        const totalOrders = await Order.countDocuments();


        // =====================================
        // 2. PAID ORDERS
        // =====================================

        const paidOrders = await Order.find({
            paymentStatus: {
                $in: ["SUCCESS", "REFUNDED", "REFUND-PENDING"]
            }
        })
            .populate("userId", "name email profileImage")
            .sort({ createdAt: -1 });

        const paidOrderIds = paidOrders.map(order => order._id);


        // =====================================
        // 3. ORDER ITEMS
        // =====================================

        const paidOrderItems = paidOrderIds.length
    ? await OrderItem.find({
        orderId: { $in: paidOrderIds }
    })
        .populate("productId", "productName")
        .populate("variantId", "images")
    : [];

    console.log("PAID ORDER ITEMS:", paidOrderItems.length);

if (paidOrderItems.length > 0) {
    console.log("PRODUCT ID:", paidOrderItems[0].productId);
    console.log("VARIANT ID:", paidOrderItems[0].variantId);
}

        // =====================================
        // 4. CALCULATE COMPLETED REFUNDS
        // =====================================

        const orderMap = {};

        for (const order of paidOrders) {
            orderMap[order._id.toString()] = order;
        }

        const refundTotals = {};

        for (const item of paidOrderItems) {

            const orderId = item.orderId.toString();
            const order = orderMap[orderId];

            if (!order) {
                continue;
            }

            const refundAmount =
                Number(item.refundAmount) || 0;

            if (refundAmount <= 0) {
                continue;
            }

            // Cancellation refund:
            // Only ONLINE and WALLET payments are refundable
            const isCancelledRefund =
                item.orderItemStatus === "CANCELLED" &&
                ["ONLINE", "WALLET"].includes(order.paymentMethod);

            // Return refund:
            // Only approved returns are refundable
            const isApprovedReturn =
                item.orderItemStatus === "RETURNED" &&
                item.returnStatus === "APPROVED";

            if (isCancelledRefund || isApprovedReturn) {

                refundTotals[orderId] =
                    (refundTotals[orderId] || 0) + refundAmount;
            }
        }


        // =====================================
        // 5. TOTAL REVENUE
        // =====================================

        let totalRevenue = 0;

        for (const order of paidOrders) {

            const orderId = order._id.toString();

            const orderAmount =
                Number(order.totalAmount) || 0;

            const refundedAmount =
                refundTotals[orderId] || 0;

            totalRevenue += Math.max(
                0,
                orderAmount - refundedAmount
            );
        }

        totalRevenue = Number(totalRevenue.toFixed(2));


        // =====================================
        // 6. SALES SUMMARY - LAST 7 DAYS
        // =====================================

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesChartData = [];

        for (let i = 6; i >= 0; i--) {

            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const dateKey = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            salesChartData.push({
                dateKey,

                label: date.toLocaleDateString("en-IN", {
                    weekday: "short"
                }),

                revenue: 0
            });
        }

        // Calculate daily net revenue
        for (const order of paidOrders) {

            if (!order.createdAt) {
                continue;
            }

            const orderDate = new Date(order.createdAt);

            const dateKey = [
                orderDate.getFullYear(),
                String(orderDate.getMonth() + 1).padStart(2, "0"),
                String(orderDate.getDate()).padStart(2, "0")
            ].join("-");

            const dailyEntry = salesChartData.find(
                day => day.dateKey === dateKey
            );

            if (!dailyEntry) {
                continue;
            }

            const orderAmount =
                Number(order.totalAmount) || 0;

            const refundedAmount =
                refundTotals[order._id.toString()] || 0;

            const actualRevenue = Math.max(
                0,
                orderAmount - refundedAmount
            );

            dailyEntry.revenue += actualRevenue;
        }

        const formattedSalesChartData = salesChartData.map(day => ({
            label: day.label,
            revenue: Number(day.revenue.toFixed(2))
        }));


        // =====================================
        // 7. BEST-SELLING PRODUCTS - TOP 3
        // =====================================

        const productSales = {};

        for (const item of paidOrderItems) {

            if (
                ["CANCELLED", "RETURNED"].includes(
                    item.orderItemStatus
                )
            ) {
                continue;
            }

            if (!item.productId) {
                continue;
            }

            const productId = item.productId._id.toString();

            if (!productSales[productId]) {

                productSales[productId] = {
                    productId: item.productId._id,

                    productName: item.productId.productName,

                    image: item.variantId?.images?.[0]
    ? `/uploads/variants/${item.variantId.images[0]}`
    : "",

                    totalSold: 0
                };
            }

            productSales[productId].totalSold +=
                Number(item.quantity) || 0;
        }

        const bestSellingProducts = Object.values(productSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 3);


        // =====================================
        // 8. RECENT ORDERS - LATEST 5
        // =====================================

        const recentOrderDocuments = await Order.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentOrders = recentOrderDocuments.map(order => {

            const orderId = order._id.toString();

            // Option A:
            // Show original order amount.
            // Fully cancelled COD orders with no collected
            // payment should show zero.

            const isUnpaidCancelledCOD =
                order.paymentMethod === "COD" &&
                order.status === "CANCELLED" &&
                order.isPaid !== true;

            const displayAmount = isUnpaidCancelledCOD
                ? 0
                : Number(order.totalAmount) || 0;

            return {
                orderId: orderId.slice(-8).toUpperCase(),

                customerName: order.userId?.name || "Unknown",

                email: order.userId?.email || "",

                totalAmount: Number(displayAmount.toFixed(2)),

                status: order.status,

                paymentMethod: order.paymentMethod,

                paymentStatus: order.paymentStatus,

                createdAt: order.createdAt
            };
        });


        // =====================================
        // 9. WEEKLY TOP CUSTOMERS - TOP 3
        // =====================================

        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(
            sevenDaysAgo.getDate() - 7
        );

        const weeklyCustomerSales = {};

        for (const order of paidOrders) {

            if (
                !order.createdAt ||
                order.createdAt < sevenDaysAgo
            ) {
                continue;
            }

            if (!order.userId) {
                continue;
            }

            const userId = order.userId._id.toString();

            const orderAmount =
                Number(order.totalAmount) || 0;

            const refundedAmount =
                refundTotals[order._id.toString()] || 0;

            const actualSpent = Math.max(
                0,
                orderAmount - refundedAmount
            );

            if (!weeklyCustomerSales[userId]) {

                weeklyCustomerSales[userId] = {
                    userId: order.userId._id,

                    customerName: order.userId.name || "Customer",

                    email: order.userId.email || "",

                    profileImage: order.userId.profileImage || "",

                    totalSpent: 0,

                    totalOrders: 0
                };
            }

            weeklyCustomerSales[userId].totalSpent += actualSpent;

            if (actualSpent > 0) {
                weeklyCustomerSales[userId].totalOrders += 1;
            }
        }

        const weeklyTopCustomers = Object.values(weeklyCustomerSales)
            .filter(customer => customer.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 3)
            .map(customer => ({
                ...customer,

                totalSpent: Number(
                    customer.totalSpent.toFixed(2)
                )
            }));


        // =====================================
        // 10. RETURN DASHBOARD DATA
        // =====================================

        return {
            success: true,

            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,

            salesChartData: formattedSalesChartData,

            bestSellingProducts,

            recentOrders,

            weeklyTopCustomers
        };

    } catch (error) {

        console.log("DASHBOARD SERVICE ERROR:", error);

        return {
            success: false,

            totalUsers: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,

            salesChartData: [],

            bestSellingProducts: [],
            recentOrders: [],
            weeklyTopCustomers: []
        };
    }
};
