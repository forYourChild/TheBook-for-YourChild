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
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('profile-icon').style.display = 'inline-block';
            document.getElementById('user-name').textContent = data.user_name;
        } else {
            // If the user is not logged in, show the login button
            document.getElementById('login-btn').style.display = 'inline-block';
            document.getElementById('profile-icon').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error fetching login status:', error);
    });
}

// Open the sidebar
function openSidebar() {
    document.getElementById('sidebar').style.width = '250px';  // Set width to make sidebar visible
    document.getElementById('overlay').style.display = 'block';
}

// Close the sidebar
function closeSidebar() {
    document.getElementById('sidebar').style.width = '0';  // Set width to 0 to hide sidebar
    document.getElementById('overlay').style.display = 'none';
}

// Add event listeners
document.getElementById('profile-icon').addEventListener('click', openSidebar);
document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

// Call the function to check login status when the page loads
window.onload = checkLoginStatus;
