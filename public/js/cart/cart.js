document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // CART VALIDATION MODAL
    // =====================================================

    const validationModalElement =
        document.getElementById("cartValidationModal");

    const validationMessage =
        document.getElementById("cartValidationMessage");

    const validationModal =
        validationModalElement
            ? bootstrap.Modal.getOrCreateInstance(
                validationModalElement
            )
            : null;


    function showValidationPopup(message) {

        if (!validationModal || !validationMessage) return;

        validationMessage.textContent = message;

        validationModal.show();
    }


    // =====================================================
    // QUANTITY UPDATE
    // =====================================================

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


            // -----------------------------------------
            // OUT OF STOCK
            // -----------------------------------------

            if (stock <= 0) {

                showValidationPopup(
                    "This product is out of stock."
                );

                return;
            }


            // -----------------------------------------
            // INCREASE
            // -----------------------------------------

            if (action === "increase") {

                if (quantity >= stock) {

                    showValidationPopup(
                        `Only ${stock} item(s) available.`
                    );

                    return;
                }

                quantity++;
            }


            // -----------------------------------------
            // DECREASE
            // -----------------------------------------

            if (action === "decrease") {

                if (quantity <= 1) {
                    return;
                }

                quantity--;
            }


            // -----------------------------------------
            // UPDATE CART
            // -----------------------------------------

            try {

                const response =
                    await fetch("/user/cart", {
                        method: "PATCH",

                        headers: {
                            "Content-Type": "application/json"
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


                quantityValue.textContent =
                    quantity;


                updateCartTotals();


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


    // =====================================================
    // UPDATE CART TOTAL
    // =====================================================

    function updateCartTotals() {

        let subtotal = 0;


        document
            .querySelectorAll(
                ".quantity-btn[data-action='increase']"
            )
            .forEach((button) => {

                const price =
                    parseFloat(button.dataset.price);


                const quantityValue =
                    button.parentElement.querySelector(
                        ".quantity-value"
                    );


                const quantity =
                    parseInt(
                        quantityValue.textContent
                    );


                subtotal +=
                    price * quantity;
            });


        const discount = 0;

        const shippingCharge = 0;

        const tax = 0;


        const total =
            subtotal -
            discount +
            shippingCharge +
            tax;


        const subtotalElement =
            document.getElementById(
                "cartSubtotal"
            );


        const totalElement =
            document.getElementById(
                "cartTotal"
            );


        if (subtotalElement) {

            subtotalElement.textContent =
                `₹${subtotal}`;
        }


        if (totalElement) {

            totalElement.textContent =
                `₹${total}`;
        }
    }


    // =====================================================
    // REMOVE CART ITEM
    // =====================================================

    const removeButtons =
        document.querySelectorAll(
            ".remove-cart-btn"
        );


    const removeCartModalElement =
        document.getElementById(
            "removeCartModal"
        );


    const removeCartModal =
        removeCartModalElement
            ? bootstrap.Modal.getOrCreateInstance(
                removeCartModalElement
            )
            : null;


    const confirmRemoveCartBtn =
        document.getElementById(
            "confirmRemoveCartBtn"
        );


    let selectedProductId = null;

    let selectedVariantId = null;

    let selectedCartItemId = null;

    let selectedRemoveForm = null;


    // =====================================================
    // OPEN REMOVE CONFIRMATION MODAL
    // =====================================================

    removeButtons.forEach((button) => {

        button.addEventListener("click", () => {

            selectedProductId =
                button.dataset.productId || null;


            selectedVariantId =
                button.dataset.variantId || null;


            selectedCartItemId =
                button.dataset.cartItemId || null;


            // -----------------------------------------
            // Get normal cart item's existing form
            // -----------------------------------------

            selectedRemoveForm =
                button.closest(".remove-cart-form");


            console.log(
                "REMOVE CLICK:",
                {
                    selectedProductId,
                    selectedVariantId,
                    selectedCartItemId,
                    selectedRemoveForm
                }
            );


            if (removeCartModal) {

                removeCartModal.show();
            }
        });
    });


    // =====================================================
    // CONFIRM REMOVE
    // =====================================================

    if (confirmRemoveCartBtn) {

        confirmRemoveCartBtn.addEventListener(
            "click",
            () => {


                // =========================================
                // NORMAL CART ITEM
                // =========================================

                if (
                    selectedProductId &&
                    selectedVariantId
                ) {

                    if (!selectedRemoveForm) {

                        showValidationPopup(
                            "Unable to remove this item from your cart."
                        );

                        return;
                    }


                    confirmRemoveCartBtn.disabled =
                        true;


                    confirmRemoveCartBtn.textContent =
                        "Removing...";


                    /*
                     * Form action:
                     *
                     * /user/cart/remove/productId/variantId?method=DELETE
                     *
                     * method-override will convert
                     * POST into DELETE.
                     */

                    selectedRemoveForm.submit();

                    return;
                }


                // =========================================
                // UNAVAILABLE CART ITEM
                // =========================================

                if (selectedCartItemId) {

                    /*
                     * Do not change this part yet.
                     *
                     * We will fix unavailable cart item
                     * removal separately.
                     */

                    console.log(
                        "UNAVAILABLE CART ITEM SELECTED:",
                        selectedCartItemId
                    );

                    return;
                }


                // =========================================
                // NO ITEM SELECTED
                // =========================================

                if (removeCartModal) {

                    removeCartModal.hide();
                }


                showValidationPopup(
                    "Unable to remove this item from your cart."
                );
            }
        );
    }


    // =====================================================
    // RESET SELECTED ITEM
    // =====================================================

    if (removeCartModalElement) {

        removeCartModalElement.addEventListener(
            "hidden.bs.modal",
            () => {

                selectedProductId = null;

                selectedVariantId = null;

                selectedCartItemId = null;

                selectedRemoveForm = null;


                if (confirmRemoveCartBtn) {

                    confirmRemoveCartBtn.disabled =
                        false;


                    confirmRemoveCartBtn.textContent =
                        "Remove";
                }
            }
        );
    }

});