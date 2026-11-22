
import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";

export const salesReportService = async (filters = {}) => {
    try {
        const period = filters.period || "weekly";

        // PAGINATION
        const page = Math.max(1, parseInt(filters.page, 10) || 1);
        const limit = 5;

        const now = new Date();

        let startDate = new Date(now);
        let endDate = new Date(now);

        if (period === "daily") {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

        } else if (period === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23, 59, 59, 999
            );

        } else if (period === "custom" && filters.from && filters.to) {
            const from = new Date(filters.from);
            const to = new Date(filters.to);

            if (
                !Number.isNaN(from.getTime()) &&
                !Number.isNaN(to.getTime()) &&
                from <= to
            ) {
                startDate = from;
                startDate.setHours(0, 0, 0, 0);

                endDate = to;
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            }

        } else {
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        const orders = await Order.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
            paymentStatus: {
                $in: ["SUCCESS", "REFUNDED", "REFUND-PENDING"]
            }
        })
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        const orderIds = orders.map(order => order._id);

        const orderItems = orderIds.length
            ? await OrderItem.find({
                orderId: { $in: orderIds }
            })
                .populate("productId", "productName")
                .populate("variantId", "images")
            : [];

        const itemsByOrder = new Map();

        for (const item of orderItems) {
            const id = item.orderId.toString();

            if (!itemsByOrder.has(id)) {
                itemsByOrder.set(id, []);
            }

            itemsByOrder.get(id).push(item);
        }

        let grossSales = 0;
        let totalDiscounts = 0;
        let totalRefunds = 0;

        const productSales = new Map();
        const dailySales = new Map();
        const recentSales = [];

        for (const order of orders) {
            const orderId = order._id.toString();
            const items = itemsByOrder.get(orderId) || [];

            const eligibleItems = items.filter(item =>
                item.orderItemStatus === "DELIVERED" ||
                (
                    item.orderItemStatus === "RETURNED" &&
                    item.returnStatus === "APPROVED"
                )
            );

            const eligibleSubtotal = eligibleItems.reduce(
                (sum, item) =>
                    sum + (
                        Number(item.finalPrice || item.price || 0) *
                        Number(item.quantity || 0)
                    ),
                0
            );

            const couponDiscount = Number(order.discountAmount) || 0;

            let orderGross = 0;
            let orderDiscount = 0;
            let orderRefund = 0;
            let orderNet = 0;

            for (const item of eligibleItems) {
                const quantity = Number(item.quantity) || 0;
                const originalPrice = Number(item.price) || 0;
                const finalPrice = Number(item.finalPrice || item.price) || 0;

                const itemGross = originalPrice * quantity;
                const itemFinal = finalPrice * quantity;
                const productDiscount = Math.max(0, itemGross - itemFinal);

                const allocatedCoupon = eligibleSubtotal > 0
                    ? couponDiscount * (itemFinal / eligibleSubtotal)
                    : 0;

                const itemRefund =
                    item.orderItemStatus === "RETURNED" &&
                    item.returnStatus === "APPROVED"
                        ? Number(item.refundAmount) || 0
                        : 0;

                orderGross += itemGross;
                orderDiscount += productDiscount + allocatedCoupon;
                orderRefund += itemRefund;

                const productId = item.productId?._id?.toString();

                if (productId) {
                    if (!productSales.has(productId)) {
                        productSales.set(productId, {
                            productName: item.productId.productName,
                            image: item.variantId?.images?.[0]
                                ? `/uploads/variants/${item.variantId.images[0]}`
                                : "",
                            totalSold: 0,
                            revenue: 0
                        });
                    }

                    const product = productSales.get(productId);
                    product.totalSold += quantity;
                    product.revenue += itemFinal;
                }
            }

            // INCLUDE ELIGIBLE CANCELLATION REFUNDS
            for (const item of items) {
                if (item.orderItemStatus !== "CANCELLED") {
                    continue;
                }

                const refundablePayment =
                    ["ONLINE", "WALLET"].includes(order.paymentMethod) ||
                    (order.paymentMethod === "COD" && order.isPaid === true);

                if (refundablePayment) {
                    orderRefund += Number(item.refundAmount) || 0;
                }
            }

            orderNet = Math.max(
                0,
                orderGross - orderDiscount - orderRefund
            );

            grossSales += orderGross;
            totalDiscounts += orderDiscount;
            totalRefunds += orderRefund;

            const dateKey = new Date(order.createdAt).toLocaleDateString(
                "en-CA"
            );

            dailySales.set(
                dateKey,
                (dailySales.get(dateKey) || 0) + orderNet
            );

            if (orderGross > 0 || orderRefund > 0) {
                recentSales.push({
                    orderId: orderId.slice(-8).toUpperCase(),
                    date: order.createdAt,
                    customerName: order.userId?.name || "Unknown",
                    paymentMethod: order.paymentMethod,
                    amount: Number(orderNet.toFixed(2)),
                    status: order.status
                });
            }
        }

        const chartData = [];
        const cursor = new Date(startDate);

        while (cursor <= endDate) {
            const dateKey = cursor.toLocaleDateString("en-CA");

            chartData.push({
                label: cursor.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short"
                }),
                revenue: Number((dailySales.get(dateKey) || 0).toFixed(2))
            });

            cursor.setDate(cursor.getDate() + 1);
        }

        const bestSellingProducts = [...productSales.values()]
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5)
            .map(product => ({
                ...product,
                revenue: Number(product.revenue.toFixed(2))
            }));

        // PAGINATE RECENT SALES
const totalOrders = recentSales.length;
const totalPages = Math.ceil(totalOrders / limit);

const paginatedSales = filters.exportAll
    ? recentSales
    : recentSales.slice(
        (page - 1) * limit,
        page * limit
    );

        return {
            success: true,
            period,
            fromDate: startDate,
            toDate: endDate,

            grossSales: Number(grossSales.toFixed(2)),
            totalDiscounts: Number(totalDiscounts.toFixed(2)),
            totalRefunds: Number(totalRefunds.toFixed(2)),
            netSales: Number(
                Math.max(0, grossSales - totalDiscounts - totalRefunds).toFixed(2)
            ),

            totalOrders,
            currentPage: page,
            totalPages,

            chartData,
            bestSellingProducts,
            recentSales: paginatedSales
        };

    } catch (error) {
        console.log("SALES REPORT SERVICE ERROR:", error);

        return {
            success: false,
            period: filters.period || "weekly",
            grossSales: 0,
            totalDiscounts: 0,
            totalRefunds: 0,
            netSales: 0,
            totalOrders: 0,
            currentPage: 1,
            totalPages: 0,
            chartData: [],
            bestSellingProducts: [],
            recentSales: []
        };
    }
};
