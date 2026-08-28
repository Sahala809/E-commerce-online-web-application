document.addEventListener("DOMContentLoaded", () => {

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


            // ==========================================
            // STOCK = 0
            // ==========================================

            if (stock <= 0) {

                alert("This product is out of stock.");

                return;
            }


            // ==========================================
            // INCREASE
            // ==========================================

            if (action === "increase") {

                if (quantity >= stock) {

                    alert(
                        `Only ${stock} item(s) available`
                    );

                    return;
                }

                quantity++;
            }


            // ==========================================
            // DECREASE
            // ==========================================

            if (action === "decrease") {

                if (quantity <= 1) {
                    return;
                }

                quantity--;
            }


            // ==========================================
            // UPDATE CART
            // ==========================================

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

                    alert(result.message);

                    return;
                }


                quantityValue.textContent =
                    quantity;


            } catch (error) {

                console.log(
                    "UPDATE CART ERROR:",
                    error
                );

                alert("Something went wrong");
            }

        });

    });


    // ==========================================
    // REMOVE CART ITEM
    // ==========================================

    const removeButtons =
        document.querySelectorAll(".remove-cart-btn");


    removeButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const productId =
                button.dataset.productId;

            const variantId =
                button.dataset.variantId;

            const cartItemId =
                button.dataset.cartItemId;


            const cartItem =
                button.closest(".cart-item");


            const confirmRemove =
                confirm(
                    "Remove this item from your cart?"
                );


            if (!confirmRemove) {
                return;
            }


            try {

                let url;


                // ==========================================
                // NORMAL PRODUCT + VARIANT
                // ==========================================

                if (productId && variantId) {

                    url =
                        `/user/cart/remove/${productId}/${variantId}`;

                }


                // ==========================================
                // DELETED PRODUCT / VARIANT
                // ==========================================

                else if (cartItemId) {

                    url =
                        `/user/cart/remove-item/${cartItemId}`;

                }


                // ==========================================
                // INVALID CART ITEM
                // ==========================================

                else {

                    alert("Unable to remove this item.");

                    return;
                }


                // ==========================================
                // DELETE REQUEST
                // ==========================================

                const response =
                    await fetch(url, {
                        method: "DELETE"
                    });


                const result =
                    await response.json();


                // ==========================================
                // SERVER ERROR
                // ==========================================

                if (!result.success) {

                    alert(result.message);

                    return;
                }


                // ==========================================
                // REMOVE FROM PAGE
                // ==========================================

                cartItem.remove();


                // ==========================================
                // RELOAD CART
                // ==========================================

                window.location.reload();

            } catch (error) {

                console.log(
                    "REMOVE CART ERROR:",
                    error
                );

                alert("Something went wrong");
            }

        });

    });

});