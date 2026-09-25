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