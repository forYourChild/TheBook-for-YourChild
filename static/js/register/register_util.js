// Variables to track condition states
let isNameValid = false;
let isEmailValid = false;
let isEmailVerified = false;
let isPasswordValid = false;
let isPasswordConfirmed = false;
let resendCooldown = 180;
let resendTimer = null;

// Store the previously verified email for comparison
let previousVerifiedEmail = '';

// CSRF 토큰을 가져오기 위한 함수
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// Initially disable the register button
const registerBtn = document.querySelector('.register-btn');
registerBtn.disabled = true;

// Function to update the state of the register button
function updateRegisterButtonState() {
    if (isNameValid && isEmailValid && isEmailVerified && isPasswordValid && isPasswordConfirmed) {
        registerBtn.disabled = false;
        registerBtn.classList.remove('disabled');
    } else {
        registerBtn.disabled = false;  // Make sure the button is clickable, but will show errors
        registerBtn.classList.add('disabled');
    }
}
updateRegisterButtonState()

// Name input validation
const nameInput = document.getElementById('name');
nameInput.addEventListener('input', function () {
    if (this.value.trim() !== '') {
        isNameValid = true;
        this.style.border = ''; // Remove red border if valid
    } else {
        isNameValid = false;
    }
    updateRegisterButtonState();
});

// Add an event listener for email input to show the "Send Verification Code" button
const emailInput = document.getElementById('email');
emailInput.addEventListener('input', function () {
    const email = this.value;
    const sendVerificationCodeBtn = document.getElementById('send-verification-code-btn');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Show the button if the email is valid, otherwise hide it
    if (emailRegex.test(email)) {
        sendVerificationCodeBtn.style.display = 'inline-flex';
        isEmailValid = true;
    } else {
        sendVerificationCodeBtn.style.display = 'none';
        isEmailValid = false;
    }
    // If the email has been changed after verification, force the user to verify again
    if (isEmailVerified && email !== previousVerifiedEmail) {
        isEmailVerified = false;  // Reset the verification status
    }
    
    updateRegisterButtonState();
});

// Email verification popup logic
const verificationPopup = document.getElementById('verification-popup');
const sendVerificationCodeBtn = document.getElementById('send-verification-code-btn');
const verifyCodeBtn = document.getElementById('verify-code-btn');

let timerInterval = null;
// Function to start the timer for 10 minutes (600 seconds)
function startTimer(duration, display) {
    // 기존 타이머가 실행 중이면 초기화
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    let timer = duration, minutes, seconds;
    timerInterval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);  // 타이머 종료
            display.textContent = "Time's up!";
        }
    }, 1000);
}

// Function to reset the verification inputs and timer
function resetVerificationPopup() {
    // Reset all the code inputs
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach(input => {
        input.value = ''; // Clear the input
    });

    // Reset the timer display
    const timerDisplay = document.getElementById('timer');
    timerDisplay.textContent = 'The email is being sent.'; // Clear the timer display

    // Stop the timer
    if (timerInterval) {
        clearInterval(timerInterval);  // Clear any running timer
        timerInterval = null;  // Reset the timer interval reference
    }

    // Hide the verification popup
    verificationPopup.style.display = 'none';
}

// Event listener for showing the popup and starting the timer
sendVerificationCodeBtn.addEventListener('click', function () {
    verificationPopup.style.display = 'flex';
    const email = document.getElementById('email').value;
    
    // 타이머가 이미 있으면 초기화하고 새로운 타이머 시작
    if (timerInterval) {
        clearInterval(timerInterval);  // 기존 타이머를 초기화
    }
    
    updateRegisterButtonState();
    SendVerificationCodetoEmail(email);
});

