// Variables to track condition states
let isEmailValid = false;
let isEmailVerified = false;
let isPasswordValid = false;
let isPasswordConfirmed = false;
let hasError = true;
let resendCooldown = 15;  // 재전송 쿨다운(초 단위)
let resendTimer = null;  // 타이머 관리 변수
let previousVerifiedEmail = '';  // 인증된 이메일 저장
let isResend = false;  // 재전송 여부
let timerInterval;  // 타이머 관리 변수는 함수 바깥에서 선언

// CSRF 토큰을 가져오기 위한 함수
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// 이메일 검증 및 인증 코드 발송
const emailInput = document.getElementById("email");
const sendVerificationCodeBtn = document.getElementById("send-verification-code-btn");4
const emailInputBox = document.getElementById('email-input-box')
const verificationPopup = document.getElementById("verification-popup");
const resetPasswordBox = document.getElementById("reset-password-box");
const togglePassword = document.getElementById('toggle-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
const resetPasswordBtn = document.getElementById('reset-password-btn')

togglePassword.addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

toggleConfirmPassword.addEventListener('click', function() {
    const passwordField = document.getElementById('confirm-password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

emailInput.addEventListener('input', function () {
    const email = this.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email)) {
        sendVerificationCodeBtn.style.display = 'inline-flex';
        isEmailValid = true;
    } else {
        sendVerificationCodeBtn.style.display = 'none';
        isEmailValid = false;
    }
    
    // 이메일이 변경된 경우, 재전송 상태로 전환
    if (email !== previousVerifiedEmail) {
        isResend = false;  // 이메일이 변경되면 재전송 여부를 초기화
    }
});

// 인증 코드 발송 버튼 클릭 이벤트
sendVerificationCodeBtn.addEventListener('click', function () {
    const email = emailInput.value;
    verificationPopup.style.display = 'flex';

    // 재전송 여부 설정
    isResend = email === previousVerifiedEmail;

    // 서버로 인증 코드 요청
    sendVerificationCodeToEmail(email, isResend);
});

// 인증 코드 발송 요청 함수
function sendVerificationCodeToEmail(email, isResend = false) {
    fetch('/auth/send_verification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'email': email,
            'resend': isResend,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            previousVerifiedEmail = email;  // 성공적으로 인증 코드를 보냈을 때, 이전 이메일로 설정
            startTimer(600, document.getElementById('timer'));  // 타이머 시작
            handleResendButtonCooldown();  // 재전송 버튼 쿨다운 처리
        } else {
            codeInputs.forEach(input => {
                input.value = '';  // 입력 필드 초기화
            });
            alert('Failed to send verification code.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
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

// 인증 코드 입력 후 검증
document.getElementById('verify-code-btn').addEventListener('click', function () {
    const email = emailInput.value;
    const code = Array.from(document.querySelectorAll('.code-input')).map(input => input.value).join('');

    fetch('/auth/enter_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'email': email,
            'verification_code': code,
            'action_type' : 'reset_password'
            
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            verificationPopup.style.display = 'none';
            resetPasswordBox.style.display = 'block';
            emailInputBox.style.display = 'none';
        } else {
            alert('Invalid verification code.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
});

function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    
    // 기존 타이머가 실행 중이면 중지
    clearInterval(timerInterval);  
    
    // 새로운 타이머 시작
    timerInterval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);
            display.textContent = "Time's up!";
        }
    }, 1000);
}

// 재전송 쿨다운 처리 함수
function handleResendButtonCooldown() {
    const resendBtn = document.getElementById('resend-verification');
    let cooldownTime = resendCooldown;

    resendBtn.disabled = true;  // 재전송 버튼 비활성화
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

// 인증 코드 재전송 버튼 클릭 이벤트
document.getElementById('resend-verification').addEventListener('click', function () {
    const email = emailInput.value;
    sendVerificationCodeToEmail(email, true);  // 재전송 요청
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

    updateChangePasswordButtonState();
}

// Function to update the state of the ChangePassword button
function updateChangePasswordButtonState() {
    if (isPasswordValid && isPasswordConfirmed) {
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.classList.remove('disabled');
    } else {
        resetPasswordBtn.disabled = false;  // Make sure the button is clickable, but will show errors
        resetPasswordBtn.classList.add('disabled');
    }
}
window.onload = updateChangePasswordButtonState;

// 비밀번호 재설정 요청
resetPasswordBtn.addEventListener('click', function (e) {
    // Check Password Field
    if (!isPasswordValid) {
        document.getElementById('password-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('password-group').style.border = '';
        hasError = false;
    }

    // Check Confirm Password Field
    if (!isPasswordConfirmed) {
        document.getElementById('confirm-password-group').style.border = '2px solid red';
        hasError = true;
    } else {
        document.getElementById('confirm-password-group').style.border = '';
        hasError = false;
    }

    // Prevent submission if any condition is not met
    if (hasError) {
        e.preventDefault(); // Stop form submission
    }else{
        sendChagePasswordPost();
    }
});

function sendChagePasswordPost() {
    const email = emailInput.value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    fetch('/setting/resetpassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': getCSRFToken()
        },
        body: new URLSearchParams({
            'email': email,
            'password': password,
            'confirmPassword': confirmPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.resultCode === 200) {
            alert('Password reset successful. Redirecting to login...');
            window.location.href = '/login';
        } else {
            alert('Failed to reset password.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}