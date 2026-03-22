// ===========================
// STATE
// ===========================
let authToken = localStorage.getItem('atlas_token');
let currentUser = JSON.parse(localStorage.getItem('atlas_user') || 'null');
let isLoginMode = true;

function clearAuthSession() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user');
    updateAuthUI();
}

function handleUnauthorizedResponse(message = 'Your session expired. Please login again.') {
    clearAuthSession();
    showNotification(message, 'error');
    openAuthModal();
}

async function validateStoredSession() {
    if (!authToken) return;

    try {
        const res = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!res.ok) {
            handleUnauthorizedResponse();
            return;
        }

        const data = await res.json();
        if (data.user) {
            currentUser = data.user;
            localStorage.setItem('atlas_user', JSON.stringify(data.user));
            updateAuthUI();
        }
    } catch (err) {
        // Keep existing token during temporary network issues.
    }
}

// ===========================
// MOBILE NAVIGATION TOGGLE
// ===========================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class when scrolling down
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ===========================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Allow plain "#" links to keep default behavior (jump to top)
        if (!href || href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        const doScroll = () => {
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        };

        // If mobile menu is open, close it first so layout settles, then scroll
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            setTimeout(doScroll, 220);
        } else {
            doScroll();
        }
    });
});

// ===========================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

function observeCards() {
    const animatedElements = document.querySelectorAll('.destination-card, .feature-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

observeCards();

// ===========================
// LOAD DESTINATIONS FROM API
// ===========================
async function loadDestinations() {
    const grid = document.getElementById('destinationsGrid');
    try {
        const res = await fetch('/api/destinations');
        const data = await res.json();

        grid.innerHTML = data.destinations.map(dest => `
            <div class="destination-card">
                <div class="card-image">
                    <img src="${dest.image}" alt="${dest.name}">
                    <div class="card-overlay">
                        <div class="card-content">
                            <h3 class="card-title">${dest.name}</h3>
                            <p class="card-description">${dest.description}</p>
                            <a href="#" class="card-link" onclick="openBookingModal('${dest.id}', '${dest.name.replace(/'/g, "\\'")}'); return false;">Book Now →</a>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-tag">${dest.tag_emoji} ${dest.tag}</span>
                    <span class="card-rating">★ ${dest.rating}</span>
                </div>
            </div>
        `).join('');

        observeCards();
    } catch (err) {
        // Fallback to static content if API unavailable
        grid.innerHTML = `
            <div class="destination-card">
                <div class="card-image">
                    <img src="assets/dest-1.jpg" alt="Santorini, Greece">
                    <div class="card-overlay">
                        <div class="card-content">
                            <h3 class="card-title">Santorini, Greece</h3>
                            <p class="card-description">Experience the iconic white-washed buildings and stunning sunsets</p>
                            <a href="#" class="card-link">Explore More →</a>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-tag">🌅 Romantic</span>
                    <span class="card-rating">★ 4.9</span>
                </div>
            </div>
            <div class="destination-card">
                <div class="card-image">
                    <img src="assets/dest-2.jpg" alt="Kyoto, Japan">
                    <div class="card-overlay">
                        <div class="card-content">
                            <h3 class="card-title">Kyoto, Japan</h3>
                            <p class="card-description">Immerse yourself in ancient temples and cherry blossom beauty</p>
                            <a href="#" class="card-link">Explore More →</a>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-tag">🏯 Cultural</span>
                    <span class="card-rating">★ 4.8</span>
                </div>
            </div>
            <div class="destination-card">
                <div class="card-image">
                    <img src="assets/dest-3.jpg" alt="African Safari">
                    <div class="card-overlay">
                        <div class="card-content">
                            <h3 class="card-title">African Safari</h3>
                            <p class="card-description">Witness majestic wildlife in their natural habitat</p>
                            <a href="#" class="card-link">Explore More →</a>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-tag">🦁 Adventure</span>
                    <span class="card-rating">★ 5.0</span>
                </div>
            </div>`;
        observeCards();
    }
}

// ===========================
// NEWSLETTER FORM HANDLING
// ===========================
const newsletterForm = document.getElementById('newsletterForm');

newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;

    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    try {
        const res = await fetch('/api/subscribers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
            showNotification('Thank you for subscribing!', 'success');
            emailInput.value = '';
        } else {
            showNotification(data.error || 'Subscription failed', 'error');
        }
    } catch (err) {
        showNotification('Thank you for subscribing!', 'success');
        emailInput.value = '';
    }
});

