// const form = document.getElementById("signupForm");

// const nameInput = document.getElementById("name");
// const emailInput = document.getElementById("email");
// const phoneInput = document.getElementById("phone");
// const passwordInput = document.getElementById("password");
// const confirmPasswordInput = document.getElementById("confirmPassword");

// =======================
// Show / Hide Password
// =======================

document.querySelectorAll(".toggle-password").forEach(icon => {

    icon.addEventListener("click", function () {

        const input = this.previousElementSibling;

        if (input.type === "password") {
            input.type = "text";
            this.classList.replace("bi-eye-slash", "bi-eye");
        } else {
            input.type = "password";
            this.classList.replace("bi-eye", "bi-eye-slash");
        }

    });

});

// // =======================
// // Validation
// // =======================

// form.addEventListener("submit", function (e) {

//     let errors = [];

//     // Name
//     const name = nameInput.value.trim();

//     if (name.length < 3) {
//         errors.push("Name must contain at least 3 characters.");
//     }

//     // Email
//     const email = emailInput.value.trim();

//     const emailRegex =
//         /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailRegex.test(email)) {
//         errors.push("Please enter a valid email address.");
//     }

//     // Phone
//     const phone = phoneInput.value.trim();

//     const phoneRegex =
//         /^[6-9]\d{9}$/;

//     if (!phoneRegex.test(phone)) {
//         errors.push("Please enter a valid 10-digit mobile number.");
//     }

//     // Password
//     const password = passwordInput.value;

//     const passwordRegex =
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//     if (!passwordRegex.test(password)) {

//         errors.push(
//             "Password must be at least 8 characters with uppercase, lowercase, number and special character."
//         );

//     }

//     // Confirm Password

//     if (password !== confirmPasswordInput.value) {

//         errors.push("Passwords do not match.");

//     }

//     // Display Errors

//     if (errors.length > 0) {

//         e.preventDefault();

//         alert(errors.join("\n"));

//     }

// });