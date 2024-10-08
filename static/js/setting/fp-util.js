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
const sendVerificationCodeBtn = document.getElementById("send-verification-code-btn");
const emailInputBox = document.getElementById('email-input-box');
const verificationPopup = document.getElementById("verification-popup");
const resetPasswordBox = document.getElementById("reset-password-box");
const togglePassword = document.getElementById('toggle-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
const resetPasswordBtn = document.getElementById('reset-password-btn');

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

// 이메일 입력 시 유효성 검사
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

    if (email !== previousVerifiedEmail) {
        isResend = false;
    }
});

// 인증 코드 발송 버튼 클릭 이벤트
sendVerificationCodeBtn.addEventListener('click', function () {
    const email = emailInput.value;
    verificationPopup.style.display = 'flex';
    isResend = email === previousVerifiedEmail;
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
            previousVerifiedEmail = email;
            const currentTime = Math.floor(Date.now() / 1000);  // 현재 시간 (유닉스 타임스탬프)
            const expiresIn = data.expires_in - currentTime;  // 서버에서 받은 만료 시간에서 현재 시간을 뺀 값으로 남은 시간 계산

            if (expiresIn > 0) {
                startTimer(expiresIn, document.getElementById('timer'));  // 타이머 시작
                handleResendButtonCooldown();  // 재전송 버튼 쿨다운 처리
            } else {
                alert('The verification code has already expired.');
            }
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

// 인증 코드 입력 필드 및 포커스 처리
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

    // 붙여넣기 이벤트 처리
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        const pasteArray = pasteData.split('');

        pasteArray.forEach((char, i) => {
            if (index + i < inputs.length) {
                inputs[index + i].value = char;
            }
        });

        const lastIndex = Math.min(index + pasteArray.length - 1, inputs.length - 1);
        inputs[lastIndex].focus();
    });
});

// 인증 코드 검증 후 상태 전환
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
            'action_type': 'reset_password'
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
        minutes = Math.floor(timer / 60);
        seconds = timer % 60;

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

    resendBtn.disabled = true;
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
    sendVerificationCodeToEmail(email, true);
});

// 비밀번호 유효성 검사 및 확인
document.getElementById('password').addEventListener('input', validatePassword);
document.getElementById('confirm-password').addEventListener('input', validatePassword);

function validatePassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const minLengthCheck = document.getElementById('min-length');
    const specialCharCheck = document.getElementById('special-char');
    const passwordMatchCheck = document.getElementById('password-match');

    // 비밀번호 길이 확인
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

    // 특수 문자 확인
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

    // 비밀번호 일치 확인
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

// 비밀번호 변경 버튼 상태 업데이트
function updateChangePasswordButtonState() {
    if (isPasswordValid && isPasswordConfirmed) {
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.classList.remove('disabled');
    } else {
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.classList.add('disabled');
    }
}

// 비밀번호 재설정 요청
resetPasswordBtn.addEventListener('click', function (e) {
    if (!isPasswordValid || !isPasswordConfirmed) {
        e.preventDefault(); // 조건이 충족되지 않으면 제출을 막음
    } else {
        sendChangePasswordPost();
    }
});

function sendChangePasswordPost() {
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