// ===========================
// CONTACT FORM HANDLING
// ===========================
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;

    if (!name || !email || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const res = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        const data = await res.json();

        if (res.ok) {
            showNotification('Message sent successfully!', 'success');
            contactForm.reset();
        } else {
            showNotification(data.error || 'Failed to send message', 'error');
        }
    } catch (err) {
        showNotification('Failed to send message. Please try again.', 'error');
    }
});

// ===========================
// BOOKING MODAL
// ===========================
function openBookingModal(destId, destName) {
    if (!authToken) {
        showNotification('Please login to book a trip', 'error');
        openAuthModal();
        return;
    }
    document.getElementById('bookingDestId').value = destId;
    document.getElementById('bookingDestName').textContent = destName;
    document.getElementById('bookingModal').classList.add('active');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

const bookingForm = document.getElementById('bookingForm');
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const destination_id = document.getElementById('bookingDestId').value;
    const travel_date = document.getElementById('bookingDate').value;
    const guests = parseInt(document.getElementById('bookingGuests').value);
    const notes = document.getElementById('bookingNotes').value;

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ destination_id, travel_date, guests, notes })
        });
        const data = await res.json();

        if (res.ok) {
            showNotification('Booking confirmed! We will be in touch.', 'success');
            closeBookingModal();
            bookingForm.reset();
        } else if (res.status === 401) {
            handleUnauthorizedResponse('Authentication error. Please login again.');
        } else {
            showNotification(data.error || 'Booking failed', 'error');
        }
    } catch (err) {
        showNotification('Booking failed. Please try again.', 'error');
    }
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ===========================
// AUTH MODAL
// ===========================
function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function toggleAuthMode(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('authModalTitle').textContent = isLoginMode ? 'Login' : 'Register';
    document.getElementById('authSubmitBtn').textContent = isLoginMode ? 'Login' : 'Register';
    document.getElementById('authNameGroup').style.display = isLoginMode ? 'none' : 'flex';
    document.getElementById('authToggleText').textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
    document.getElementById('authToggleLink').textContent = isLoginMode ? 'Register' : 'Login';
}

const authForm = document.getElementById('authForm');
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value;

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode ? { email, password } : { name, email, password };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('atlas_token', data.token);
            localStorage.setItem('atlas_user', JSON.stringify(data.user));
            updateAuthUI();
            closeAuthModal();
            showNotification(`Welcome${currentUser.name ? ', ' + currentUser.name : ''}!`, 'success');
            authForm.reset();
        } else {
            showNotification(data.error || 'Authentication failed', 'error');
        }
    } catch (err) {
        showNotification('Authentication failed. Please try again.', 'error');
    }
});

function updateAuthUI() {
    const authLink = document.getElementById('authNavLink');
    if (authToken && currentUser) {
        authLink.textContent = 'Logout';
        authLink.onclick = logout;
    } else {
        authLink.textContent = 'Login';
        authLink.onclick = openAuthModal;
    }
}

function logout() {
    clearAuthSession();
    showNotification('Logged out successfully', 'success');
}

// ===========================
// NOTIFICATION SYSTEM
// ===========================
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
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
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Append to body
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===========================
// PARALLAX EFFECT FOR HERO
// ===========================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');

    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ===========================
// LAZY LOADING IMAGES
// ===========================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, imgObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imgObserver.unobserve(img);
            }
        });
    });

    const images = document.querySelectorAll('img');
    images.forEach(img => imageObserver.observe(img));
}

// ===========================
// INITIALIZE ON PAGE LOAD
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Atlas website loaded successfully!');

    // Add loaded class to body for any CSS transitions
    document.body.classList.add('loaded');

    // Load destinations from API
    loadDestinations();

    // Update auth UI
    updateAuthUI();

    // Validate and refresh session state if a token already exists.
    validateStoredSession();
});
