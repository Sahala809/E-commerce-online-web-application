document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // OTP INPUT BOXES
    // ========================================

    const boxes = document.querySelectorAll(".otp");
    const fullOtp = document.getElementById("fullOtp");

    boxes.forEach((box, index) => {

        box.addEventListener("input", () => {

            box.value = box.value.replace(/\D/g, "");

            if (
                box.value.length === 1 &&
                index < boxes.length - 1
            ) {
                boxes[index + 1].focus();
            }

            fullOtp.value = [...boxes]
                .map(input => input.value)
                .join("");
        });


        box.addEventListener("keydown", (e) => {

            if (
                e.key === "Backspace" &&
                !box.value &&
                index > 0
            ) {
                boxes[index - 1].focus();
            }

        });

    });


    // ========================================
    // TIMER ELEMENTS
    // ========================================

    const timer =
        document.getElementById("timer");

    const resend =
        document.getElementById("resendArea");


    if (!timer || !resend) {
        return;
    }


    // ========================================
    // SERVER VALUES
    // ========================================

    const expiresAt =
        Number(timer.dataset.expiresAt);

    const otpExpired =
        timer.dataset.expired === "true";


    // ========================================
    // EXPIRED / INVALID EXPIRY
    // ========================================

    if (
        otpExpired ||
        !expiresAt
    ) {

        timer.style.display = "none";
        resend.style.display = "block";

        return;
    }


    // ========================================
    // START TIMER
    // ========================================

    resend.style.display = "none";
    timer.style.display = "block";


    let timerInterval;


    const updateTimer = () => {

        const remaining = Math.max(
            0,
            Math.floor(
                (expiresAt - Date.now()) / 1000
            )
        );


        const minutes =
            Math.floor(remaining / 60);

        const seconds =
            remaining % 60;


        timer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


        if (remaining <= 0) {

            clearInterval(timerInterval);

            timer.style.display = "none";
            resend.style.display = "block";
        }

    };


    // First update immediately
    updateTimer();


    // Continue every second
    timerInterval =
        setInterval(updateTimer, 1000);

});