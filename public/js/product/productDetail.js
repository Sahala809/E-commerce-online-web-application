document.addEventListener("DOMContentLoaded", () => {

    const mainImage = document.getElementById("mainProductImage");
    const thumbnailList = document.getElementById("thumbnailList");
    const colorOptions = document.querySelectorAll(".color-option");

    const offerPrice = document.querySelector(".detail-offer-price");
    const originalPrice = document.querySelector(".detail-original-price");
    const stockInfo = document.querySelector(".stock-info");

    /*
    =========================================================
    INITIAL VARIANT
    =========================================================
    */

    

    let selectedVariant = variants[0];

    /*
    =========================================================
    QUANTITY
    =========================================================
    */

    const decreaseQuantity =
        document.getElementById("decreaseQuantity");

    const increaseQuantity =
        document.getElementById("increaseQuantity");

    const quantityElement =
        document.getElementById("quantity");

    let quantity = 1;


    increaseQuantity.addEventListener("click", () => {

        if (!selectedVariant) return;

        if (quantity < selectedVariant.stock) {

            quantity++;

            quantityElement.textContent = quantity;
        }

    });


    decreaseQuantity.addEventListener("click", () => {

        if (quantity > 1) {

            quantity--;

            quantityElement.textContent = quantity;
        }

    });



    /*
    =========================================================
    CHANGE PRODUCT IMAGES
    =========================================================
    */

    function updateImages(variant) {

        if (!variant || !variant.images || variant.images.length === 0) {

            thumbnailList.innerHTML = "";

            if (mainImage) {
                mainImage.style.display = "none";
            }

            return;
        }


        /*
        -------------------------
        MAIN IMAGE
        -------------------------
        */

        if (mainImage) {

            mainImage.style.display = "block";

            mainImage.src =
                `/uploads/variants/${variant.images[0]}`;

            mainImage.alt = "Product Image";
        }


        /*
        -------------------------
        THUMBNAILS
        -------------------------
        */

        thumbnailList.innerHTML = "";

        variant.images.slice(0, 3).forEach((image, index) => {

            const thumbnail = document.createElement("div");

            thumbnail.classList.add("thumbnail");

            if (index === 0) {
                thumbnail.classList.add("active");
            }

            thumbnail.dataset.image =
                `/uploads/variants/${image}`;


            const img = document.createElement("img");

            img.src =
                `/uploads/variants/${image}`;

            img.alt = "Product Image";


            thumbnail.appendChild(img);

            thumbnailList.appendChild(thumbnail);


            /*
            -------------------------
            THUMBNAIL CLICK
            -------------------------
            */

            thumbnail.addEventListener("click", () => {

                mainImage.src =
                    `/uploads/variants/${image}`;

                document
                    .querySelectorAll(".thumbnail")
                    .forEach(item => {
                        item.classList.remove("active");
                    });

                thumbnail.classList.add("active");
            });

            thumbnail.addEventListener("click", () => {

                if (mainImage) {

                    mainImage.src =
                        `/uploads/variants/${image}`;
                }


                document
                    .querySelectorAll(".thumbnail")
                    .forEach(item => {
                        item.classList.remove("active");
                    });


                thumbnail.classList.add("active");
            });

        });
    }


    /*
    =========================================================
    UPDATE PRICE
    =========================================================
    */

    function updatePrice(variant) {

        if (!variant) return;


        if (
            variant.offerPrice &&
            variant.offerPrice > 0 &&
            variant.offerPrice < variant.price
        ) {

            offerPrice.textContent =
                `₹${variant.offerPrice}`;


            if (originalPrice) {

                originalPrice.textContent =
                    `₹${variant.price}`;

                originalPrice.style.display = "inline";
            }

        } else {

            offerPrice.textContent =
                `₹${variant.price}`;


            if (originalPrice) {
                originalPrice.style.display = "none";
            }
        }
    }


    /*
    =========================================================
    UPDATE STOCK
    =========================================================
    */

    function updateStock(variant) {

        if (!variant) return;


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


    /*
    =========================================================
    COLOR / VARIANT SELECTION
    =========================================================
    */

    colorOptions.forEach(button => {

        button.addEventListener("click", () => {

            const variantId =
                button.dataset.variantId;


            selectedVariant = variants.find(
                variant =>
                    variant._id.toString() === variantId
            );


            if (!selectedVariant) {
                return;
            }


            /*
            -------------------------
            SELECTED COLOR
            -------------------------
            */

            colorOptions.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");


            /*
            -------------------------
            UPDATE EVERYTHING
            -------------------------
            */

           updateImages(selectedVariant);

            updatePrice(selectedVariant);

            updateStock(selectedVariant);

            quantity = 1;
            quantityElement.textContent = quantity;

        });

    });


    /*
    =========================================================
    INITIAL LOAD
    =========================================================
    */

    if (selectedVariant) {

        updateImages(selectedVariant);

        updatePrice(selectedVariant);

        updateStock(selectedVariant);
    }

});


