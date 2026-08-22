document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // INCREASE / DECREASE QUANTITY
    // ==========================================

    const quantityButtons =
        document.querySelectorAll(".quantity-btn");

    quantityButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const variantId = button.dataset.variantId;

            const action = button.dataset.action;

            const stock = parseInt(button.dataset.stock);

            const quantityValue =
                button.parentElement.querySelector(".quantity-value");

            let quantity =
                parseInt(quantityValue.textContent);


            // INCREASE
            if (action === "increase") {

                if (quantity >= stock) {

                    alert(`Only ${stock} items available`);

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

                const response = await fetch("/user/cart", {

                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        variantId,
                        quantity
                    })
                });


                const result = await response.json();


                if (!result.success) {

                    alert(result.message);

                    return;
                }


                quantityValue.textContent = quantity;


            } catch (error) {

                console.log("UPDATE CART ERROR:", error);

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

            const variantId =
                button.dataset.variantId;

            const cartItem =
                button.closest(".cart-item");


            const confirmRemove =
                confirm("Remove this item from your cart?");


            if (!confirmRemove) {
                return;
            }


            try {

                const response = await fetch("/user/cart", {

                    method: "DELETE",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        variantId
                    })
                });


                const result =
                    await response.json();


                if (!result.success) {

                    alert(result.message);

                    return;
                }


                cartItem.remove();

                window.location.reload();


            } catch (error) {

                console.log("REMOVE CART ERROR:", error);

                alert("Something went wrong");
            }

        });

    });

});