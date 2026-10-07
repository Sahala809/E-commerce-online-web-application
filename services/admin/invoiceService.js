import PDFDocument from "pdfkit";
import Order from "../../models/ordermodel.js"


export const getInvoiceOrderService = async (orderId, res) => {
    try {
console.log("SERVICE RECEIVED ORDER ID:", orderId);

        const order = await Order.findById(orderId)
            .populate("userId")
            .populate({
                path: "orderItemId",
                populate: [
                    {
                        path: "productId"
                    },
                    {
                        path: "variantId"
                    }
                ]
            });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }

        if (order.status !== "DELIVERED") {
            return {
                success: false,
                message: "Invoice is available only for delivered orders"
            };
        }

        const doc = new PDFDocument({
            margin: 50,
            size: "A4"
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="Chronix-Invoice-${order._id}.pdf"`
        );

        doc.pipe(res);

        // =========================
        // HEADER
        // =========================

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("CHRONIX", {
                align: "center"
            });

        doc
            .moveDown(0.5)
            .fontSize(18)
            .text("INVOICE", {
                align: "center"
            });

        doc.moveDown(1);

        // =========================
        // ORDER DETAILS
        // =========================

        doc
            .fontSize(11)
            .font("Helvetica")
            .text(`Order ID: ${order._id}`);

        doc.text(
            `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`
        );

        doc.text(`Payment Method: ${order.paymentMethod}`);

        doc.text(`Payment Status: ${order.paymentStatus}`);

        doc.text(`Order Status: ${order.status}`);

        doc.moveDown(1);

        // =========================
        // CUSTOMER DETAILS
        // =========================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Customer Details");

        doc.moveDown(0.4);

        doc
            .fontSize(11)
            .font("Helvetica")
            .text(`Name: ${order.shippingAddress?.fullName || ""}`);

        doc.text(
            `Phone: ${order.shippingAddress?.phone || ""}`
        );

        doc.text(
            `Email: ${order.userId?.email || ""}`
        );

        doc.moveDown(1);

        // =========================
        // SHIPPING ADDRESS
        // =========================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Shipping Address");

        doc.moveDown(0.4);

        const address = order.shippingAddress;

        doc
            .fontSize(11)
            .font("Helvetica")
            .text(address?.houseName || "");

        doc.text(address?.street || "");

        doc.text(
            `${address?.city || ""}, ${address?.district || ""}`
        );

        doc.text(
            `${address?.state || ""}, ${address?.country || ""}`
        );

        doc.text(
            `Pincode: ${address?.pincode || ""}`
        );

        doc.moveDown(1);

        // =========================
        // ORDER ITEMS
        // =========================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Order Items");

        doc.moveDown(0.5);

        order.orderItemId.forEach((item, index) => {

            const productName =
                item.productId?.productName || "Product";

            const color =
                item.variantId?.color || "";

            const quantity =
                Number(item.quantity) || 0;

            const price =
                Number(item.price) || 0;

            const itemTotal =
                quantity * price;

            doc
                .fontSize(11)
                .font("Helvetica-Bold")
                .text(`${index + 1}. ${productName}`);

            doc
                .font("Helvetica")
                .text(`Color: ${color}`);

            doc.text(`Quantity: ${quantity}`);

            doc.text(
                `Price: ₹${price.toFixed(2)}`
            );

            doc.text(
                `Item Total: ₹${itemTotal.toFixed(2)}`
            );

            doc.moveDown(0.6);
        });

        // =========================
        // SUMMARY
        // =========================

        doc.moveDown(0.5);

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Order Summary");

        doc.moveDown(0.5);

        doc
            .fontSize(11)
            .font("Helvetica")
            .text(
                `Subtotal: ₹${Number(order.subTotal || 0).toFixed(2)}`
            );

        doc.text(
            `Discount: ₹${Number(order.discountAmount || 0).toFixed(2)}`
        );

        doc.text(
            `Delivery Charge: ₹${Number(order.deliveryCharge || 0).toFixed(2)}`
        );

        doc
            .font("Helvetica-Bold")
            .text(
                `Total Amount: ₹${Number(order.totalAmount || 0).toFixed(2)}`
            );

        doc.moveDown(2);

        // =========================
        // FOOTER
        // =========================

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                "Thank you for shopping with Chronix!",
                {
                    align: "center"
                }
            );

        doc
            .moveDown(0.3)
            .text(
                "This is a computer-generated invoice.",
                {
                    align: "center"
                }
            );

        doc.end();

        return {
            success: true
        };

    } catch (error) {

        console.log(
            "GET INVOICE ORDER SERVICE ERROR:",
            error
        );

        return {
            success: false,
            message: "Failed to generate invoice"
        };
    }
};