// ===== EMAILJS CONFIGURATION =====
// Replace these with your actual EmailJS credentials
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'ucJRASZmaHJuXZu5W', // Replace with your EmailJS Public Key
    SERVICE_ID: 'service_3y1p216', // Replace with your EmailJS Service ID
    TEMPLATE_ID: 'template_nhfb8rb' // Replace with your EmailJS Template ID
};

// ===== DOM ELEMENTS =====
const themeToggle = document.querySelector('.theme-toggle');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.getElementById('contactForm');
const html = document.documentElement;
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const formMessage = document.getElementById('formMessage');

// ===== FORM VALIDATION =====
function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Validate name
    const name = document.getElementById('name');
    if (!name.value.trim()) {
        showError('nameError', 'Name is required');
        name.classList.add('error');
        isValid = false;
    } else if (name.value.length < 2) {
        showError('nameError', 'Name must be at least 2 characters');
        name.classList.add('error');
        isValid = false;
    } else {
        name.classList.add('success');
    }
    
    // Validate email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        showError('emailError', 'Email is required');
        email.classList.add('error');
        isValid = false;
    } else if (!emailRegex.test(email.value)) {
        showError('emailError', 'Please enter a valid email address');
        email.classList.add('error');
        isValid = false;
    } else {
        email.classList.add('success');
    }
    
    // Validate subject
    const subject = document.getElementById('subject');
    if (!subject.value.trim()) {
        showError('subjectError', 'Subject is required');
        subject.classList.add('error');
        isValid = false;
    } else if (subject.value.length < 3) {
        showError('subjectError', 'Subject must be at least 3 characters');
        subject.classList.add('error');
        isValid = false;
    } else {
        subject.classList.add('success');
    }
    
    // Validate message
    const message = document.getElementById('message');
    if (!message.value.trim()) {
        showError('messageError', 'Message is required');
        message.classList.add('error');
        isValid = false;
    } else if (message.value.length < 10) {
        showError('messageError', 'Message must be at least 10 characters');
        message.classList.add('error');
        isValid = false;
    } else {
        message.classList.add('success');
    }
    
    return isValid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearErrors() {
    // Clear all error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    // Clear all error/success classes
    document.querySelectorAll('input, textarea').forEach(el => {
        el.classList.remove('error', 'success');
    });
    
    // Clear form message
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    formMessage.style.display = 'none';
}

function showFormMessage(type, message) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== EMAILJS FUNCTIONALITY =====
function initEmailJS() {
    // Initialize EmailJS with your public key
    if (EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
}

async function sendEmail(formData) {
    try {
        // Check if EmailJS is properly configured
        if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            throw new Error('Please configure EmailJS with your credentials');
        }
        
        // Send email using EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            formData
        );
        
        return response;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

// ===== FORM SUBMISSION HANDLER =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showFormMessage('error', 'Please fix the errors in the form');
        return;
    }
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        to_email: 'paultin844@gmail.com', // Your email
        from_name: document.getElementById('name').value,
        reply_to: document.getElementById('email').value,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        // Send email
        const response = await sendEmail(formData);
        
        // Show success message
        showFormMessage('success', 'Message sent successfully! I\'ll get back to you soon.');
        
        // Reset form
        contactForm.reset();
        clearErrors();
        
        // Log success (optional)
        console.log('Email sent successfully:', response);
        
    } catch (error) {
        // Show error message
        let errorMessage = 'Failed to send message. Please try again.';
        
        if (error.text) {
            // EmailJS specific error
            errorMessage = `Email service error: ${error.text}`;
        } else if (error.message.includes('configure')) {
            // Configuration error
            errorMessage = 'Email service is not configured. Please contact the website owner.';
        }
        
        showFormMessage('error', errorMessage);
        console.error('Form submission error:', error);
        
    } finally {
        // Reset button state
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// ===== REAL-TIME VALIDATION =====
function initRealTimeValidation() {
    const inputs = document.querySelectorAll('#contactForm input, #contactForm textarea');
    
    inputs.forEach(input => {
        // Validate on blur
        input.addEventListener('blur', () => {
            validateField(input);
        });
        
        // Remove error on focus
        input.addEventListener('focus', () => {
            const errorId = `${input.id}Error`;
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
            input.classList.remove('error');
        });
    });
}

function validateField(input) {
    const value = input.value.trim();
    const errorId = `${input.id}Error`;
    const errorElement = document.getElementById(errorId);
    
    if (!errorElement) return;
    
    // Clear previous error
    errorElement.classList.remove('show');
    input.classList.remove('error', 'success');
    
    // Validate based on field type
    switch(input.id) {
        case 'name':
            if (!value) {
                showError(errorId, 'Name is required');
                input.classList.add('error');
            } else if (value.length < 2) {
                showError(errorId, 'Name must be at least 2 characters');
                input.classList.add('error');
            } else {
                input.classList.add('success');
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                showError(errorId, 'Email is required');
                input.classList.add('error');
            } else if (!emailRegex.test(value)) {
                showError(errorId, 'Please enter a valid email address');
                input.classList.add('error');
            } else {
                input.classList.add('success');
            }
            break;
            
        case 'subject':
            if (!value) {
                showError(errorId, 'Subject is required');
                input.classList.add('error');
            } else if (value.length < 3) {
                showError(errorId, 'Subject must be at least 3 characters');
                input.classList.add('error');
            } else {
                input.classList.add('success');
            }
            break;
            
        case 'message':
            if (!value) {
                showError(errorId, 'Message is required');
                input.classList.add('error');
            } else if (value.length < 10) {
                showError(errorId, 'Message must be at least 10 characters');
                input.classList.add('error');
            } else {
                input.classList.add('success');
            }
            break;
    }
}

// ===== THEME TOGGLE =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 150);
}

// ===== MOBILE NAVIGATION =====
function toggleMobileMenu() {
    navLinks.classList.toggle('active');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-times');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    navLinks.classList.remove('active');
    mobileMenuBtn.querySelector('i').classList.remove('fa-times');
    mobileMenuBtn.querySelector('i').classList.add('fa-bars');
    document.body.style.overflow = '';
}

// ===== SMOOTH SCROLLING =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                closeMobileMenu();
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== INITIALIZE EVERYTHING =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();
    
    // Initialize EmailJS
    initEmailJS();
    
    // Initialize real-time validation
    initRealTimeValidation();
    
    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && 
            !mobileMenuBtn.contains(e.target) && 
            navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Initialize smooth scrolling
    initSmoothScroll();
    initHeaderScroll();
    initLazyLoading();
    initAnimations();
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .project-card, .skill, .contact-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .project-card.animate, .skill.animate, .contact-item.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});

// ===== VIEWPORT HEIGHT FIX =====
function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
setVH();

// ===== PERFORMANCE OPTIMIZATION =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle resize completion
    }, 250);
});