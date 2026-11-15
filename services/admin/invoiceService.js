import PDFDocument from "pdfkit";
import Order from "../../models/ordermodel.js";

export const getInvoiceOrderService = async (orderId, res) => {
    try {
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

        // Invoice is available for delivered or returned orders
        if (!["DELIVERED", "RETURNED"].includes(order.status)) {
            return {
                success: false,
                message: "Invoice is available only for delivered orders"
            };
        }

        const doc = new PDFDocument({
            size: "A4",
            margins: {
                top: 45,
                bottom: 50,
                left: 50,
                right: 50
            },
            bufferPages: true
        });

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            `inline; filename="Chronix-Invoice-${order._id}.pdf"`
        );

        doc.pipe(res);

        // =====================================================
        // CONSTANTS AND HELPERS
        // =====================================================

        const PAGE_WIDTH = doc.page.width;
        const PAGE_HEIGHT = doc.page.height;

        const LEFT = doc.page.margins.left;
        const RIGHT = PAGE_WIDTH - doc.page.margins.right;
        const CONTENT_WIDTH = RIGHT - LEFT;
        const BOTTOM = PAGE_HEIGHT - doc.page.margins.bottom;

        const COLORS = {
            black: "#171717",
            gold: "#C49B28",
            text: "#444444",
            muted: "#777777",
            border: "#DDDDDD",
            light: "#F7F7F7",
            white: "#FFFFFF",
            green: "#237A45",
            red: "#B33A3A"
        };

        const formatAmount = (amount) =>
            `Rs. ${Number(amount || 0).toFixed(2)}`;

        const formatDate = (date) =>
            date
                ? new Date(date).toLocaleDateString("en-IN")
                : "N/A";

        const safeText = (value) =>
            value === null || value === undefined || value === ""
                ? "N/A"
                : String(value);

        const ensureSpace = (requiredHeight) => {
            if (doc.y + requiredHeight > BOTTOM) {
                doc.addPage();
            }
        };

        const drawLine = (y, color = COLORS.border) => {
            doc
                .moveTo(LEFT, y)
                .lineTo(RIGHT, y)
                .strokeColor(color)
                .lineWidth(0.7)
                .stroke();
        };

        const drawSectionTitle = (title) => {
            ensureSpace(42);

            const y = doc.y;

            doc
                .font("Helvetica-Bold")
                .fontSize(13)
                .fillColor(COLORS.black)
                .text(title, LEFT, y);

            doc
                .moveTo(LEFT, y + 21)
                .lineTo(RIGHT, y + 21)
                .strokeColor(COLORS.gold)
                .lineWidth(1.5)
                .stroke();

            doc.y = y + 32;
        };

        const drawLabelValue = (
            label,
            value,
            x,
            y,
            width,
            options = {}
        ) => {
            const labelWidth = options.labelWidth || 90;
            const valueWidth = width - labelWidth;

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor(COLORS.muted)
                .text(label, x, y, {
                    width: labelWidth - 5
                });

            doc
                .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(9)
                .fillColor(options.color || COLORS.text)
                .text(safeText(value), x + labelWidth, y, {
                    width: valueWidth,
                    align: "left"
                });
        };

        const drawCard = (x, y, width, height, title) => {
            doc
                .roundedRect(x, y, width, height, 5)
                .fillAndStroke(COLORS.light, COLORS.border);

            doc
                .font("Helvetica-Bold")
                .fontSize(10)
                .fillColor(COLORS.black)
                .text(title, x + 12, y + 12, {
                    width: width - 24
                });
        };

        // =====================================================
        // ORDER DATA
        // =====================================================

        const orderItems = order.orderItemId.filter(Boolean);

        const returnedItems = orderItems.filter((item) => {
            const returnStatus = item.returnStatus || "NONE";

            return (
                returnStatus !== "NONE" ||
                item.orderItemStatus === "RETURNED" ||
                Number(item.refundAmount) > 0
            );
        });

        const totalRefund = returnedItems.reduce(
            (total, item) =>
                total + Math.max(0, Number(item.refundAmount) || 0),
            0
        );

        const originalGrandTotal = Number(order.totalAmount) || 0;

        const netAmountRetained = Math.max(
            0,
            originalGrandTotal - totalRefund
        );

        // =====================================================
        // HEADER
        // =====================================================

        doc
            .font("Helvetica-Bold")
            .fontSize(27)
            .fillColor(COLORS.black)
            .text("CHRONIX", LEFT, 42, {
                align: "center",
                width: CONTENT_WIDTH
            });

        doc
            .font("Helvetica-Bold")
            .fontSize(16)
            .fillColor(COLORS.gold)
            .text("INVOICE", {
                align: "center"
            });

        doc.moveDown(0.4);

        doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.muted)
            .text("ORDER INVOICE", {
                align: "center"
            });

        doc.moveDown(1.5);

        drawLine(doc.y, COLORS.gold);

        doc.moveDown(1);

        // =====================================================
        // INVOICE INFORMATION
        // =====================================================

        drawSectionTitle("Invoice Information");

        const invoiceInfoY = doc.y;

        const halfWidth = CONTENT_WIDTH / 2;

        drawLabelValue(
            "Invoice Number",
            `CH-${String(order._id).slice(-8).toUpperCase()}`,
            LEFT,
            invoiceInfoY,
            halfWidth,
            { labelWidth: 105 }
        );

        drawLabelValue(
            "Invoice Date",
            formatDate(new Date()),
            LEFT + halfWidth,
            invoiceInfoY,
            halfWidth,
            { labelWidth: 85 }
        );

        drawLabelValue(
            "Order ID",
            order._id,
            LEFT,
            invoiceInfoY + 23,
            halfWidth,
            { labelWidth: 105 }
        );

        drawLabelValue(
            "Order Date",
            formatDate(order.createdAt),
            LEFT + halfWidth,
            invoiceInfoY + 23,
            halfWidth,
            { labelWidth: 85 }
        );

        doc.y = invoiceInfoY + 48;

        // =====================================================
        // CUSTOMER AND SHIPPING DETAILS
        // =====================================================

        drawSectionTitle("Customer & Shipping Details");

        const address = order.shippingAddress || {};

        const cardGap = 12;
        const cardWidth = (CONTENT_WIDTH - cardGap) / 2;
        const cardY = doc.y;
        const cardHeight = 145;

        ensureSpace(cardHeight + 10);

        const actualCardY = doc.y;

        // Customer card
        drawCard(
            LEFT,
            actualCardY,
            cardWidth,
            cardHeight,
            "CUSTOMER DETAILS"
        );

        drawLabelValue(
            "Name",
            address.fullName,
            LEFT + 12,
            actualCardY + 38,
            cardWidth - 24,
            { labelWidth: 48 }
        );

        drawLabelValue(
            "Phone",
            address.phone,
            LEFT + 12,
            actualCardY + 62,
            cardWidth - 24,
            { labelWidth: 48 }
        );

        drawLabelValue(
            "Email",
            order.userId?.email,
            LEFT + 12,
            actualCardY + 86,
            cardWidth - 24,
            { labelWidth: 48 }
        );

        // Shipping card
        const shippingX = LEFT + cardWidth + cardGap;

        drawCard(
            shippingX,
            actualCardY,
            cardWidth,
            cardHeight,
            "SHIPPING ADDRESS"
        );

        const addressLines = [
            address.houseName,
            address.street,
            `${address.city || ""}, ${address.district || ""}`,
            `${address.state || ""}, ${address.country || ""}`,
            `Pincode: ${address.pincode || "N/A"}`
        ].filter(Boolean);

        doc
            .font("Helvetica")
            .fontSize(8.5)
            .fillColor(COLORS.text)
            .text(
                addressLines.join("\n"),
                shippingX + 12,
                actualCardY + 38,
                {
                    width: cardWidth - 24,
                    lineGap: 4
                }
            );

        doc.y = actualCardY + cardHeight + 18;

        // =====================================================
        // PAYMENT DETAILS
        // =====================================================

        drawSectionTitle("Payment Information");

        const paymentY = doc.y;
        const paymentCardHeight = 76;

        ensureSpace(paymentCardHeight + 10);

        const actualPaymentY = doc.y;

        doc
            .roundedRect(
                LEFT,
                actualPaymentY,
                CONTENT_WIDTH,
                paymentCardHeight,
                5
            )
            .fillAndStroke(COLORS.light, COLORS.border);

        drawLabelValue(
            "Payment Method",
            order.paymentMethod,
            LEFT + 12,
            actualPaymentY + 17,
            halfWidth - 12,
            { labelWidth: 105, bold: true }
        );

        drawLabelValue(
            "Payment Status",
            order.paymentStatus,
            LEFT + halfWidth,
            actualPaymentY + 17,
            halfWidth - 12,
            { labelWidth: 95, bold: true }
        );

        drawLabelValue(
            "Order Status",
            order.status,
            LEFT + 12,
            actualPaymentY + 45,
            halfWidth - 12,
            { labelWidth: 105 }
        );

        drawLabelValue(
            "Order Amount",
            formatAmount(originalGrandTotal),
            LEFT + halfWidth,
            actualPaymentY + 45,
            halfWidth - 12,
            { labelWidth: 95, bold: true }
        );

        doc.y = actualPaymentY + paymentCardHeight + 20;

        // =====================================================
        // ORDER ITEMS TABLE
        // =====================================================

        drawSectionTitle("Order Items");

        const columnWidths = [
            24,  // #
            105, // Product
            52,  // Variant
            32,  // Qty
            58,  // Price
            68,  // Discount
            78,  // Total
            78   // Status
        ];

        const headers = [
            "#",
            "Product",
            "Variant",
            "Qty",
            "Price",
            "Discount",
            "Total",
            "Status"
        ];

        const tableWidth = columnWidths.reduce(
            (total, width) => total + width,
            0
        );

        const headerHeight = 30;

        const drawTableHeader = (y) => {
            doc
                .rect(LEFT, y, tableWidth, headerHeight)
                .fill(COLORS.black);

            let x = LEFT;

            headers.forEach((header, index) => {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(7.5)
                    .fillColor(COLORS.white)
                    .text(
                        header,
                        x + 3,
                        y + 9,
                        {
                            width: columnWidths[index] - 6,
                            align:
                                index === 0 || index === 3
                                    ? "center"
                                    : index >= 4 && index <= 6
                                        ? "right"
                                        : "left",
                            lineBreak: false
                        }
                    );

                x += columnWidths[index];
            });

            return y + headerHeight;
        };

        const drawTableRow = (y, item, index) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            const savedFinalPrice = Number(item.finalPrice);

            const finalPrice =
                savedFinalPrice > 0
                    ? savedFinalPrice
                    : price;

            const itemDiscount = Math.max(
                0,
                (price - finalPrice) * quantity
            );

            const itemTotal = finalPrice * quantity;

            const values = [
                String(index + 1),
                safeText(item.productId?.productName || "Product"),
                safeText(item.variantId?.color),
                String(quantity),
                formatAmount(price),
                formatAmount(itemDiscount),
                formatAmount(itemTotal),
                safeText(item.orderItemStatus)
            ];

            // Calculate row height based on wrapped text
            let rowHeight = 30;

            values.forEach((value, valueIndex) => {
                doc
                    .font("Helvetica")
                    .fontSize(7.2);

                const textHeight = doc.heightOfString(
                    value,
                    {
                        width: columnWidths[valueIndex] - 7,
                        lineGap: 1
                    }
                );

                rowHeight = Math.max(
                    rowHeight,
                    textHeight + 14
                );
            });

            // Avoid splitting a table row across pages
            if (y + rowHeight > BOTTOM - 10) {
                doc.addPage();
                y = doc.page.margins.top;
                y = drawTableHeader(y);
            }

            doc
                .rect(LEFT, y, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? COLORS.white : COLORS.light);

            doc
                .strokeColor(COLORS.border)
                .lineWidth(0.5)
                .rect(LEFT, y, tableWidth, rowHeight)
                .stroke();

            let x = LEFT;

            values.forEach((value, valueIndex) => {
                doc
                    .font("Helvetica")
                    .fontSize(7.2)
                    .fillColor(COLORS.text)
                    .text(
                        value,
                        x + 3,
                        y + 7,
                        {
                            width: columnWidths[valueIndex] - 7,
                            align:
                                valueIndex === 0 || valueIndex === 3
                                    ? "center"
                                    : valueIndex >= 4 && valueIndex <= 6
                                        ? "right"
                                        : "left",
                            lineGap: 1
                        }
                    );

                x += columnWidths[valueIndex];
            });

            // Draw vertical column borders
            let borderX = LEFT;

            columnWidths.forEach((width, columnIndex) => {
                if (columnIndex > 0) {
                    borderX += width;

                    doc
                        .moveTo(borderX, y)
                        .lineTo(borderX, y + rowHeight)
                        .strokeColor(COLORS.border)
                        .lineWidth(0.5)
                        .stroke();
                }
            });

            return y + rowHeight;
        };

        let tableY = doc.y;

        tableY = drawTableHeader(tableY);

        orderItems.forEach((item, index) => {
            tableY = drawTableRow(tableY, item, index);
        });

        doc.y = tableY + 22;

        // =====================================================
        // ORIGINAL ORDER SUMMARY
        // =====================================================

        drawSectionTitle("Original Order Summary");

        const summaryWidth = 270;
        const summaryX = RIGHT - summaryWidth;

        const drawSummaryRow = (
            label,
            value,
            y,
            options = {}
        ) => {
            doc
                .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(options.bold ? 10 : 9)
                .fillColor(options.labelColor || COLORS.text)
                .text(label, summaryX, y, {
                    width: 150
                });

            doc
                .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(options.bold ? 10 : 9)
                .fillColor(options.valueColor || COLORS.text)
                .text(value, summaryX + 150, y, {
                    width: summaryWidth - 150,
                    align: "right"
                });
        };

        ensureSpace(145);

        let summaryY = doc.y;

        doc
            .roundedRect(
                summaryX,
                summaryY,
                summaryWidth,
                125,
                5
            )
            .fillAndStroke(COLORS.light, COLORS.border);

        summaryY += 14;

        drawSummaryRow(
            "Subtotal",
            formatAmount(order.subTotal),
            summaryY
        );

        summaryY += 21;

        drawSummaryRow(
            "Total Discount",
            `- ${formatAmount(order.discountAmount)}`,
            summaryY
        );

        summaryY += 21;

        drawSummaryRow(
            "Delivery Charge",
            formatAmount(order.deliveryCharge),
            summaryY
        );

        summaryY += 12;

        doc
            .moveTo(summaryX + 10, summaryY)
            .lineTo(summaryX + summaryWidth - 10, summaryY)
            .strokeColor(COLORS.border)
            .stroke();

        summaryY += 12;

        drawSummaryRow(
            "Original Grand Total",
            formatAmount(originalGrandTotal),
            summaryY,
            {
                bold: true,
                valueColor: COLORS.gold
            }
        );

        doc.y = doc.y + 145;

        // =====================================================
        // RETURN AND REFUND DETAILS
        // =====================================================

        if (returnedItems.length > 0) {
            drawSectionTitle("Return & Refund Details");

            returnedItems.forEach((item, index) => {
                ensureSpace(115);

                const returnStatus = item.returnStatus || "NONE";

                const refundAmount = Math.max(
                    0,
                    Number(item.refundAmount) || 0
                );

                const productName =
                    item.productId?.productName || "Product";

                const variant =
                    item.variantId?.color || "N/A";

                const itemBlockY = doc.y;

                const reasonText = item.returnReason
                    ? `Return Reason: ${item.returnReason}`
                    : "Return Reason: N/A";

                const reasonHeight = doc.heightOfString(
                    reasonText,
                    { width: CONTENT_WIDTH - 24, fontSize: 8.5 }
                );

                const blockHeight = Math.max(
                    105,
                    90 + reasonHeight
                );

                if (doc.y + blockHeight > BOTTOM) {
                    doc.addPage();
                }

                const actualBlockY = doc.y;

                doc
                    .roundedRect(
                        LEFT,
                        actualBlockY,
                        CONTENT_WIDTH,
                        blockHeight,
                        5
                    )
                    .fillAndStroke(COLORS.light, COLORS.border);

                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .fillColor(COLORS.black)
                    .text(
                        `${index + 1}. ${productName}`,
                        LEFT + 12,
                        actualBlockY + 10,
                        {
                            width: CONTENT_WIDTH - 24
                        }
                    );

                doc
                    .font("Helvetica")
                    .fontSize(8.5)
                    .fillColor(COLORS.text)
                    .text(
                        `Variant: ${variant}`,
                        LEFT + 12,
                        actualBlockY + 29
                    );

                doc.text(
                    `Item Status: ${safeText(item.orderItemStatus)}`,
                    LEFT + 12,
                    actualBlockY + 44
                );

                doc.text(
                    `Return Status: ${returnStatus === "NONE"
                        ? item.orderItemStatus === "RETURNED"
                            ? "RETURNED"
                            : "N/A"
                        : returnStatus
                    }`,
                    LEFT + 12,
                    actualBlockY + 59
                );

                doc.text(
                    reasonText,
                    LEFT + 12,
                    actualBlockY + 74,
                    {
                        width: CONTENT_WIDTH - 24,
                        fontSize: 8.5
                    }
                );

                const refundStatus =
                    returnStatus === "REQUESTED"
                        ? "Awaiting return approval"
                        : returnStatus === "REJECTED"
                            ? "No refund - Return rejected"
                            : refundAmount > 0
                                ? "REFUNDED"
                                : returnStatus === "APPROVED"
                                    ? "Approved - Refund not recorded"
                                    : "No refund recorded";

                const refundY =
                    actualBlockY + 74 + reasonHeight + 5;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(8.5)
                    .fillColor(
                        refundAmount > 0
                            ? COLORS.green
                            : COLORS.text
                    )
                    .text(
                        `Refund Status: ${refundStatus}`,
                        LEFT + 12,
                        refundY
                    );

                doc
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .fillColor(COLORS.black)
                    .text(
                        `Refund Amount: ${formatAmount(refundAmount)}`,
                        LEFT + 12,
                        refundY + 15
                    );

                doc.y = actualBlockY + blockHeight + 12;
            });

            // =================================================
            // REFUND SUMMARY
            // =================================================

            ensureSpace(145);

            drawSectionTitle("Refund Summary");

            const refundBoxY = doc.y;
            const refundBoxHeight = 105;

            doc
                .roundedRect(
                    LEFT,
                    refundBoxY,
                    CONTENT_WIDTH,
                    refundBoxHeight,
                    5
                )
                .fillAndStroke("#F8F8F8", COLORS.border);

            const refundLabelX = LEFT + 14;
            const refundValueX = LEFT + 200;
            const refundValueWidth = CONTENT_WIDTH - 214;

            const drawRefundRow = (
                label,
                value,
                y,
                options = {}
            ) => {
                doc
                    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                    .fontSize(options.bold ? 10 : 9)
                    .fillColor(options.color || COLORS.text)
                    .text(label, refundLabelX, y, {
                        width: 180
                    });

                doc
                    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                    .fontSize(options.bold ? 10 : 9)
                    .fillColor(options.color || COLORS.text)
                    .text(value, refundValueX, y, {
                        width: refundValueWidth,
                        align: "right"
                    });
            };

            drawRefundRow(
                "Original Grand Total",
                formatAmount(originalGrandTotal),
                refundBoxY + 15
            );

            drawRefundRow(
                "Total Refunded",
                `- ${formatAmount(totalRefund)}`,
                refundBoxY + 38,
                {
                    bold: true,
                    color: COLORS.green
                }
            );

            doc
                .moveTo(refundLabelX, refundBoxY + 62)
                .lineTo(RIGHT - 14, refundBoxY + 62)
                .strokeColor(COLORS.border)
                .stroke();

            drawRefundRow(
                "Net Amount Retained",
                formatAmount(netAmountRetained),
                refundBoxY + 75,
                {
                    bold: true,
                    color: COLORS.gold
                }
            );

            doc.y = refundBoxY + refundBoxHeight + 12;

            if (totalRefund > 0) {
                doc
                    .font("Helvetica")
                    .fontSize(9)
                    .fillColor(COLORS.green)
                    .text(
                        "Refund Destination: Chronix Wallet",
                        LEFT,
                        doc.y
                    );

                doc.y += 22;
            }
        }

        // =====================================================
        // FINAL PAYMENT SUMMARY
        // =====================================================

        ensureSpace(105);

        drawSectionTitle("Final Payment Summary");

        const finalBoxY = doc.y;
        const finalBoxHeight = 70;

        doc
            .roundedRect(
                LEFT,
                finalBoxY,
                CONTENT_WIDTH,
                finalBoxHeight,
                5
            )
            .fillAndStroke("#FFFDF6", COLORS.gold);

        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.text)
            .text(
                "Original Grand Total",
                LEFT + 14,
                finalBoxY + 13
            );

        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.text)
            .text(
                formatAmount(originalGrandTotal),
                LEFT + 200,
                finalBoxY + 13,
                {
                    width: CONTENT_WIDTH - 214,
                    align: "right"
                }
            );

        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.green)
            .text(
                "Total Refunded",
                LEFT + 14,
                finalBoxY + 32
            );

        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.green)
            .text(
                `- ${formatAmount(totalRefund)}`,
                LEFT + 200,
                finalBoxY + 32,
                {
                    width: CONTENT_WIDTH - 214,
                    align: "right"
                }
            );

        doc
            .moveTo(LEFT + 14, finalBoxY + 51)
            .lineTo(RIGHT - 14, finalBoxY + 51)
            .strokeColor(COLORS.gold)
            .stroke();

        doc.y = finalBoxY + finalBoxHeight + 18;

        // =====================================================
        // FOOTER
        // =====================================================

        ensureSpace(55);

        drawLine(doc.y, COLORS.border);

        doc.y += 12;

        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor(COLORS.black)
            .text(
                "Thank you for shopping with Chronix!",
                LEFT,
                doc.y,
                {
                    width: CONTENT_WIDTH,
                    align: "center"
                }
            );

        doc.moveDown(0.5);

        doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.muted)
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
        console.log("GET INVOICE ORDER SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to generate invoice"
        };
    }
};