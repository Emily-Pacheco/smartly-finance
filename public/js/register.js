document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('error-message');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        firstName, 
                        lastName, 
                        email, 
                        phone, 
                        password 
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    errorMessage.textContent = 'Registration successful! Redirecting to login...';
                    errorMessage.style.color = 'green';
                    errorMessage.style.display = 'block';
                    
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    errorMessage.textContent = data.error || 'Registration failed';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:',error);
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }
});