// Function to post email verification
function SendVerificationCodetoEmail(email, isResend = false) {
    const postData = {
        method : 'POST',
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body : new URLSearchParams({
            'email' : email,
            'resend': isResend 
        })
    };
    fetch('/auth/send_verification', postData)
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            // 인증 코드가 성공적으로 전송된 경우
            const startTime = data.start_time;
            const expiresIn = data.expires_in;

            // 현재 시간을 기준으로 남은 시간을 계산
            const currentTime = Math.floor(Date.now() / 1000); // 현재 클라이언트의 UNIX 타임스탬프
            const remainingTime = expiresIn - (currentTime - startTime);

            // 타이머를 시작
            const display = document.getElementById('timer');
            startTimer(remainingTime, display);

            previousVerifiedEmail = email;
            sendVerificationCodeBtn.style.display = 'none'; // 버튼을 숨김

        } else if (data.resultCode === 409) {
            // 이미 가입된 이메일인 경우
            verificationPopup.style.display = 'none';
            alert(data.resultMsg);
            
        } else if (data.resultCode === 500) {
            // 서버 오류가 발생한 경우
            verificationPopup.style.display = 'none';
            alert(data.resultMsg);
            // 오류 메시지를 표시하고 재시도할 수 있게 유도

        } else if (data.resultCode === 401) {
            // 인증코드가 불일치일 경우
            verificationPopup.style.display = 'none';
            alert(data.resultMsg);
            const codeInputs = document.querySelectorAll('.code-input');
            codeInputs.forEach(input => {
                input.value = ''; // Clear the input
            });
        } else if (data.resultCode === 410) {
            // 인증 코드가 만료된 경우
            alert('Your verification code has expired. Please request a new one.');
            // 사용자에게 새로운 인증 코드를 요청하도록 안내
        }
        else if (data.resultCode === 429) {
            verificationPopup.style.display = 'none';
            alert(data.resultMsg);  // Show the message if they need to wait longer
        }
    })
    .catch(error => {
        console.error('Error:', error);
        verificationPopup.style.display = 'none';
        alert('An error occurred. Please try again.');
    });
}

// Event listener for resending the verification code
document.getElementById('resend-verification').addEventListener('click', function () {
    const email = document.getElementById('email').value;
    
    fetch('/auth/send_verification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'email': email,
            'resend': 'true'  // Indicates that this is a resend request
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            alert(data.resultMsg);
            handleResendButtonCooldown();  // Start the cooldown timer after a successful resend
            // 타이머를 시작
            const display = document.getElementById('timer');
            startTimer(remainingTime, display);
        } else if (data.resultCode === 429) {
            alert(data.resultMsg);  // Show the message if they need to wait longer
        } else {
            alert('An error occurred. Please try again.');
        }
    })
    .catch(error => {
        verificationPopup.style.display = 'none';
        console.error('Error:', error);
    });
});

// Function to handle the resend button state and cooldown
function handleResendButtonCooldown() {
    const resendBtn = document.getElementById('resend-verification-btn');
    
    let cooldownTime = resendCooldown;
    
    resendTimer = setInterval(function () {
        cooldownTime--;
        resendBtn.textContent = `Resend available in ${cooldownTime} seconds`;

        if (cooldownTime <= 0) {
            clearInterval(resendTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend Verification Code";
        }
    }, 1000);
}

verifyCodeBtn.addEventListener('click', function () {
    const email = document.getElementById('email').value;
    const code = Array.from(document.querySelectorAll('.code-input')).map(input => input.value).join('');

    postVerificationCode(email, code)
});


function postVerificationCode(email, code) {
    fetch('/auth/enter_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'email': email,
            'verification_code': code
        })
    })
    .then(response => response.json())  // 응답을 JSON으로 파싱
    .then(data => {
        if (data.resultCode === 200) {
            // 인증 성공
            isEmailVerified = true;
            alert(data.resultMsg);  // 성공 메시지 출력
            verificationPopup.style.display = 'none';  // 팝업 닫기
            resetVerificationPopup();  // 인증 코드 입력 필드와 타이머 초기화

        } else if (data.resultCode === 409) {
            // 이미 가입된 이메일
            verificationPopup.style.display = 'none';
            alert(data.resultMsg);  // 중복된 이메일 경고 메시지

        } else if (data.resultCode === 500) {
            // 서버 오류
            verificationPopup.style.display = 'none';
            alert('An internal server error occurred. Please try again later.');
            // 사용자에게 다시 시도할 수 있는 메시지 안내

        } else if (data.resultCode === 401) {
            // 인증 코드 불일치
            alert(data.resultMsg);  // 인증 코드 불일치 경고
            const codeInputs = document.querySelectorAll('.code-input');
            codeInputs.forEach(input => {
                input.value = '';  // 입력 필드 초기화
            });

        } else if (data.resultCode === 410) {
            // 인증 코드 만료
            alert('Your verification code has expired. Please request a new one.');
            // 사용자에게 새 인증 코드 요청을 안내
        }
    })
    .catch(error => {
        verificationPopup.style.display = 'none';
        console.error('Error:', error);
    });
}

