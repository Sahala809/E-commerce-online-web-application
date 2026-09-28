import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Variant from "../../models/variantModel.js";
import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";

export const placeOrderService = async (
    userId,
    addressId,
    paymentMethod
) => {

    try {

        // ==========================================
        // GET CART
        // ==========================================

        const cart = await Cart.findOne({ userId })
            .populate("items.productId")
            .populate("items.variantId");

        if (!cart || cart.items.length === 0) {

            return {
                success: false,
                message: "Your cart is empty"
            };
        }


        // ==========================================
        // GET ADDRESS
        // ==========================================

        const userAddress =
            await Address.findOne({ userId });

        if (!userAddress) {

            return {
                success: false,
                message: "Address not found"
            };
        }


        const selectedAddress =
            userAddress.addresses.id(addressId);

        if (!selectedAddress) {

            return {
                success: false,
                message: "Selected address not found"
            };
        }


        // ==========================================
        // CHECK STOCK + CALCULATE SUBTOTAL
        // ==========================================

        let subTotal = 0;

        for (const item of cart.items) {

            const variant =
                await Variant.findById(item.variantId._id);

            if (!variant) {

                return {
                    success: false,
                    message: "Product variant not found"
                };
            }


            if (!variant.isActive) {

                return {
                    success: false,
                    message:
                        `${item.productId.productName} is unavailable`
                };
            }


            if (variant.stock < item.quantity) {

                return {
                    success: false,
                    message:
                        `Insufficient stock for ${item.productId.productName}`
                };
            }


            const price =
                variant.offerPrice > 0
                    ? variant.offerPrice
                    : variant.price;


            subTotal +=
                price * item.quantity;
        }


        // ==========================================
        // DELIVERY
        // ==========================================

        const deliveryCharge = 0;


        // ==========================================
        // DISCOUNT
        // ==========================================

        const discountAmount = 0;


        // ==========================================
        // TOTAL
        // ==========================================

        const totalAmount =
            subTotal +
            deliveryCharge -
            discountAmount;


        // ==========================================
        // CREATE ORDER
        // ==========================================

        const order = await Order.create({

            userId,

            totalAmount,

            status: "PLACED",

            shippingAddress: {

                fullName: selectedAddress.fullName,

                phone: selectedAddress.phone,

                houseName: selectedAddress.houseName,

                street: selectedAddress.street,

                district: selectedAddress.district,

                city: selectedAddress.city,

                state: selectedAddress.state,

                country: selectedAddress.country,

                pincode: selectedAddress.pincode
            },

            deliveryDate: null,

            isPaid: false,

            orderItemId: [],

            paymentMethod,

            subTotal,

            discountAmount,

            couponId: null,

            paymentStatus: "PENDING",

            deliveryCharge
        });


        // ==========================================
        // CREATE ORDER ITEMS
        // ==========================================

        const orderItemIds = [];


        for (const item of cart.items) {

            const variant =
                item.variantId;


            const price =
                variant.offerPrice > 0
                    ? variant.offerPrice
                    : variant.price;


            const orderItem =
                await OrderItem.create({

                    orderId: order._id,

                    productId:
                        item.productId._id,

                    variantId:
                        variant._id,

                    quantity:
                        item.quantity,

                    price,

                    orderItemStatus:
                        "PLACED",

                    returnReason: null,

                    refundAmount: 0,

                    cancelReason: null
                });


            orderItemIds.push(
                orderItem._id
            );


            // Reduce stock

            await Variant.findByIdAndUpdate(
                variant._id,
                {
                    $inc: {
                        stock: -item.quantity
                    }
                }
            );
        }


        // ==========================================
        // UPDATE ORDER
        // ==========================================

        order.orderItemId =
            orderItemIds;

        await order.save();


        // ==========================================
        // CLEAR CART
        // ==========================================

        await Cart.findOneAndUpdate(
            { userId },
            {
                $set: {
                    items: []
                }
            }
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        return {

            success: true,

            message:
                "Order placed successfully",

            orderId:
                order._id
        };


    } catch (error) {

        console.error(
            "Place Order Service Error:",
            error
        );

        return {

            success: false,

            message:
                "Failed to place order"
        };
    }
};




export const getUserOrdersService = async (userId) => {
    try {

        const orders = await Order.find({ userId })
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
            })
            .sort({ createdAt: -1 });

        return {
            success: true,
            orders
        };

    } catch (error) {

        console.error("Get User Orders Service Error:", error);

        return {
            success: false,
            message: "Failed to load orders",
            orders: []
        };
    }
};

export const getOrderDetailsService = async (userId, orderId) => {
    try {

        const order = await Order.findOne({
            _id: orderId,
            userId
        })
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

        console.error("Get Order Details Service Error:", error);

        return {
            success: false,
            message: "Failed to load order details"
        };
    }
};



export const cancelOrderItemService = async (
    userId,
    orderId,
    itemId
) => {
    try {

        // 1. Check whether the order belongs to the logged-in user
        const order = await Order.findOne({
            _id: orderId,
            userId
        });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }


        // 2. Find the order item
        const orderItem = await OrderItem.findOne({
            _id: itemId,
            orderId
        });

        if (!orderItem) {
            return {
                success: false,
                message: "Order item not found"
            };
        }


        // 3. Only PLACED items can be cancelled
        if (orderItem.orderItemStatus !== "PLACED") {
            return {
                success: false,
                message: "This item cannot be cancelled"
            };
        }


        // 4. Cancel the item
        orderItem.orderItemStatus = "CANCELLED";

        await orderItem.save();


        // 5. Restore the cancelled quantity to stock
        await Variant.findByIdAndUpdate(
            orderItem.variantId,
            {
                $inc: {
                    stock: orderItem.quantity
                }
            }
        );


        // 6. Check all items in this order
        const orderItems = await OrderItem.find({
            orderId
        });


        // 7. If every item is cancelled,
        //    mark the complete order as CANCELLED
        const allItemsCancelled = orderItems.every(
            item => item.orderItemStatus === "CANCELLED"
        );

        if (allItemsCancelled) {
            order.status = "CANCELLED";
            await order.save();
        }


        return {
            success: true,
            message: "Item cancelled successfully"
        };

    } catch (error) {

        console.error(
            "Cancel Order Item Service Error:",
            error
        );

        return {
            success: false,
            message: "Failed to cancel item"
        };
    }
};


export const requestReturnService = async (
    orderId,
    orderItemId,
    userId,
    returnReason,
    returnDetails
) => {
    try {
        if (!returnReason || !returnReason.trim()) {
            return {
                success: false,
                message: "Return reason is required"
            };
        }

        const order = await Order.findOne({
            _id: orderId,
            userId: userId
        });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }

        const orderItem = await OrderItem.findOne({
            _id: orderItemId,
            orderId: orderId
        });

        if (!orderItem) {
            return {
                success: false,
                message: "Order item not found"
            };
        }

        if (orderItem.orderItemStatus !== "DELIVERED") {
            return {
                success: false,
                message: "Only delivered items can be returned"
            };
        }

        orderItem.orderItemStatus = "REQUESTED";

         orderItem.orderItemStatus = "DELIVERED";


        orderItem.returnReason = returnReason.trim();

        await orderItem.save();

        return {
            success: true,
            message: "Return request submitted successfully"
        };

    } catch (error) {
        console.log(
            "REQUEST RETURN SERVICE ERROR:",
            error
        );

        return {
            success: false,
            message: "Failed to submit return request"
        };
    }
};


