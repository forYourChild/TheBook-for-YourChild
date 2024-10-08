(function() {
    let isEmailValid = false;
    let isPasswordValid = false;

    const loginBtn = document.getElementById('login-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const next = new URLSearchParams(window.location.search).get("next");
    const value = new URLSearchParams(window.location.search).get("value");

    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    // Function to validate email input
    function validateEmail() {
        const email = emailInput.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(email)) {
            isEmailValid = true;
            document.getElementById('email-group').style.border= ''; // Remove red border if valid
        } else {
            isEmailValid = false;
        }
    }

    // Function to validate password input
    function validatePassword() {
        if (passwordInput.value.trim() !== '') {
            isPasswordValid = true;
            document.getElementById('password-group').style.border = ''; // Remove red border if valid
        } else {
            isPasswordValid = false;
        }
    }

    // Add event listeners for real-time validation
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);

    // Check validation on login button click
    loginBtn.addEventListener('click', function(e) {
        let hasError = false; // Track if there are any validation errors

        // Validate email and password again before submission
        validateEmail();
        validatePassword();

        if (!isEmailValid) {
            hasError = true;
            document.getElementById('email-group').style.border = '2px solid red';
        }

        if (!isPasswordValid) {
            hasError = true;
            document.getElementById('password-group').style.border = '2px solid red';
        }

        // Prevent form submission if there's an error
        if (hasError) {
            e.preventDefault(); // Stop form submission
        } else {
            loginPost(); // Proceed to login
        }
    });

    function loginPost() {
        const email = emailInput.value;
        const password = passwordInput.value;

        // Send login request to the server
        fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-TOKEN': getCSRFToken()  // Assuming CSRF token handling
            },
            body: new URLSearchParams({
                'email': email,
                'password': password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.resultCode === 200) {
                // next 파라미터가 있으면 해당 URL로 리디렉션, 없으면 value 처리
                if (next) {
                    window.location.href = next;  // next 파라미터가 있는 경우 해당 URL로 리디렉션
                } else if (value === 'createpage') {
                    window.location.href = '/childlist';  // value가 'createpage'이면 해당 페이지로 이동
                } else {
                    window.location.href = '/';  // 기본적으로 홈으로 리디렉션
                }
            } else {
                alert(data.resultMsg || 'Login failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    }
})();
