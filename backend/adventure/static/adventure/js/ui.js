function togglePasswordVisibility(button) {
    const input = button.previousElementSibling;
    if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈";
    } else {
        input.type = "password";
        button.textContent = "👁️";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navWrapper = document.getElementById('nav-wrapper');
    if (menuToggle && navWrapper) {
        menuToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('show');
            menuToggle.classList.toggle('active');
        });
    }
});