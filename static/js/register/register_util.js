// Variables to track condition states
let isNameValid = false;
let isEmailValid = false;
let isEmailVerified = false;
let isPasswordValid = false;
let isPasswordConfirmed = false;

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

// Event listener for showing the popup and starting the timer
sendVerificationCodeBtn.addEventListener('click', function () {
    verificationPopup.style.display = 'flex';
    const email = document.getElementById('email').value;
    
    // 타이머가 이미 있으면 초기화하고 새로운 타이머 시작
    if (timerInterval) {
        clearInterval(timerInterval);  // 기존 타이머를 초기화
    }
    
    isEmailVerified = true;
    
    updateRegisterButtonState();
    SendVerificationCodetoEmail(email);
});

// Function to post email verification
function SendVerificationCodetoEmail(email) {
    const postData = {
        method : 'POST',
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body : new URLSearchParams({
            'email' : email,
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
                // 타이머 시작 및 입력 필드로 이동
            } else if (data.resultCode === 409) {
                // 이미 가입된 이메일인 경우
                verificationPopup.style.display = 'none';
                alert(data.resultMsg);
                // 가입된 이메일 메시지를 표시하고, 다른 이메일을 입력하게 함
                document.getElementById('email-notification').innerText = 'The account is already subscribed.'
            } else if (data.resultCode === 500) {
                // 서버에서 오류가 발생한 경우
                verificationPopup.style.display = 'none';
                alert(data.resultMsg);
                // 사용자가 재시도할 수 있게 안내
            } else if (data.resultCode === 401) {
                // 이메일 전송이 실패한 경우
                verificationPopup.style.display = 'none';
                alert(data.resultMsg);
                // 사용자가 다시 시도할 수 있게 안내
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
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
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            isEmailVerified = true;
            alert(data.resultMsg);
            verificationPopup.style.display = 'none';
        } else {
            isEmailVerified = false;
            alert(data.resultMsg);
        }
        updateRegisterButtonState();
    })
    .catch(error => {
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
        if (input.value.length === 1) {
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        } else if (input.value.length === 0 && index > 0) {
            inputs[index - 1].focus();
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
    }
});
