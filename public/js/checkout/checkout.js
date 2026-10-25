
document.addEventListener("DOMContentLoaded", () => {
    const orderForm = document.querySelector(
        'form[action="/user/order/place"]'
    );

    if (!orderForm) {
        console.error("Checkout order form not found");
        return;
    }

    // Display payment errors without using alert()
    let errorBox = document.getElementById("payment-error");

    if (!errorBox) {
        errorBox = document.createElement("div");
        errorBox.id = "payment-error";
        errorBox.className = "alert alert-danger";
        errorBox.style.display = "none";
        orderForm.prepend(errorBox);
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
        errorBox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    orderForm.addEventListener("submit", async (event) => {
        const selectedPayment = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        // Keep the existing COD workflow unchanged
        if (!selectedPayment || selectedPayment.value === "COD") {
            return;
        }

        if (selectedPayment.value !== "ONLINE") {
            return;
        }

        // Stop normal order creation for online payments
        event.preventDefault();

        errorBox.style.display = "none";

        const addressInput = orderForm.querySelector(
            'input[name="addressId"]'
        );

        if (!addressInput || !addressInput.value) {
            showError("Please select a delivery address.");
            return;
        }

        if (typeof window.Razorpay !== "function") {
            showError("Razorpay could not load. Please refresh and try again.");
            return;
        }

        try {
            const response = await fetch(
                "/user/order/razorpay/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        addressId: addressInput.value
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                showError(
                    result.message || "Unable to start online payment."
                );
                return;
            }

            const options = {
                key: result.key,
                amount: result.amount,
                currency: result.currency,
                order_id: result.orderId,
                name: "Chronix",
                description: "Watch Store Payment",

                handler: async function (paymentResponse) {
                    try {
                        const verifyResponse = await fetch(
                            "/user/order/razorpay/verify",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                credentials: "same-origin",
                                body: JSON.stringify({
                                    ...paymentResponse,
                                    addressId: addressInput.value
                                })
                            }
                        );

                        const verifyResult =
                            await verifyResponse.json();

                        if (
                            !verifyResponse.ok ||
                            !verifyResult.success
                        ) {
                            showError(
                                verifyResult.message ||
                                "Payment verification failed. Please contact support before trying again."
                            );
                            return;
                        }

                        window.location.href =
                            "/user/order-success";

                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        showError(
                            "Could not confirm the payment status. Please check your order before paying again."
                        );
                    }
                },

                modal: {
                    ondismiss: function () {
                        showError(
                            "Payment was not completed. You can try again."
                        );
                    }
                },

                theme: {
                    color: "#c9a227"
                }
            };

            const razorpayCheckout = new window.Razorpay(options);

            razorpayCheckout.on("payment.failed", function () {
                showError(
                    "Payment failed. Please try again."
                );
            });

            razorpayCheckout.open();

        } catch (error) {
            console.error("Razorpay checkout error:", error);

            showError(
                "Unable to start payment. Please try again."
            );
        }
    });
});
