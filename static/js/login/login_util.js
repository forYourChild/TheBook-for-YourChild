(function() {
    const togglePassword = document.getElementById("toggle-password");
    const passwordField = document.getElementById("password");

    // Toggle password visibility
    togglePassword.addEventListener("click", function() {
        const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
        passwordField.setAttribute("type", type);
        this.textContent = type === "password" ? "visibility" : "visibility_off";
    });

    // Toggle effect for email and password inputs
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    emailInput.addEventListener("focus", function() {
        document.getElementById("email-group").classList.add("active");
    });

    emailInput.addEventListener("blur", function() {
        document.getElementById("email-group").classList.remove("active");
    });

    passwordInput.addEventListener("focus", function() {
        document.getElementById("password-group").classList.add("active");
    });

    passwordInput.addEventListener("blur", function() {
        document.getElementById("password-group").classList.remove("active");
    });
})();