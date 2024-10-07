document.getElementById('profile-icon').addEventListener('click', function() {
    document.getElementById('sidebar').style.width = '300px';
    document.getElementById('overlay').style.display = 'block';
});

document.getElementById('close-sidebar').addEventListener('click', function() {
    document.getElementById('sidebar').style.width = '0';
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('overlay').addEventListener('click', function() {
    document.getElementById('sidebar').style.width = '0';
    document.getElementById('overlay').style.display = 'none';
});