import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";
import User from "../../models/userModel.js";

export const loadOrdersService = async (
    search = "",
    status = "",
    sort = "newest",
    page = 1
) => {

    try {

        let orders;


        // =====================================
        // SEARCH
        // =====================================

        if (search) {

            // Search users by name or email
            const users = await User.find({
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        email: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                ]
            }).select("_id");


            const userIds = users.map(user => user._id);


            // Get all orders
            const allOrders = await Order.find()
                .populate("userId", "name email");


            // Filter orders by customer or Order ID
            orders = allOrders.filter(order => {

                // Customer name/email match
                const customerMatch = userIds.some(
                    id =>
                        id.toString() ===
                        order.userId?._id?.toString()
                );


                // Order ID match
                const orderId = order._id
                    .toString()
                    .slice(-8)
                    .toLowerCase();


                const searchText = search.toLowerCase();


                const orderIdMatch =
                    orderId.includes(searchText);


                return customerMatch || orderIdMatch;
            });


        } else {

            // =====================================
            // NO SEARCH
            // =====================================

            orders = await Order.find()
                .populate("userId", "name email");
        }


        // =====================================
        // STATUS FILTER
        // =====================================

        if (status) {

            orders = orders.filter(
                order => order.status === status
            );
        }


        // =====================================
        // SORT
        // =====================================

        if (sort === "newest") {

            orders.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

        } else if (sort === "oldest") {

            orders.sort(
                (a, b) =>
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
            );

        } else if (sort === "highest") {

            orders.sort(
                (a, b) =>
                    Number(b.totalAmount) -
                    Number(a.totalAmount)
            );

        } else if (sort === "lowest") {

            orders.sort(
                (a, b) =>
                    Number(a.totalAmount) -
                    Number(b.totalAmount)
            );
        }

        const limit = 10;
        const totalOrders = orders.length;

        const totalPages =Math.ceil(
            totalOrders / limit
        );

        const startIndex = (page - 1) * limit;

        orders =orders.slice(
            startIndex, startIndex + limit
        )

        // =====================================
        // PENDING ORDERS
        // =====================================

        const pendingOrders = await Order.countDocuments({
            status: "PLACED"
        });


        // =====================================
        // SHIPPED TODAY
        // =====================================

        const startOfDay = new Date();

        startOfDay.setHours(0, 0, 0, 0);


        const endOfDay = new Date();

        endOfDay.setHours(23, 59, 59, 999);


        const shippedToday = await Order.countDocuments({
            status: "SHIPPED",
            updatedAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });


        // =====================================
        // PROCESSING ORDERS
        // =====================================

        const processingOrders = await Order.countDocuments({
            status: "OUT_FOR_DELIVERY"
        });


        // =====================================
        // RETURNED ITEMS
        // =====================================

        const returnedOrders = await OrderItem.countDocuments({
            orderItemStatus: "RETURNED"
        });


        // =====================================
        // CANCELLED ITEMS
        // =====================================

        const cancelledOrders = await OrderItem.countDocuments({
            orderItemStatus: "CANCELLED"
        });


        // =====================================
        // RETURN RESULT
        // =====================================

        return {

            success: true,

            orders,

            pendingOrders,

            shippedToday,

            processingOrders,

            returnedOrders,

            cancelledOrders,

            page,

            totalPages

        };


    } catch (error) {

        console.log(
            "LOAD ORDERS SERVICE ERROR:",
            error
        );


        return {

            success: false,

            orders: [],

            pendingOrders: 0,

            shippedToday: 0,

            processingOrders: 0,

            returnedOrders: 0,

            cancelledOrders: 0

        };
    }
};

export const loadOrderDetailsService = async (orderId) => {
    try {

        const order = await Order.findById(orderId)
            .populate("userId", "name email phone")
            .populate({
                path: "orderItemId",
                populate: [
                    {
                        path: "productId",
                        select: "productName"
                    },
                    {
                        path: "variantId",
                        select: "color images"
                    }
                ]
            });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }

        return {
            success: true,
            order
        };

    } catch (error) {

        console.log("LOAD ORDER DETAILS SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to load order details"
        };
    }
};



export const updateOrderItemStatusService = async (orderItemId, status) => {
    try {

        const allowedStatuses = [
            "PLACED",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
            "RETURNED"
        ];

        if (!allowedStatuses.includes(status)) {
            return {
                success: false,
                message: "Invalid order status"
            };
        }

        const orderItem = await OrderItem.findById(orderItemId);

        if (!orderItem) {
            return {
                success: false,
                message: "Order item not found"
            };
        }

        orderItem.orderItemStatus = status;

        await orderItem.save();

        
        // 3. Get all items belonging to this order
        const allOrderItems = await OrderItem.find({
            orderId: orderItem.orderId
        });


        // 4. Get all item statuses
        const statuses = allOrderItems.map(
            item => item.orderItemStatus
        );


        // 5. Decide overall order status
        let orderStatus = "PLACED";


        if (statuses.every(status => status === "CANCELLED")) {

            orderStatus = "CANCELLED";

        } else if (statuses.every(status => status === "RETURNED")) {

            orderStatus = "RETURNED";

        } else if (statuses.every(status => status === "DELIVERED")) {

            orderStatus = "DELIVERED";

        } else if (statuses.some(status => status === "OUT_FOR_DELIVERY")) {

            orderStatus = "OUT_FOR_DELIVERY";

        } else if (statuses.some(status => status === "SHIPPED")) {

            orderStatus = "SHIPPED";

        } else {

            orderStatus = "PLACED";

        }


        // 6. Update main Order status
        await Order.findByIdAndUpdate(
            orderItem.orderId,
            {
                status: orderStatus
            }
        );


        return {
            success: true,
            message: `Order item status updated to ${status}`
        };


    } catch (error) {

        console.log(
            "UPDATE ORDER ITEM STATUS SERVICE ERROR:",
            error
        );

        return {
            success: false,
            message: "Failed to update order item status"
        };
    }
};