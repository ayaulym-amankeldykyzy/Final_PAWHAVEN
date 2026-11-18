// Runs before rendering to keep the selected theme consistent between pages.
try {
  document.documentElement.dataset.theme = localStorage.getItem('pawhavenTheme') === 'night' ? 'night' : 'day';
} catch { document.documentElement.dataset.theme = 'day'; }

document.documentElement.setAttribute('data-bs-theme', document.documentElement.dataset.theme === 'night' ? 'dark' : 'light');
