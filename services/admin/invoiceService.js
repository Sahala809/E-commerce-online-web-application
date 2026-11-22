
import PDFDocument from "pdfkit";
import Order from "../../models/ordermodel.js";

export const getInvoiceOrderService = async (orderId, res) => {
    try {
        const order = await Order.findById(orderId)
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

        // Invoice is available only for delivered or returned orders
        if (!["DELIVERED", "RETURNED"].includes(order.status)) {
            return {
                success: false,
                message: "Invoice is available only for delivered orders"
            };
        }

        const doc = new PDFDocument({
            size: "A4",
            margin: 0
        });

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            `inline; filename="Chronix-Invoice-${order._id}.pdf"`
        );

        doc.pipe(res);

        // ==========================================
        // PAGE AND STYLE CONSTANTS
        // ==========================================

        const PAGE_WIDTH = doc.page.width;

        const LEFT = 42;
        const RIGHT = PAGE_WIDTH - 42;
        const WIDTH = RIGHT - LEFT;

        const COLORS = {
            black: "#171717",
            gold: "#C49B28",
            text: "#444444",
            muted: "#777777",
            border: "#DDDDDD",
            light: "#F7F7F7",
            white: "#FFFFFF",
            green: "#198754"
        };

        // ==========================================
        // HELPER FUNCTIONS
        // ==========================================

        const formatAmount = (amount) => {
            return `Rs. ${Number(amount || 0).toFixed(2)}`;
        };

        const formatDate = (date) => {
            return date
                ? new Date(date).toLocaleDateString("en-IN")
                : "N/A";
        };

        const safeText = (value) => {
            return value === null || value === undefined || value === ""
                ? "N/A"
                : String(value);
        };

        const drawText = (
            text,
            x,
            y,
            width,
            options = {}
        ) => {
            doc
                .font(options.bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(options.fontSize || 9)
                .fillColor(options.color || COLORS.text)
                .text(safeText(text), x, y, {
                    width,
                    align: options.align || "left",
                    lineBreak: options.lineBreak ?? true,
                    ellipsis: options.ellipsis || false
                });
        };

        const drawLine = (y, color = COLORS.border) => {
            doc
                .moveTo(LEFT, y)
                .lineTo(RIGHT, y)
                .strokeColor(color)
                .lineWidth(0.8)
                .stroke();
        };

        const drawSectionTitle = (title, y) => {
            drawText(title, LEFT, y, WIDTH, {
                bold: true,
                fontSize: 12,
                color: COLORS.black
            });

            doc
                .moveTo(LEFT, y + 21)
                .lineTo(RIGHT, y + 21)
                .strokeColor(COLORS.gold)
                .lineWidth(1.4)
                .stroke();
        };

        const drawLabelValue = (
            label,
            value,
            x,
            y,
            width,
            labelWidth = 100
        ) => {
            drawText(label, x, y, labelWidth, {
                fontSize: 8,
                color: COLORS.muted
            });

            drawText(value, x + labelWidth, y, width - labelWidth, {
                fontSize: 8.5,
                bold: true,
                color: COLORS.text,
                lineBreak: false
            });
        };

        // ==========================================
        // ORDER DATA
        // ==========================================

        const orderItems = (order.orderItemId || []).filter(Boolean);

        const originalGrandTotal = Number(order.totalAmount) || 0;

        // Calculate total refund for returned items
        const totalRefund = orderItems.reduce((total, item) => {
            return total + Math.max(
                0,
                Number(item.refundAmount) || 0
            );
        }, 0);

        // Amount after deducting refunds
        const finalAmountAfterRefund = Math.max(
            0,
            originalGrandTotal - totalRefund
        );

        // ==========================================
        // HEADER
        // ==========================================

        drawText("CHRONIX", LEFT, 35, WIDTH, {
            bold: true,
            fontSize: 27,
            color: COLORS.black,
            align: "center"
        });

        drawText("INVOICE", LEFT, 68, WIDTH, {
            bold: true,
            fontSize: 15,
            color: COLORS.gold,
            align: "center"
        });

        drawText("ORDER INVOICE", LEFT, 90, WIDTH, {
            fontSize: 8,
            color: COLORS.muted,
            align: "center"
        });

        drawLine(110, COLORS.gold);

        // ==========================================
        // INVOICE INFORMATION
        // ==========================================

        drawSectionTitle("Invoice Information", 128);

        const infoY = 164;
        const halfWidth = WIDTH / 2;

        drawLabelValue(
            "Invoice Number",
            `CH-${String(order._id).slice(-8).toUpperCase()}`,
            LEFT,
            infoY,
            halfWidth,
            100
        );

        drawLabelValue(
            "Invoice Date",
            formatDate(new Date()),
            LEFT + halfWidth,
            infoY,
            halfWidth,
            85
        );

        drawLabelValue(
            "Order Date",
            formatDate(order.createdAt),
            LEFT,
            infoY + 25,
            halfWidth,
            100
        );

        drawLabelValue(
            "Customer",
            order.shippingAddress?.fullName,
            LEFT + halfWidth,
            infoY + 25,
            halfWidth,
            85
        );

        // ==========================================
        // PAYMENT INFORMATION
        // ==========================================

        drawSectionTitle("Payment Information", 225);

        const paymentY = 261;
        const paymentHeight = 65;

        doc
            .roundedRect(
                LEFT,
                paymentY,
                WIDTH,
                paymentHeight,
                5
            )
            .fillAndStroke(COLORS.light, COLORS.border);

        drawLabelValue(
            "Payment Method",
            order.paymentMethod,
            LEFT + 12,
            paymentY + 15,
            halfWidth - 12,
            100
        );

        drawLabelValue(
            "Payment Status",
            order.paymentStatus,
            LEFT + halfWidth,
            paymentY + 15,
            halfWidth - 12,
            95
        );

        drawLabelValue(
            "Order Status",
            order.status,
            LEFT + 12,
            paymentY + 40,
            halfWidth - 12,
            100
        );

        drawLabelValue(
            "Order Amount",
            formatAmount(originalGrandTotal),
            LEFT + halfWidth,
            paymentY + 40,
            halfWidth - 12,
            95
        );

        // ==========================================
        // ORDER ITEMS TABLE
        // ==========================================

        drawSectionTitle("Order Items", 347);

        const columnWidths = [28, 230, 45, 100, 108];

        const headers = [
            "#",
            "Product",
            "Qty",
            "Unit Price",
            "Total"
        ];

        const tableWidth = columnWidths.reduce(
            (total, width) => total + width,
            0
        );

        const tableX = LEFT;
        const tableHeaderY = 376;
        const headerHeight = 27;

        const tableBottom = 650;

        const availableRowHeight =
            tableBottom - tableHeaderY - headerHeight;

        // Keep all item rows within the one-page table area
        const rowHeight = orderItems.length > 0
            ? Math.min(32, availableRowHeight / orderItems.length)
            : 28;

        const rowFontSize = Math.max(
            5.8,
            Math.min(8, rowHeight * 0.29)
        );

        // TABLE HEADER

        doc
            .rect(tableX, tableHeaderY, tableWidth, headerHeight)
            .fill(COLORS.black);

        let headerX = tableX;

        headers.forEach((header, index) => {
            drawText(
                header,
                headerX + 3,
                tableHeaderY + 9,
                columnWidths[index] - 6,
                {
                    bold: true,
                    fontSize: 7.5,
                    color: COLORS.white,
                    align:
                        index === 0 || index === 2
                            ? "center"
                            : index >= 3
                                ? "right"
                                : "left",
                    lineBreak: false
                }
            );

            headerX += columnWidths[index];
        });

        // TABLE ROWS

        let currentY = tableHeaderY + headerHeight;

        orderItems.forEach((item, index) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            const savedFinalPrice = Number(item.finalPrice);

            const finalPrice =
                savedFinalPrice > 0
                    ? savedFinalPrice
                    : price;

            const itemTotal = finalPrice * quantity;

            const productName =
                item.productId?.productName || "Product";

            const values = [
                String(index + 1),
                productName,
                String(quantity),
                formatAmount(finalPrice),
                formatAmount(itemTotal)
            ];

            // Alternate row background
            doc
                .rect(
                    tableX,
                    currentY,
                    tableWidth,
                    rowHeight
                )
                .fill(
                    index % 2 === 0
                        ? COLORS.white
                        : COLORS.light
                );

            // Row border
            doc
                .rect(
                    tableX,
                    currentY,
                    tableWidth,
                    rowHeight
                )
                .strokeColor(COLORS.border)
                .lineWidth(0.5)
                .stroke();

            let cellX = tableX;

            values.forEach((value, valueIndex) => {
                drawText(
                    value,
                    cellX + 3,
                    currentY + Math.max(
                        2,
                        (rowHeight - rowFontSize) / 2 - 1
                    ),
                    columnWidths[valueIndex] - 6,
                    {
                        fontSize: rowFontSize,
                        color: COLORS.text,
                        align:
                            valueIndex === 0 || valueIndex === 2
                                ? "center"
                                : valueIndex >= 3
                                    ? "right"
                                    : "left",
                        lineBreak: false,
                        ellipsis: true
                    }
                );

                cellX += columnWidths[valueIndex];
            });

            // Vertical column borders
            let borderX = tableX;

            columnWidths.forEach((width, columnIndex) => {
                if (columnIndex > 0) {
                    borderX += width;

                    doc
                        .moveTo(borderX, currentY)
                        .lineTo(borderX, currentY + rowHeight)
                        .strokeColor(COLORS.border)
                        .lineWidth(0.5)
                        .stroke();
                }
            });

            currentY += rowHeight;
        });

        // Empty order items message
        if (orderItems.length === 0) {
            drawText(
                "No order items found",
                LEFT,
                currentY + 10,
                tableWidth,
                {
                    fontSize: 9,
                    color: COLORS.muted,
                    align: "center"
                }
            );
        }

        // ==========================================
        // ORDER SUMMARY
        // ==========================================

       const summaryTitleY = currentY + 20;

drawSectionTitle("Order Summary", summaryTitleY);

const summaryWidth = 275;
const summaryHeight = 110;
const summaryX = RIGHT - summaryWidth;
const summaryY = summaryTitleY + 29;


        doc
            .roundedRect(
                summaryX,
                summaryY,
                summaryWidth,
                summaryHeight,
                5
            )
            .fillAndStroke(COLORS.light, COLORS.border);

        const drawSummaryRow = (
            label,
            value,
            y,
            options = {}
        ) => {
            drawText(
                label,
                summaryX + 12,
                y,
                145,
                {
                    fontSize: options.fontSize || 8.5,
                    bold: options.bold || false,
                    color: options.color || COLORS.text
                }
            );

            drawText(
                value,
                summaryX + 157,
                y,
                summaryWidth - 169,
                {
                    fontSize: options.fontSize || 8.5,
                    bold: options.bold || false,
                    color: options.color || COLORS.text,
                    align: "right",
                    lineBreak: false
                }
            );
        };

        drawSummaryRow(
            "Subtotal",
            formatAmount(order.subTotal),
            summaryY + 8
        );

        drawSummaryRow(
            "Total Discount",
            `- ${formatAmount(order.discountAmount)}`,
            summaryY + 24
        );

        drawSummaryRow(
            "Delivery Charge",
            formatAmount(order.deliveryCharge),
            summaryY + 40
        );

        drawSummaryRow(
            "Original Grand Total",
            formatAmount(originalGrandTotal),
            summaryY + 56,
            {
                bold: true
            }
        );

        drawSummaryRow(
            "Returned Items Refund",
            `- ${formatAmount(totalRefund)}`,
            summaryY + 72,
            {
                bold: true,
                color: COLORS.green
            }
        );

        // Divider
        doc
            .moveTo(
                summaryX + 12,
                summaryY + 88
            )
            .lineTo(
                summaryX + summaryWidth - 12,
                summaryY + 88
            )
            .strokeColor(COLORS.border)
            .stroke();

        // Final amount after refund
        drawSummaryRow(
            "Final Amount",
            formatAmount(finalAmountAfterRefund),
            summaryY + 94,
            {
                bold: true,
                fontSize: 9,
                color: COLORS.gold
            }
        );

        // ==========================================
        // FOOTER
        // ==========================================

        drawLine(820);

        drawText(
            "Thank you for shopping with Chronix!",
            LEFT,
            828,
            WIDTH,
            {
                bold: true,
                fontSize: 9,
                color: COLORS.black,
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
