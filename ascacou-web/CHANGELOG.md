# 0.1.0

2026-10-26 docs: licence (tous droits réservés) et conditions de contribution
           Code publié pour consultation ; contributions sur autorisation écrite, sous
           licence perpétuelle et irrévocable au profit de l'auteur (CONTRIBUTING.md).
           Le jeu et sa charte graphique restent à leurs auteurs.
           
2026-10-26 refactor: couleurs de la charte en variables CSS, déclarées une seule fois
           Bloc :root en tête de src/index.css ; le thème UnoCSS s'y réfère. Fond de page
           en var(--page), bg-white des boutons et champs en bg-pearl. Les fichiers
           statiques (favicon, logo, icônes, manifeste) gardent des copies, listées.
           
2026-10-26 fix: favicon, icônes et palette alignés sur la carte d'ascacou.com
           Favicon : forme, proportions et couleurs de la carte du site, motif propre
           (diagonale) ; icônes PNG régénérées. Palette de l'app, theme_color et logo :
           papier #e8d9c6, encre #1d1d1b, blanc #fff.
           
2026-10-26 fix: build de production (URL de l'API, schéma embarqué, routes sous Apache)
           - .env.production : VITE_API_URL, origine de l'API et du cable en prod.
           - src/schema.json : contrat de l'API embarqué (le build l'exigeait), commité,
             mis à jour par make schema depuis le back de dev.
           - public/.htaccess : les routes du front servent index.html ; cache long des
             assets à empreinte, index.html et version.json revalidés.
           
2026-10-26 fix: cable sur l'origine de l'API (VITE_API_URL), plus sur celle du front
2026-10-25 feat: erreurs en brique, refus en notifications brèves
           Les refus d'une action (intentions, transitions de documents) s'affichent sous la
           barre du haut et s'effacent seuls ; les erreurs de saisie restent sous leur champ.
           
           Corrige aussi la pioche : la carte choisie est oubliée hors de son tour (d'où un
           « Ce n'est pas à vous » qui restait affiché), un jeu complet ne peut plus être choisi.
           
2026-10-25 feat: raison de la fin d'une partie (abandon, salon fermé, victoire réclamée)
2026-10-25 fix: partie suivante désactivée quand l'adversaire est absent
2026-10-25 feat: bilan et suites d'un salon fermé (nouveau salon aux mêmes réglages, retour à l'accueil)
2026-10-25 feat: partager le lien d'un salon en attente, manifeste d'application et icônes
2026-10-25 feat: pseudo modifiable sur l'accueil, enregistré automatiquement
2026-10-25 feat: accueil (vos salons, nouveau salon, à rejoindre, en cours, terminés)
2026-10-25 feat: écran de partie resserré (barre du haut, bandeaux des joueurs, pions contre le plateau, messages en bas)
2026-10-25 feat: fond et plateau en papier, sélection et dernier pion en gris
2026-10-25 feat: contour en forme de carte et favicon carte-motif
2026-10-25 feat: charte graphique (logo, favicon, plateau, cartes, police) et motifs réalisés (survol, animation)
2026-10-25 feat: mise en évidence du dernier pion posé
2026-10-24 feat: annulation d'un coup, messages prédéfinis, réglages et variantes du salon
2026-10-24 feat: écran de partie (plateau, mains, pioche, abandon, partie suivante, motifs reproduits)
2026-10-24 feat: page de salon (ouvrir, rejoindre, fermer, présence) avec unocss et react-router
2026-10-24 feat: connecteur du cable (lobby, salon) et synchronisation par redux-documents
2026-10-24 refactor: ascacou-app devient ascacou-web
           Aligné sur l'API (ascacou-api, image ascacou/api).
           
