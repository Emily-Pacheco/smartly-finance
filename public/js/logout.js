document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('user');
            
            window.location.href = '/login';
            
            console.log('User logged out successfully');
        });
    }
});