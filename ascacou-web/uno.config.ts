import { defineConfig, presetWind4 } from 'unocss';

// Mobile d'abord. Le visuel suivra la charte du livret et de la boîte : pour l'instant,
// seulement la mise en page.
export default defineConfig({
  presets: [presetWind4()],
});
