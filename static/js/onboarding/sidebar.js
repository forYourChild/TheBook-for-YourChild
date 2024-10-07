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