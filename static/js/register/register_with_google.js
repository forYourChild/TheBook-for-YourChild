const googleLoginBtn = document.getElementById("google-login-btn");

googleLoginBtn.addEventListener("click", function() {
    window.location.href = "http://localhost:5000/auth/google-login";
});