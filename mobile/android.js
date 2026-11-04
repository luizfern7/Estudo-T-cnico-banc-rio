import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

// Keep the original HTML's desktop export intact. Android shares a real file.
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', () => {
    const back = document.querySelector('.back-link:not([hidden])');
    if (back) back.click();
    else {
      const home = document.querySelector('.journey-nav [data-page="dashboard"]');
      if (home && !home.classList.contains('active')) home.click();
      else App.minimizeApp();
    }
  });
  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('[data-act="export"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    try {
      const progress = JSON.parse(localStorage.getItem('banestes2026_plataforma_v1') || '{}');
      const savedAt = new Date().toISOString();
      const backup = { app: 'banestes-2026', version: 1, savedAt, progress };
      const file = await Filesystem.writeFile({
        path: `banestes_progresso_${savedAt.slice(0, 10)}.json`,
        data: JSON.stringify(backup, null, 2),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({ title: 'Backup do progresso BANESTES', files: [file.uri], dialogTitle: 'Salvar ou compartilhar backup' });
    } catch (error) {
      // Cancelling the Android share sheet is not a failed backup operation.
      if (!/cancel/i.test(error.message || '')) alert(`Não foi possível compartilhar o backup: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  }, true);
}
