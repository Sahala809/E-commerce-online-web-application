function showToast(message, type = "success") {

    const toastElement = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastTitle || !toastMessage) {
        console.error("Toast elements not found!");
        return;
    }

    toastMessage.textContent = message;

    toastElement.classList.remove(
        "text-bg-success",
        "text-bg-danger"
    );

    if (type === "success") {

        toastTitle.textContent = "Success";

        toastElement.classList.add("text-bg-success");

    } else {

        toastTitle.textContent = "Error";

        toastElement.classList.add("text-bg-danger");
    }

    const toast = bootstrap.Toast.getOrCreateInstance(
        toastElement,
        {
            delay: 3000
        }
    );

    toast.show();
}