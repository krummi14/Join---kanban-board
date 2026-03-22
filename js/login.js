window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash_screen');

    if (localStorage.getItem('splashPlayed')) {
        splash.style.display = 'none';
        return;
    }

    localStorage.setItem('splashPlayed', 'true');

    // Animation als Css oder coden?
});