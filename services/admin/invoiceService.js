import PDFDocument from "pdfkit";
import Order from "../../models/ordermodel.js";

export const getInvoiceOrderService = async (orderId, res) => {
    try {
        console.log("SERVICE RECEIVED ORDER ID:", orderId);

        const order = await Order.findById(orderId)
            .populate("userId")
            .populate({
                path: "orderItemId",
                populate: [
                    { path: "productId" },
                    { path: "variantId" }
                ]
            });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }

        // Invoice is available only for delivered orders
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

        // PDF response headers
        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="Chronix-Invoice-${order._id}.pdf"`
        );

        doc.pipe(res);

        // =====================================================
        // HEADER
        // =====================================================

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text("CHRONIX", {
                align: "center"
            });

        doc
            .moveDown(0.5)
            .fontSize(18)
            .font("Helvetica-Bold")
            .fillColor("#c49b28")
            .text("INVOICE", {
                align: "center"
            });

        doc.moveDown(1);

        // =====================================================
        // ORDER INFORMATION
        // =====================================================

        doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#222222")
            .text(`Order ID: ${order._id}`);

        doc.text(
            `Order Date: ${new Date(
                order.createdAt
            ).toLocaleDateString()}`
        );

        doc.text(
            `Payment Method: ${order.paymentMethod || "N/A"}`
        );

        doc.text(
            `Payment Status: ${order.paymentStatus || "N/A"}`
        );

        doc.text(
            `Order Status: ${order.status || "N/A"}`
        );

        doc.moveDown(1);

        // =====================================================
        // CUSTOMER DETAILS
        // =====================================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text("Customer Details");

        doc.moveDown(0.4);

        doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#444444")
            .text(
                `Name: ${
                    order.shippingAddress?.fullName || ""
                }`
            );

        doc.text(
            `Phone: ${
                order.shippingAddress?.phone || ""
            }`
        );

        doc.text(
            `Email: ${
                order.userId?.email || ""
            }`
        );

        doc.moveDown(1);

        // =====================================================
        // SHIPPING ADDRESS
        // =====================================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text("Shipping Address");

        doc.moveDown(0.4);

        const address = order.shippingAddress;

        doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#444444")
            .text(address?.houseName || "");

        doc.text(address?.street || "");

        doc.text(
            `${address?.city || ""}, ${
                address?.district || ""
            }`
        );

        doc.text(
            `${address?.state || ""}, ${
                address?.country || ""
            }`
        );

        doc.text(
            `Pincode: ${address?.pincode || ""}`
        );

        doc.moveDown(1);

        // =====================================================
        // ORDER ITEMS
        // =====================================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text("Order Items");

        doc.moveDown(0.5);

        // -----------------------------------------------------
        // TABLE SETTINGS
        // -----------------------------------------------------

        const tableStartX = 50;

        const tableWidth =
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right;

        const headerHeight = 28;
        const rowHeight = 32;

        /*
            A4 page width with 50px margins = approximately 495px

            #        Product       Variant    Qty    Price    Total
            35       165           75         45     85       90
            -------------------------------------------------------
            Total = 495
        */

        const columnWidths = [
            35,  // #
            165, // Product
            75,  // Variant
            45,  // Qty
            85,  // Price
            90   // Total
        ];

        const headers = [
            "#",
            "Product",
            "Variant",
            "Qty",
            "Price",
            "Total"
        ];

        // -----------------------------------------------------
        // DRAW TABLE HEADER
        // -----------------------------------------------------

        const drawTableHeader = (y) => {

            let x = tableStartX;

            // Header background
            doc
                .rect(
                    tableStartX,
                    y,
                    tableWidth,
                    headerHeight
                )
                .fill("#111111");

            headers.forEach((header, index) => {

                doc
                    .fontSize(9)
                    .font("Helvetica-Bold")
                    .fillColor("#ffffff")
                    .text(
                        header,
                        x + 5,
                        y + 9,
                        {
                            width:
                                columnWidths[index] - 10,
                            align:
                                index === 0
                                    ? "center"
                                    : index >= 3
                                    ? "right"
                                    : "left",
                            lineBreak: false
                        }
                    );

                x += columnWidths[index];
            });

            return y + headerHeight;
        };

        // -----------------------------------------------------
        // DRAW TABLE ROW
        // -----------------------------------------------------

        const drawTableRow = (
            y,
            item,
            index
        ) => {

            const productName =
                item.productId?.productName ||
                "Product";

            const variant =
                item.variantId?.color ||
                "N/A";

            const quantity =
                Number(item.quantity) || 0;

            const price =
                Number(item.price) || 0;

            const itemTotal =
                quantity * price;

            let x = tableStartX;

            // Row background
            doc
                .rect(
                    tableStartX,
                    y,
                    tableWidth,
                    rowHeight
                )
                .fill(
                    index % 2 === 0
                        ? "#ffffff"
                        : "#f7f7f7"
                );

            // Table borders
            doc
                .strokeColor("#dddddd")
                .lineWidth(0.5)
                .rect(
                    tableStartX,
                    y,
                    tableWidth,
                    rowHeight
                )
                .stroke();

            // Vertical column lines
            let lineX = tableStartX;

            columnWidths.forEach((width, columnIndex) => {

                if (columnIndex > 0) {

                    lineX += width;

                    doc
                        .moveTo(
                            lineX,
                            y
                        )
                        .lineTo(
                            lineX,
                            y + rowHeight
                        )
                        .stroke();
                }
            });

            const values = [
                index + 1,
                productName,
                variant,
                quantity,
                `₹${price.toFixed(2)}`,
                `₹${itemTotal.toFixed(2)}`
            ];

            values.forEach((value, valueIndex) => {

                doc
                    .fontSize(9)
                    .font("Helvetica")
                    .fillColor("#333333")
                    .text(
                        String(value),
                        x + 5,
                        y + 10,
                        {
                            width:
                                columnWidths[valueIndex] - 10,

                            align:
                                valueIndex === 0
                                    ? "center"
                                    : valueIndex >= 3
                                    ? "right"
                                    : "left",

                            lineBreak: false
                        }
                    );

                x += columnWidths[valueIndex];
            });

            return y + rowHeight;
        };

        // -----------------------------------------------------
        // START TABLE
        // -----------------------------------------------------

        let currentY = doc.y;

        currentY = drawTableHeader(currentY);

        // -----------------------------------------------------
        // TABLE ROWS
        // -----------------------------------------------------

        order.orderItemId.forEach(
            (item, index) => {

                /*
                    If there is not enough space on the page,
                    create a new page and draw the header again.
                */

                if (
                    currentY + rowHeight >
                    doc.page.height -
                        doc.page.margins.bottom -
                        80
                ) {

                    doc.addPage();

                    currentY =
                        doc.page.margins.top;

                    currentY =
                        drawTableHeader(
                            currentY
                        );
                }

                currentY =
                    drawTableRow(
                        currentY,
                        item,
                        index
                    );
            }
        );

        // Move PDF cursor below table
        doc.y = currentY + 20;

        // =====================================================
        // ORDER SUMMARY
        // =====================================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text("Order Summary");

        doc.moveDown(0.5);

        // Summary width
        const summaryWidth = 250;

        const summaryX =
            doc.page.width -
            doc.page.margins.right -
            summaryWidth;

        let summaryY = doc.y;

        // -----------------------------------------------------
        // Summary row helper
        // -----------------------------------------------------

        const drawSummaryRow = (
            label,
            value,
            bold = false
        ) => {

            doc
                .fontSize(bold ? 11 : 10)
                .font(
                    bold
                        ? "Helvetica-Bold"
                        : "Helvetica"
                )
                .fillColor(
                    bold
                        ? "#111111"
                        : "#555555"
                )
                .text(
                    label,
                    summaryX,
                    summaryY,
                    {
                        width: 130,
                        align: "left",
                        lineBreak: false
                    }
                );

            doc
                .fontSize(bold ? 11 : 10)
                .font(
                    bold
                        ? "Helvetica-Bold"
                        : "Helvetica"
                )
                .fillColor(
                    bold
                        ? "#c49b28"
                        : "#333333"
                )
                .text(
                    value,
                    summaryX + 130,
                    summaryY,
                    {
                        width: 120,
                        align: "right",
                        lineBreak: false
                    }
                );

            summaryY += 20;
        };

        drawSummaryRow(
            "Subtotal",
            `₹${Number(
                order.subTotal || 0
            ).toFixed(2)}`
        );

        drawSummaryRow(
            "Discount",
            `₹${Number(
                order.discountAmount || 0
            ).toFixed(2)}`
        );

        drawSummaryRow(
            "Delivery Charge",
            `₹${Number(
                order.deliveryCharge || 0
            ).toFixed(2)}`
        );

        // Separator before total
        doc
            .moveTo(
                summaryX,
                summaryY - 5
            )
            .lineTo(
                summaryX + summaryWidth,
                summaryY - 5
            )
            .strokeColor("#222222")
            .lineWidth(1.5)
            .stroke();

        summaryY += 8;

        drawSummaryRow(
            "Total Amount",
            `₹${Number(
                order.totalAmount || 0
            ).toFixed(2)}`,
            true
        );

        doc.y = summaryY + 25;

        // =====================================================
        // FOOTER
        // =====================================================

        doc
            .moveDown(1)
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#777777")
            .text(
                "Thank you for shopping with Chronix!",
                {
                    align: "center"
                }
            );

        doc
            .moveDown(0.3)
            .fontSize(9)
            .text(
                "This is a computer-generated invoice.",
                {
                    align: "center"
                }
            );

        // Finish PDF
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