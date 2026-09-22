document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // VALIDATION MODAL
    // ==========================================

    const validationModalElement =
        document.getElementById("cartValidationModal");

    const validationMessage =
        document.getElementById("cartValidationMessage");

    const validationModal =
        bootstrap.Modal.getOrCreateInstance(
            validationModalElement
        );

    function showValidationPopup(message) {
        validationMessage.textContent = message;
        validationModal.show();
    }


    // ==========================================
    // QUANTITY BUTTONS
    // ==========================================

    const quantityButtons =
        document.querySelectorAll(".quantity-btn");

    quantityButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const variantId =
                button.dataset.variantId;

            const action =
                button.dataset.action;

            const stock =
                parseInt(button.dataset.stock);

            const quantityValue =
                button.parentElement.querySelector(
                    ".quantity-value"
                );

            let quantity =
                parseInt(quantityValue.textContent);


            // STOCK = 0
            if (stock <= 0) {

                showValidationPopup(
                    "This product is out of stock."
                );

                return;
            }


            // INCREASE
            if (action === "increase") {

                if (quantity >= stock) {

                    showValidationPopup(
                        `Only ${stock} item(s) available.`
                    );

                    return;
                }

                quantity++;
            }


            // DECREASE
            if (action === "decrease") {

                if (quantity <= 1) {
                    return;
                }

                quantity--;
            }


            // UPDATE CART
            try {

                const response =
                    await fetch("/user/cart", {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            variantId,
                            quantity
                        })
                    });

                const result =
                    await response.json();


                if (!result.success) {

                    showValidationPopup(
                        result.message
                    );

                    return;
                }


                // Update quantity on page
                quantityValue.textContent =
                    quantity;


            } catch (error) {

                console.log(
                    "UPDATE CART ERROR:",
                    error
                );

                showValidationPopup(
                    "Unable to update the cart."
                );
            }
        });
    });


    // ==========================================
    // REMOVE CART ITEM
    // ==========================================

    const removeButtons =
        document.querySelectorAll(".remove-cart-btn");


    // Remove confirmation modal
    const removeCartModalElement =
        document.getElementById("removeCartModal");

    const removeCartModal =
        bootstrap.Modal.getOrCreateInstance(
            removeCartModalElement
        );


    // Confirm button
    const confirmRemoveCartBtn =
        document.getElementById(
            "confirmRemoveCartBtn"
        );


    // Selected item
    let selectedProductId = null;
    let selectedVariantId = null;
    let selectedCartItemId = null;


    // ==========================================
    // OPEN REMOVE CONFIRMATION MODAL
    // ==========================================

    removeButtons.forEach((button) => {

        button.addEventListener("click", () => {

            selectedProductId =
                button.dataset.productId || null;

            selectedVariantId =
                button.dataset.variantId || null;

            selectedCartItemId =
                button.dataset.cartItemId || null;


            // Show Bootstrap modal
            removeCartModal.show();
        });
    });


    // ==========================================
    // CONFIRM REMOVE
    // ==========================================

    confirmRemoveCartBtn.addEventListener(
        "click",
        async () => {

            let url = null;


            // Normal product + variant
            if (
                selectedProductId &&
                selectedVariantId
            ) {

                url =
                    `/user/cart/remove/${selectedProductId}/${selectedVariantId}`;

            }


            // Product / variant unavailable
            else if (selectedCartItemId) {

                url =
                    `/user/cart/remove-item/${selectedCartItemId}`;

            }


            // Invalid item
            else {

                removeCartModal.hide();

                showValidationPopup(
                    "Unable to remove this item from your cart."
                );

                return;
            }


            try {

                // Disable button while removing
                confirmRemoveCartBtn.disabled = true;

                confirmRemoveCartBtn.textContent =
                    "Removing...";


                const response =
                    await fetch(url, {
                        method: "DELETE"
                    });


                const result =
                    await response.json();


                // Remove failed
                if (!result.success) {

                    removeCartModal.hide();

                    showValidationPopup(
                        result.message ||
                        "Unable to remove this item from your cart."
                    );

                    return;
                }


                // Remove confirmation modal
                removeCartModal.hide();


                // Reload cart
                window.location.href =
                    "/user/cart";


            } catch (error) {

                console.log(
                    "REMOVE CART ERROR:",
                    error
                );

                removeCartModal.hide();

                showValidationPopup(
                    "Unable to remove this item from your cart."
                );


            } finally {

                confirmRemoveCartBtn.disabled =
                    false;

                confirmRemoveCartBtn.textContent =
                    "Remove";
            }
        }
    );


    // ==========================================
    // RESET MODAL DATA
    // ==========================================

    removeCartModalElement.addEventListener(
        "hidden.bs.modal",
        () => {

            selectedProductId = null;
            selectedVariantId = null;
            selectedCartItemId = null;

            confirmRemoveCartBtn.disabled =
                false;

            confirmRemoveCartBtn.textContent =
                "Remove";
        }
    );

});