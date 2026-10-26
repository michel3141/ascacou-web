import createSpraypaintClient, { fetchSpraypaintClient } from '@lpr/spraypaint-toolkit';

export const clientApplication = 'ascacou-web';

// Origine de l'API (et du cable) : VITE_API_URL au build, sinon celle du front (dev, via
// le proxy de vite).
export const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin;

const params = { url: apiUrl };

// dev : schéma vivant, servi par le back (Vandal, via le proxy de vite)
// build : schéma embarqué (src/schema.json, copie de back/ascacou-api/doc/schema.json)
// glob plutôt qu'import : vite tolère alors l'absence du fichier en dev
const embedded = import.meta.glob('./schema.json', { import: 'default' })['./schema.json'];

const loadEmbedded = async () => {
  if (!embedded) throw new Error('src/schema.json absent : copier doc/schema.json du back');
  return createSpraypaintClient(clientApplication, await embedded(), params);
};

export const client = import.meta.env.DEV
  ? await fetchSpraypaintClient(clientApplication, params)
  : await loadEmbedded();
