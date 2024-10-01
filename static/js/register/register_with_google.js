const googleLoginBtn = document.getElementById("google-login-btn");

googleLoginBtn.addEventListener("click", function() {
    window.location.href = "/auth/google-login";
});