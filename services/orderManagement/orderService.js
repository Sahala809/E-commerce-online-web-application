import crypto from "crypto";
import mongoose from "mongoose";
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Variant from "../../models/variantModel.js";
import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";


export const placeOrderService = async (
    userId,
    addressId,
    paymentMethod,
    paymentDetails = {}
) => {
    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            // GET CART
            const cart = await Cart.findOne({ userId })
                .populate("items.productId")
                .populate("items.variantId")
                .session(session);

            if (!cart || cart.items.length === 0) {
                throw new Error("Your cart is empty");
            }

            // GET ADDRESS
            const userAddress = await Address.findOne({ userId })
                .session(session);

            if (!userAddress) {
                throw new Error("Address not found");
            }

            const selectedAddress =
                userAddress.addresses.id(addressId);

            if (!selectedAddress) {
                throw new Error("Selected address not found");
            }

            // VALIDATE CART AND CALCULATE SUBTOTAL
            let subTotal = 0;
            const orderItemsData = [];

            for (const item of cart.items) {
                const variantId = item.variantId?._id;
                const product = item.productId;

                if (!variantId || !product) {
                    throw new Error("Product or variant not found");
                }

                const variant = await Variant.findById(variantId)
                    .session(session);

                if (!variant) {
                    throw new Error("Product variant not found");
                }

                if (!variant.isActive) {
                    throw new Error(
                        `${product.productName} is unavailable`
                    );
                }

                if (variant.stock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for ${product.productName}`
                    );
                }

                const price =
                    variant.offerPrice > 0
                        ? variant.offerPrice
                        : variant.price;

                subTotal += price * item.quantity;

                orderItemsData.push({
                    productId: product._id,
                    variantId: variant._id,
                    quantity: item.quantity,
                    price
                });
            }

            const deliveryCharge = 0;

            const discountAmount = Math.min(
                subTotal,
                Math.max(
                    0,
                    Number(paymentDetails.discountAmount) || 0
                )
            );

            const totalAmount =
                subTotal + deliveryCharge - discountAmount;

            // PREVENT REUSING A PAYMENT
            if (paymentDetails.razorpayPaymentId) {
                const existingOrder = await Order.findOne({
                    razorpayPaymentId:
                        paymentDetails.razorpayPaymentId
                }).session(session);

                if (existingOrder) {
                    throw new Error(
                        "This payment has already been used for an order."
                    );
                }
            }

            // CREATE ORDER
            const [order] = await Order.create([{
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
                isPaid: paymentDetails.isPaid === true,
                orderItemId: [],
                paymentMethod,

                razorpayPaymentId:
                    paymentDetails.razorpayPaymentId || null,

                subTotal,
                discountAmount,
                couponId: null,

                paymentStatus:
                    paymentDetails.isPaid === true
                        ? "SUCCESS"
                        : "PENDING",

                deliveryCharge
            }], { session });

            // CREATE ORDER ITEMS
            const orderItems = orderItemsData.map(item => ({
                orderId: order._id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
                orderItemStatus: "PLACED",
                returnReason: null,
                refundAmount: 0,
                cancelReason: null
            }));

            const createdItems = await OrderItem.insertMany(
                orderItems,
                { session }
            );

            order.orderItemId = createdItems.map(item => item._id);

            await order.save({ session });

            // REDUCE STOCK ONLY IF ENOUGH STOCK REMAINS
            for (const item of orderItemsData) {
                const stockUpdate = await Variant.updateOne(
                    {
                        _id: item.variantId,
                        isActive: true,
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    { session }
                );

                if (stockUpdate.modifiedCount !== 1) {
                    throw new Error(
                        "Stock changed during checkout. Please try again."
                    );
                }
            }

            // CLEAR CART WITHIN THE TRANSACTION
            const cartUpdate = await Cart.updateOne(
                { _id: cart._id },
                { $set: { items: [] } },
                { session }
            );

            if (cartUpdate.modifiedCount !== 1) {
                throw new Error(
                    "Unable to clear cart. Please try again."
                );
            }

            result = {
                success: true,
                message: "Order placed successfully",
                orderId: order._id
            };
        });

        return result;

    } catch (error) {
        console.error("Place Order Service Error:", error);

        if (
            error.code === 11000 &&
            error.keyPattern?.razorpayPaymentId
        ) {
            return {
                success: false,
                message: "This payment has already been used for an order."
            };
        }

        return {
            success: false,
            message: error.message || "Failed to place order"
        };

    } finally {
        await session.endSession();
    }
};

export const verifyRazorpaySignature = (
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
) => {
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(
        razorpaySignature || "",
        "hex"
    );

    if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
        return false;
    }

    return true;
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

        orderItem.returnStatus = "REQUESTED";
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


