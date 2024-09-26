// 이메일 중복 체크 (서버로 AJAX 요청)
document.getElementById("email").addEventListener("input", function() {
    const email = this.value;
    const emailError = document.getElementById("email-error");

    if (email.length > 0) {
        fetch(`/check-email?email=${email}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                emailError.textContent = "This email is already taken.";
            } else {
                emailError.textContent = "";
            }
        })
        .catch(error => console.error("Error:", error));
    }
});