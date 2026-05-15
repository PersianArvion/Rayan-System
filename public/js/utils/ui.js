/**
 * UI Utilities
 * @file public/js/utils/ui.js
 */

/**
 * Format price in Persian
 */
export const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
};

/**
 * Show toast notification
 */
export const showToast = (message, type = 'success', duration = 3000) => {
    const toast = document.getElementById('toast') || createToast();
    const icon = toast.querySelector('.icon');

    toast.textContent = message;
    toast.prepend(icon);
    toast.classList.add('show');
    toast.style.background = type === 'error' ? '#EF4444' : '#10B981';

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

/**
 * Create toast element
 */
const createToast = () => {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
    return toast;
};

/**
 * Initialize animations
 */
export const initAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });
};

/**
 * Toggle header scroll effect
 */
export const initHeaderScroll = () => {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
};

/**
 * Initialize back to top button
 */
export const initBackToTop = () => {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
};

/**
 * Debounce function
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
