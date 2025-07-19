class ThemeManager {
    private static readonly THEME_KEY = 'calendar-theme';
    private static readonly DARK_THEME = 'dark';
    private static readonly LIGHT_THEME = 'light';
    private static prefersDarkMedia: MediaQueryList;

    public static initialize(): void {
        // Check for system preference
        ThemeManager.prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');

        // Set initial theme based on saved preference or system preference
        const savedTheme = localStorage.getItem(ThemeManager.THEME_KEY);

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (ThemeManager.prefersDarkMedia.matches) {
            document.documentElement.setAttribute('data-theme', ThemeManager.DARK_THEME);
            localStorage.setItem(ThemeManager.THEME_KEY, ThemeManager.DARK_THEME);
        } else {
            document.documentElement.setAttribute('data-theme', ThemeManager.LIGHT_THEME);
        }

        // Listen for system theme changes
        ThemeManager.prefersDarkMedia.addEventListener('change', ThemeManager.handleSystemThemeChange);

        // Set up the theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', ThemeManager.toggleTheme);
            ThemeManager.updateThemeToggle();
        }

        // Add a class to the body to enable transitions after initial load
        setTimeout(() => {
            document.body.classList.add('theme-transition');
        }, 100);
    }

    private static handleSystemThemeChange = (e: MediaQueryListEvent): void => {
        // Only apply system theme if user hasn't explicitly set a preference
        if (!localStorage.getItem(ThemeManager.THEME_KEY)) {
            const newTheme = e.matches ? ThemeManager.DARK_THEME : ThemeManager.LIGHT_THEME;
            document.documentElement.setAttribute('data-theme', newTheme);
            ThemeManager.updateThemeToggle();
        }
    };

    private static toggleTheme = (): void => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === ThemeManager.DARK_THEME
            ? ThemeManager.LIGHT_THEME
            : ThemeManager.DARK_THEME;

        // Apply the new theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(ThemeManager.THEME_KEY, newTheme);

        // Update the theme toggle button
        ThemeManager.updateThemeToggle();
    };

    private static updateThemeToggle(): void {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const isDark = document.documentElement.getAttribute('data-theme') === ThemeManager.DARK_THEME;
        
        // Update ARIA attributes
        themeToggle.setAttribute('aria-label', `Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`);
        themeToggle.setAttribute('title', `Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`);

        // Add animation class
        themeToggle.classList.add('theme-toggle-animate');
        setTimeout(() => {
            themeToggle.classList.remove('theme-toggle-animate');
        }, 300);
    }
}

// Make ThemeManager available globally
(window as any).ThemeManager = ThemeManager;

// Initialize the theme manager when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.initialize());
} else {
    ThemeManager.initialize();
}