// Password visibility toggle
const togglePassword = document.getElementById('toggle-password');
togglePassword.addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
toggleConfirmPassword.addEventListener('click', function() {
    const confirmPasswordField = document.getElementById('confirm-password');
    const type = confirmPasswordField.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordField.setAttribute('type', type);
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

// Password validation (length, special character, and match check)
document.getElementById('password').addEventListener('input', validatePassword);
document.getElementById('confirm-password').addEventListener('input', validatePassword);

function validatePassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const minLengthCheck = document.getElementById('min-length');
    const specialCharCheck = document.getElementById('special-char');
    const passwordMatchCheck = document.getElementById('password-match');

    // Check for length
    if (password.length >= 10) {
        minLengthCheck.classList.add('valid');
        minLengthCheck.classList.remove('invalid');
        minLengthCheck.querySelector('.check-symbol').textContent = 'O';
        isPasswordValid = true;
    } else {
        minLengthCheck.classList.add('invalid');
        minLengthCheck.classList.remove('valid');
        minLengthCheck.querySelector('.check-symbol').textContent = 'X';
        isPasswordValid = false;
    }

    // Check for special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharRegex.test(password)) {
        specialCharCheck.classList.add('valid');
        specialCharCheck.classList.remove('invalid');
        specialCharCheck.querySelector('.check-symbol').textContent = 'O';
        isPasswordValid = true;
    } else {
        specialCharCheck.classList.add('invalid');
        specialCharCheck.classList.remove('valid');
        specialCharCheck.querySelector('.check-symbol').textContent = 'X';
        isPasswordValid = false;
    }

    // Check if passwords match
    if (password === confirmPassword && confirmPassword !== '') {
        passwordMatchCheck.classList.add('valid');
        passwordMatchCheck.classList.remove('invalid');
        passwordMatchCheck.querySelector('.check-symbol').textContent = 'O';
        isPasswordConfirmed = true;
    } else {
        passwordMatchCheck.classList.add('invalid');
        passwordMatchCheck.classList.remove('valid');
        passwordMatchCheck.querySelector('.check-symbol').textContent = 'X';
        isPasswordConfirmed = false;
    }

    updateRegisterButtonState();
}

const inputs = document.querySelectorAll('.code-input');

inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const inputVal = input.value;
        if (!/^\d$/.test(inputVal)) {
            input.value = ''; // 숫자가 아닌 값이면 입력을 비움
        } else {
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus(); // 다음 칸으로 포커스 이동
            }
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === "Backspace" && input.value.length === 0 && index > 0) {
            inputs[index - 1].focus();
        }
    });

    // Handle paste event to distribute pasted content across inputs
    input.addEventListener('paste', (e) => {
        e.preventDefault(); // 기본 동작 방지
        const pasteData = e.clipboardData.getData('text').trim(); // 클립보드에서 텍스트 데이터 가져오기
        const pasteArray = pasteData.split(''); // 각 글자를 배열로 분리

        // 붙여넣은 데이터를 현재 인덱스부터 나머지 칸에 순차적으로 채움
        pasteArray.forEach((char, i) => {
            if (index + i < inputs.length) {
                inputs[index + i].value = char; // 칸에 글자를 채움
            }
        });

        // 마지막으로 채워진 칸으로 포커스 이동
        const lastIndex = Math.min(index + pasteArray.length - 1, inputs.length - 1);
        inputs[lastIndex].focus();
    });
});


// When the user clicks the register button
document.querySelector('.register-btn').addEventListener('click', function (e) {
    let hasError = false; // Track if there are any validation errors

    // Check Name Field
    if (!isNameValid) {
        document.getElementById('name-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('name-group').style.border = '';
    }

    // Check Email Field
    if (!isEmailValid) {
        document.getElementById('email-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('email-group').style.border = '';
    }

    // Check Email Verification
    if (!isEmailVerified) {
        document.getElementById('email-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('email-group').style.border = '';
    }

    // Check Password Field
    if (!isPasswordValid) {
        document.getElementById('password-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('password-group').style.border = '';
    }

    // Check Confirm Password Field
    if (!isPasswordConfirmed) {
        document.getElementById('confirm-password-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('confirm-password-group').style.border = '';
    }

    // Prevent submission if any condition is not met
    if (hasError) {
        e.preventDefault(); // Stop form submission
    }else{
        sendSignUpPost();
    }
});

function sendSignUpPost() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    fetch('/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'name': name,
            'email': email,
            'password': password,
            'confirmPassword': confirmPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        // Handle response based on status code
        if (data.resultCode === 200) {
            // Successful signup
            alert('Registration successful! Redirecting to login page...');
            window.location.href = '/login';  // Redirect to login page
        } else if (data.resultCode === 400) {
            // Bad request (e.g., missing or invalid inputs)
            alert(data.resultMsg || 'Invalid request. Please check your input.');
        } else if (data.resultCode === 409) {
            // Conflict (email already registered)
            alert(data.resultMsg || 'Email is already registered.');
        } else if (data.resultCode === 500) {
            // Internal server error
            alert('An internal server error occurred. Please try again later.');
        } else {
            // Catch-all for unexpected errors
            alert('An unexpected error occurred. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('A network error occurred. Please try again later.');
        verificationPopup.style.display = 'none';
    });    
};
