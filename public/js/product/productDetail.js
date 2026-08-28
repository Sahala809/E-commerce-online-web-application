document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const mainImage =
        document.getElementById("mainProductImage");

    const thumbnailList =
        document.getElementById("thumbnailList");

    const colorOptions =
        document.querySelectorAll(".color-option");

    const offerPrice =
        document.querySelector(".detail-offer-price");

    const originalPrice =
        document.querySelector(".detail-original-price");

    const stockInfo =
        document.querySelector(".stock-info");

    const zoomContainer =
        document.querySelector(".zoom-container");


    // =========================================================
    // INITIAL VARIANT
    // =========================================================

    let selectedVariant =
        variants && variants.length > 0
            ? variants[0]
            : null;


    // =========================================================
    // PRODUCT IMAGE ZOOM
    // =========================================================

    if (zoomContainer && mainImage) {

        // -----------------------------------------
        // MOUSE ENTER
        // -----------------------------------------

        zoomContainer.addEventListener("mouseenter", () => {

            zoomContainer.classList.add("zoomed");

        });


        // -----------------------------------------
        // MOUSE MOVE
        // -----------------------------------------

        zoomContainer.addEventListener("mousemove", (event) => {

            const rect =
                zoomContainer.getBoundingClientRect();


            const x =
                ((event.clientX - rect.left) / rect.width) * 100;

            const y =
                ((event.clientY - rect.top) / rect.height) * 100;


            mainImage.style.transformOrigin =
                `${x}% ${y}%`;

        });


        // -----------------------------------------
        // MOUSE LEAVE
        // -----------------------------------------

        zoomContainer.addEventListener("mouseleave", () => {

            zoomContainer.classList.remove("zoomed");

            mainImage.style.transformOrigin =
                "center center";

        });

    }


    // =========================================================
    // QUANTITY
    // =========================================================

    const decreaseQuantity =
        document.getElementById("decreaseQuantity");

    const increaseQuantity =
        document.getElementById("increaseQuantity");

    const quantityElement =
        document.getElementById("quantity");

    const cartQuantity =
        document.getElementById("cartQuantity");


    let quantity = 1;


    // -----------------------------------------
    // INCREASE QUANTITY
    // -----------------------------------------

    if (increaseQuantity) {

        increaseQuantity.addEventListener("click", () => {

            if (!selectedVariant) {
                return;
            }


            if (quantity < selectedVariant.stock) {

                quantity++;

                quantityElement.textContent =
                    quantity;

                if (cartQuantity) {
                    cartQuantity.value =
                        quantity;
                }

            }

        });

    }


    // -----------------------------------------
    // DECREASE QUANTITY
    // -----------------------------------------

    if (decreaseQuantity) {

        decreaseQuantity.addEventListener("click", () => {

            if (quantity > 1) {

                quantity--;

                quantityElement.textContent =
                    quantity;

                if (cartQuantity) {
                    cartQuantity.value =
                        quantity;
                }

            }

        });

    }


    // =========================================================
    // UPDATE PRODUCT IMAGES
    // =========================================================

    function updateImages(variant) {

        if (
            !variant ||
            !variant.images ||
            variant.images.length === 0
        ) {

            if (thumbnailList) {
                thumbnailList.innerHTML = "";
            }

            if (mainImage) {
                mainImage.style.display = "none";
            }

            return;
        }


        // -----------------------------------------
        // SHOW MAIN IMAGE
        // -----------------------------------------

        if (mainImage) {

            mainImage.style.display = "block";

            mainImage.src =
                `/uploads/variants/${variant.images[0]}`;

            mainImage.alt =
                "Product Image";

            // Reset zoom position
            mainImage.style.transformOrigin =
                "center center";

        }


        // -----------------------------------------
        // RESET ZOOM
        // -----------------------------------------

        if (zoomContainer) {

            zoomContainer.classList.remove("zoomed");

        }


        // -----------------------------------------
        // THUMBNAILS
        // -----------------------------------------

        if (!thumbnailList) {
            return;
        }


        thumbnailList.innerHTML = "";


        variant.images
            .slice(0, 3)
            .forEach((image, index) => {


                // ---------------------------------
                // CREATE THUMBNAIL
                // ---------------------------------

                const thumbnail =
                    document.createElement("div");


                thumbnail.classList.add("thumbnail");


                if (index === 0) {

                    thumbnail.classList.add("active");

                }


                thumbnail.dataset.image =
                    `/uploads/variants/${image}`;


                // ---------------------------------
                // CREATE IMAGE
                // ---------------------------------

                const img =
                    document.createElement("img");


                img.src =
                    `/uploads/variants/${image}`;


                img.alt =
                    "Product Image";


                thumbnail.appendChild(img);

                thumbnailList.appendChild(thumbnail);


                // ---------------------------------
                // THUMBNAIL CLICK
                // ---------------------------------

                thumbnail.addEventListener("click", () => {

                    if (mainImage) {

                        mainImage.src =
                            `/uploads/variants/${image}`;

                        mainImage.style.transformOrigin =
                            "center center";

                    }


                    // Reset zoom

                    if (zoomContainer) {

                        zoomContainer.classList.remove(
                            "zoomed"
                        );

                    }


                    // Remove active class

                    thumbnailList
                        .querySelectorAll(".thumbnail")
                        .forEach(item => {

                            item.classList.remove("active");

                        });


                    // Add active class

                    thumbnail.classList.add("active");

                });

            });

    }


    // =========================================================
    // UPDATE PRICE
    // =========================================================

    function updatePrice(variant) {

        if (!variant) {
            return;
        }


        if (
            variant.offerPrice &&
            variant.offerPrice > 0 &&
            variant.offerPrice < variant.price
        ) {

            // -----------------------------------------
            // OFFER PRICE
            // -----------------------------------------

            if (offerPrice) {

                offerPrice.textContent =
                    `₹${variant.offerPrice}`;

            }


            // -----------------------------------------
            // ORIGINAL PRICE
            // -----------------------------------------

            if (originalPrice) {

                originalPrice.textContent =
                    `₹${variant.price}`;

                originalPrice.style.display =
                    "inline";

            }

        } else {

            // -----------------------------------------
            // NORMAL PRICE
            // -----------------------------------------

            if (offerPrice) {

                offerPrice.textContent =
                    `₹${variant.price}`;

            }


            if (originalPrice) {

                originalPrice.style.display =
                    "none";

            }

        }

    }


    // =========================================================
    // UPDATE STOCK
    // =========================================================

    function updateStock(variant) {

        if (!variant || !stockInfo) {
            return;
        }


        if (variant.stock > 0) {

            stockInfo.innerHTML = `
                <span class="in-stock">
                    <i class="bi bi-check-circle"></i>
                    In Stock
                </span>
            `;

        } else {

            stockInfo.innerHTML = `
                <span class="out-stock">
                    Out of Stock
                </span>
            `;

        }

    }


    // =========================================================
    // COLOR / VARIANT SELECTION
    // =========================================================

    colorOptions.forEach(button => {

        button.addEventListener("click", () => {


            // -----------------------------------------
            // GET VARIANT ID
            // -----------------------------------------

            const variantId =
                button.dataset.variantId;


            // -----------------------------------------
            // FIND VARIANT
            // -----------------------------------------

            selectedVariant =
                variants.find(
                    variant =>
                        variant._id.toString() === variantId
                );


            if (!selectedVariant) {
                return;
            }


            // -----------------------------------------
            // SELECTED COLOR
            // -----------------------------------------

            colorOptions.forEach(item => {

                item.classList.remove("selected");

            });


            button.classList.add("selected");


            // -----------------------------------------
            // UPDATE IMAGES
            // -----------------------------------------

            updateImages(
                selectedVariant
            );


            // -----------------------------------------
            // UPDATE PRICE
            // -----------------------------------------

            updatePrice(
                selectedVariant
            );


            // -----------------------------------------
            // UPDATE STOCK
            // -----------------------------------------

            updateStock(
                selectedVariant
            );


            // -----------------------------------------
            // RESET QUANTITY
            // -----------------------------------------

            quantity = 1;


            if (quantityElement) {

                quantityElement.textContent =
                    quantity;

            }


            if (cartQuantity) {

                cartQuantity.value =
                    quantity;

            }


            // -----------------------------------------
            // UPDATE SELECTED VARIANT ID
            // -----------------------------------------

            const selectedVariantId =
                document.getElementById(
                    "selectedVariantId"
                );


            if (selectedVariantId) {

                selectedVariantId.value =
                    selectedVariant._id;

            }

        });

    });


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    if (selectedVariant) {

        updateImages(
            selectedVariant
        );


        updatePrice(
            selectedVariant
        );


        updateStock(
            selectedVariant
        );

    }

});