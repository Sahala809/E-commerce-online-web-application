import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Variant from "../../models/variantModel.js";
import Order from "../../models/ordermodel.js";
import OrderItem from "../../models/orderItemModel.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

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


export const cancelOrderService = async (userId, orderId) => {
    const session = await mongoose.startSession();

    try {
        // 1. Find the order belonging to this user
        let order = await Order.findOne({
            _id: orderId,
            userId
        });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }

        if (order.status !== "PLACED") {
            return {
                success: false,
                message: "Only placed orders can be cancelled"
            };
        }

        // 2. Load and validate all order items before requesting a refund
        const items = await OrderItem.find({
            orderId: order._id
        });

        if (!items.length) {
            return {
                success: false,
                message: "No items found in this order"
            };
        }

        if (items.some(item => item.orderItemStatus !== "PLACED")) {
            return {
                success: false,
                message: "Some items have already been processed. This order cannot be cancelled completely."
            };
        }

        let refundStatus = null;

        // 3. Handle online payment
        if (order.paymentMethod === "ONLINE") {

            if (!order.isPaid || !order.razorpayPaymentId) {
                return {
                    success: false,
                    message: "A successful Razorpay payment could not be verified."
                };
            }

            // A previous refund request already exists.
            // Never create a second refund for the same order.
            if (
                order.razorpayRefundId &&
                ["REFUND_PENDING", "REFUNDED"].includes(
                    order.paymentStatus
                )
            ) {
                refundStatus = order.paymentStatus;

            } else if (
                order.paymentStatus === "SUCCESS" &&
                !order.razorpayRefundId
            ) {
                // Claim the refund operation to prevent concurrent requests.
                const claimedOrder = await Order.findOneAndUpdate(
                    {
                        _id: order._id,
                        userId,
                        status: "PLACED",
                        paymentMethod: "ONLINE",
                        isPaid: true,
                        paymentStatus: "SUCCESS",
                        razorpayRefundId: null
                    },
                    {
                        $set: {
                            paymentStatus: "REFUND_PENDING"
                        }
                    },
                    {
                        new: true
                    }
                );

                if (!claimedOrder) {
                    return {
                        success: false,
                        message: "A refund or cancellation is already being processed. Please check your order."
                    };
                }

                order = claimedOrder;

                let refund;

                try {
                    // Verify that Razorpay has a captured payment.
                    const payment = await razorpay.payments.fetch(
                        order.razorpayPaymentId
                    );

                    if (payment.status !== "captured") {
                        await Order.updateOne(
                            {
                                _id: order._id,
                                paymentStatus: "REFUND_PENDING",
                                razorpayRefundId: null
                            },
                            {
                                $set: {
                                    paymentStatus: "SUCCESS"
                                }
                            }
                        );

                        return {
                            success: false,
                            message: "The Razorpay payment is not captured. No refund was requested."
                        };
                    }

                    // Request a full refund.
                    refund = await razorpay.payments.refund(
                        order.razorpayPaymentId,
                        {
                            notes: {
                                orderId: order._id.toString(),
                                reason: "Customer cancelled order"
                            }
                        }
                    );

                } catch (error) {
                    console.error("Razorpay Refund Error:", error);

                    // Keep REFUND_PENDING to avoid accidentally
                    // sending another refund if the API result is uncertain.
                    return {
                        success: false,
                        message: "We could not confirm the refund status. Please contact support before trying again."
                    };
                }

                if (!refund || !refund.id) {
                    return {
                        success: false,
                        message: "Razorpay did not return a refund reference. Please contact support before retrying."
                    };
                }

                // A definitively failed refund must not cancel the order.
                if (["failed", "reversed"].includes(refund.status)) {
                    await Order.updateOne(
                        {
                            _id: order._id,
                            paymentStatus: "REFUND_PENDING",
                            razorpayRefundId: null
                        },
                        {
                            $set: {
                                paymentStatus: "SUCCESS"
                            }
                        }
                    );

                    return {
                        success: false,
                        message: "Razorpay did not complete the refund. Your order has not been cancelled."
                    };
                }

                // Store the refund reference before updating stock.
                const savedOrder = await Order.findOneAndUpdate(
                    {
                        _id: order._id,
                        paymentStatus: "REFUND_PENDING",
                        razorpayRefundId: null
                    },
                    {
                        $set: {
                            razorpayRefundId: refund.id,
                            paymentStatus:
                                refund.status === "processed"
                                    ? "REFUNDED"
                                    : "REFUND_PENDING"
                        }
                    },
                    {
                        new: true
                    }
                );

                if (!savedOrder) {
                    return {
                        success: false,
                        message: "The refund was requested, but its details could not be saved. Please contact support before retrying."
                    };
                }

                order = savedOrder;
                refundStatus = order.paymentStatus;

            } else {
                // For example, a previous request may be stuck
                // in REFUND_PENDING without a saved refund reference.
                return {
                    success: false,
                    message: "The refund status requires checking. Please contact support before retrying."
                };
            }

        } else if (order.paymentMethod === "COD") {

            // COD should not have an already captured payment.
            if (order.isPaid || order.paymentStatus === "SUCCESS") {
                return {
                    success: false,
                    message: "This order is marked as paid. Please contact support."
                };
            }

        } else {
            // Wallet refunds need their own wallet-credit workflow.
            return {
                success: false,
                message: "Cancellation for wallet payments is not supported by this workflow yet."
            };
        }

        // 4. Cancel all items and restore stock in one transaction
        await session.withTransaction(async () => {
            const currentOrder = await Order.findOne({
                _id: order._id,
                userId,
                status: "PLACED"
            }).session(session);

            if (!currentOrder) {
                throw new Error(
                    "Order status changed before cancellation completed"
                );
            }

            const currentItems = await OrderItem.find({
                orderId: currentOrder._id
            }).session(session);

            if (
                !currentItems.length ||
                currentItems.some(
                    item => item.orderItemStatus !== "PLACED"
                )
            ) {
                throw new Error(
                    "Order items are no longer eligible for cancellation"
                );
            }

            // Confirm the refund reference is saved before
            // cancelling an online-paid order.
            if (currentOrder.paymentMethod === "ONLINE") {
                if (
                    !currentOrder.razorpayRefundId ||
                    !["REFUND_PENDING", "REFUNDED"].includes(
                        currentOrder.paymentStatus
                    )
                ) {
                    throw new Error(
                        "Refund details are missing or invalid"
                    );
                }
            }

            for (const item of currentItems) {
                const variant = await Variant.findByIdAndUpdate(
                    item.variantId,
                    {
                        $inc: {
                            stock: item.quantity
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!variant) {
                    throw new Error(
                        "Variant not found while restoring stock"
                    );
                }

                item.orderItemStatus = "CANCELLED";
                item.cancelReason = "Cancelled by customer";

                await item.save({ session });
            }

            currentOrder.status = "CANCELLED";

            await currentOrder.save({ session });
        });

        // 5. Return a truthful message to the controller
        if (order.paymentMethod === "ONLINE") {
            return {
                success: true,
                message:
                    refundStatus === "REFUNDED"
                        ? "Order cancelled successfully. Razorpay has marked the refund as processed."
                        : "Order cancelled successfully. Your Razorpay refund is pending."
            };
        }

        return {
            success: true,
            message: "Order cancelled successfully"
        };

    } catch (error) {
        console.error("Cancel Order Service Error:", error);

        return {
            success: false,
            message:
                "The order could not be fully cancelled. Please check its status before trying again."
        };

    } finally {
        await session.endSession();
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


