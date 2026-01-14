// Tab Switching
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-nav .tab');
    const tabContents = {
        'product': document.getElementById('product-content'),
        'investor': document.getElementById('investor-content')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab button
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            Object.values(tabContents).forEach(content => {
                content.classList.remove('active');
            });
            tabContents[targetTab].classList.add('active');

            // Scroll to top of content
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Animate stats on scroll (optional enhancement)
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe feature cards for subtle animations
    document.querySelectorAll('.feature-card, .component-card, .opportunity-card, .acquirer-card, .diff-card, .asset-item').forEach(card => {
        animateOnScroll.observe(card);
    });

    // Handle URL hash for direct tab linking
    const handleHash = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'investors' || hash === 'investor') {
            document.getElementById('tab-investor').click();
        }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
});
