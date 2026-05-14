// public/js/utils.js
export function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price);
}

export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.display = 'block';
    // استایل دهی ساده برای نمایش خطا یا موفقیت
    if(type === 'error') {
        toast.style.backgroundColor = '#fee2e2';
        toast.style.color = '#b91c1c';
    } else {
        toast.style.backgroundColor = '#dcfce7';
        toast.style.color = '#15803d';
    }

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

export function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}