/**
 * SkillForge Theme Engine
 * Manages Light/Dark mode with [data-theme] and localStorage.
 */
(() => {
    const themeStorageKey = 'skillforge-theme';
    const html = document.documentElement;

    /**
     * Apply the theme to the <html> element
     * @param {string} theme 'light' | 'dark'
     */
    const setTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        localStorage.setItem(themeStorageKey, theme);
        
        // Sync with learner app if present
        if (window.Store) {
            window.localStorage.setItem('gsds-theme', theme);
        }
        
        // Update toggle icons if they exist
        const darkIcon = document.getElementById('theme-icon-dark');
        const lightIcon = document.getElementById('theme-icon-light');
        if (darkIcon && lightIcon) {
            if (theme === 'dark') {
                darkIcon.classList.add('hidden');
                lightIcon.classList.remove('hidden');
            } else {
                darkIcon.classList.remove('hidden');
                lightIcon.classList.add('hidden');
            }
        }
    };

    /**
     * Initialize theme from storage or system preference
     */
    const initTheme = () => {
        const storedTheme = localStorage.getItem(themeStorageKey);
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(systemPrefersDark ? 'dark' : 'light');
        }
    };

    // Run initialization immediately to prevent FOUC
    initTheme();

    /**
     * Global toggle function
     */
    window.toggleTheme = () => {
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        
        if (window.Toast) {
            window.Toast.success(`Theme switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`);
        }
    };
})();
