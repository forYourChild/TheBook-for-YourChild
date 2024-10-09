// Function to check login status via a fetch GET request
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function checkLoginStatus() {
    fetch('/auth/check_login_status', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_logged_in) {
            // If the user is logged in, hide login button and show profile and logout buttons
            document.getElementById('user-name').textContent = data.user_name;
        }
    })
    .catch(error => {
        console.error('Error fetching login status:', error);
    });
}

// Call the function to check login status when the page loads
window.onload = checkLoginStatus;
