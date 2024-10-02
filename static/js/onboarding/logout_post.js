// CSRF 토큰 가져오는 함수
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCSRFToken()  // CSRF 보호를 위한 토큰 처리
        },
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/';  // 로그아웃 후 메인페이지로 이동
        } else {
            alert('Logout failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
});
