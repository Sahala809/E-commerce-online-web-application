
document.addEventListener("DOMContentLoaded", () => {

    const orderForm = document.querySelector(
        'form[action="/user/order/place"]'
    );

    if (!orderForm) return;

    const placeOrderButton = orderForm.querySelector(
        'button[type="submit"]'
    );

    const addressInput = orderForm.querySelector(
        'input[name="addressId"]'
    );

    orderForm.addEventListener("submit", async (event) => {

        const selectedPayment = orderForm.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            event.preventDefault();
            showError("Please select a payment method.");
            return;
        }

        // COD: Allow normal form submission
        if (selectedPayment.value === "COD") {
            return;
        }

        if (selectedPayment.value !== "ONLINE") {
            return;
        }

        event.preventDefault();

        if (!addressInput || !addressInput.value) {
            showError("Please select a delivery address.");
            return;
        }

        if (typeof window.Razorpay === "undefined") {
            showError("Payment service is not available. Please refresh the page.");
            return;
        }

        try {

            placeOrderButton.disabled = true;
            placeOrderButton.textContent = "Processing...";

            // CREATE RAZORPAY ORDER

            const createResponse = await fetch(
                "/user/order/razorpay/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        addressId: addressInput.value
                    })
                }
            );

            const createResult = await createResponse.json();

            if (!createResponse.ok || !createResult.success) {
                throw new Error(
                    createResult.message || "Unable to create payment."
                );
            }

            // RAZORPAY OPTIONS

            const options = {

                key: createResult.key,

                amount: createResult.amount,

                currency: createResult.currency,

                name: "Chronix",

                description: "Watch Purchase",

                order_id: createResult.orderId,

                theme: {
                    color: "#c9a227"
                },

                handler: async function (response) {

                    // Show overlay immediately after Razorpay success
                    showProcessingOverlay(
                        "Payment successful! Confirming your order..."
                    );

                    try {

                        // VERIFY PAYMENT

                        const verifyResponse = await fetch(
                            "/user/order/razorpay/verify",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({

                                    razorpay_order_id:
                                        response.razorpay_order_id,

                                    razorpay_payment_id:
                                        response.razorpay_payment_id,

                                    razorpay_signature:
                                        response.razorpay_signature,

                                    addressId: addressInput.value

                                })
                            }
                        );

                        const verifyResult =
                            await verifyResponse.json();

                        if (!verifyResponse.ok || !verifyResult.success) {
                            throw new Error(
                                verifyResult.message ||
                                "Payment verification failed."
                            );
                        }

                        showProcessingOverlay(
                            "Order placed successfully! Redirecting..."
                        );

                        window.location.replace("/user/order-success");

                    } catch (error) {

                        hideProcessingOverlay();

                        showError(error.message);

                        placeOrderButton.disabled = false;
                        placeOrderButton.textContent = "Place Order";

                    }

                },

                modal: {

                    ondismiss: function () {

                        hideProcessingOverlay();

                        placeOrderButton.disabled = false;
                        placeOrderButton.textContent = "Place Order";

                    }

                }

            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function (response) {

    console.error(
        "Razorpay Payment Failed:",
        response.error
    );

    window.location.href = "/user/order-failure";

});

            razorpay.open();

        } catch (error) {

            hideProcessingOverlay();

            showError(error.message);

            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";

        }

    });


    // PROCESSING OVERLAY

    function showProcessingOverlay(message) {

        let overlay = document.getElementById(
            "payment-processing-overlay"
        );

        if (!overlay) {

            overlay = document.createElement("div");

            overlay.id = "payment-processing-overlay";

            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                color: white;
                font-size: 18px;
                text-align: center;
            `;

            overlay.innerHTML = `
                <div>
                    <div class="spinner-border text-warning mb-3"></div>
                    <div id="payment-processing-message"></div>
                </div>
            `;

            document.body.appendChild(overlay);
        }

        document.getElementById(
            "payment-processing-message"
        ).textContent = message;

    }


    function hideProcessingOverlay() {

        const overlay = document.getElementById(
            "payment-processing-overlay"
        );

        if (overlay) {
            overlay.remove();
        }

    }


    // ERROR MESSAGE

    function showError(message) {

        let errorBox = document.querySelector(
            ".razorpay-error-message"
        );

        if (!errorBox) {

            errorBox = document.createElement("div");

            errorBox.className = "razorpay-error-message";

            errorBox.style.color = "#dc3545";
            errorBox.style.marginTop = "12px";
            errorBox.style.fontSize = "14px";

            orderForm.appendChild(errorBox);

        }

        errorBox.textContent = message;

    }

});
