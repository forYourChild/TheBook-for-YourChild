// Password visibility toggle for both password and confirm password fields
document.getElementById('toggle-password').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

document.getElementById('toggle-confirm-password').addEventListener('click', function() {
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
        minLengthCheck.querySelector('.check-symbol').textContent = '✔️';
    } else {
        minLengthCheck.classList.add('invalid');
        minLengthCheck.classList.remove('valid');
        minLengthCheck.querySelector('.check-symbol').textContent = '❌';
    }

    // Check for special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharRegex.test(password)) {
        specialCharCheck.classList.add('valid');
        specialCharCheck.classList.remove('invalid');
        specialCharCheck.querySelector('.check-symbol').textContent = '✔️';
    } else {
        specialCharCheck.classList.add('invalid');
        specialCharCheck.classList.remove('valid');
        specialCharCheck.querySelector('.check-symbol').textContent = '❌';
    }

    // Check if passwords match
    if (password === confirmPassword && confirmPassword !== '') {
        passwordMatchCheck.classList.add('valid');
        passwordMatchCheck.classList.remove('invalid');
        passwordMatchCheck.querySelector('.check-symbol').textContent = '✔️';
    } else {
        passwordMatchCheck.classList.add('invalid');
        passwordMatchCheck.classList.remove('valid');
        passwordMatchCheck.querySelector('.check-symbol').textContent = '❌';
    }
}
