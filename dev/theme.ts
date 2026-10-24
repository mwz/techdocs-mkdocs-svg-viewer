const storageKey = 'tdsv-demo-colour-scheme';
const toggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
type Scheme = 'default' | 'slate';

const applyTheme = (scheme: Scheme) => {
  document.body.dataset.mdColorScheme = scheme;
  toggle.textContent =
    scheme === 'slate' ? 'Switch to light mode' : 'Switch to dark mode';
};

let initialScheme: Scheme = 'default';
try {
  if (localStorage.getItem(storageKey) === 'slate') initialScheme = 'slate';
} catch {
  // The demo still works when the browser blocks storage.
}
applyTheme(initialScheme);

toggle.addEventListener('click', () => {
  const scheme =
    document.body.dataset.mdColorScheme === 'slate' ? 'default' : 'slate';
  applyTheme(scheme);
  try {
    localStorage.setItem(storageKey, scheme);
  } catch {
    // Keep the selected theme for this page even if it cannot be saved.
  }
});

export {};
