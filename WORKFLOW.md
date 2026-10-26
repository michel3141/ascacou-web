# Workflow de release (front)

Même modèle que le back (`back/WORKFLOW.md`) : la version n'est jamais choisie à
l'avance, elle est **calculée à chaque build** d'après les types de commits depuis
le dernier tag (`bin/bump`). Elle vit dans `ascacou-web/package.json`.
Entre deux releases, `package.json` indique la dernière version publiée ;
`make version` montre où en est le code et ce que serait la prochaine version.

Différences avec le back :

- le livrable est le dossier `ascacou-web/dist/`, copié par rsync sur l'hébergement
  (o2switch), pas une image ;
- la **validation se fait avant le tag**, sur la pré-prod ; la prod ne reçoit que le
  `dist/` d'une release.

```
 développement ──▶ prepare-release ──▶ build (0..n) ──▶ deploy (pré-prod)
  commits typés                          ▲                  │
  make check                             │ corriger :       │ valider
  make schema (si l'API change)          │ commits fix:…    │
                                         └──────────────────┤
                                                            ▼
                                       release (commit + tag) ──▶ deploy TARGET=prod
```

## Recettes, dans l'ordre

Toutes se lancent depuis `front/`. Les commandes node tournent dans un conteneur
jetable (`docker compose run`), rsync et jq sur l'hôte.

1. **`make version`** — informatif : version publiée, position git, prochaine version.
2. **`make prepare-release`** — arbre propre, quelque chose à publier, `check`.
3. **`make build`** — autant de fois que nécessaire : calcule la version, régénère le
   brouillon du CHANGELOG, construit `dist/` et y écrit `version.json`
   (version, commit, date du build).

   **Tant que rien n'est tagué, on peut corriger le code** : commiter les corrections,
   **sans** `package.json` ni `CHANGELOG.md` (`git add <fichiers>`, pas `git commit -a`),
   puis relancer `make build`.
4. **`make deploy-plan`**, puis **`make deploy`** — sur la pré-prod (`TARGET=dev` par
   défaut), et **validation**. `deploy-plan` liste ce qui serait copié ou supprimé
   sans rien écrire.
5. **Relire `ascacou-web/CHANGELOG.md`**, une fois, après le dernier build.
6. **`make release`** — une seule fois : commit et tag (le push git reste à la main).
7. **`make deploy-plan TARGET=prod`**, puis **`make deploy TARGET=prod`**.

En cas de doute sur l'étape en cours : `.release-state` contient `prepared`,
`built <commit construit>` ou `released`. Pour la version en ligne :
`curl https://dev-ascacou.lespyjamasrouges.fr/version.json`.

## Déploiement

Les destinations sont dans `deploy.mk` (`DEPLOY_dev`, `DEPLOY_prod`) ; une destination
vide refuse le déploiement. Aucune recette ne pose de question : la sécurité vient
des refus.

- **dev** : n'importe quel `dist/` construit.
- **prod** : seulement le `dist/` d'une release, construit sur le commit qui précède le
  commit de release tagué `v<version>`.

La copie (`rsync --checksum --delete-after --delay-updates`) n'installe les nouveaux
fichiers qu'en fin de transfert et ne supprime les anciens qu'ensuite. Revenir en
arrière : reconstruire le tag précédent et le redéployer.

Ce que le build embarque :

- `.env.production` : `VITE_API_URL`, l'origine de l'API et du cable (un seul back) ;
- `src/schema.json` : le contrat de l'API contre lequel le front est écrit. Commité,
  mis à jour volontairement par `make schema` depuis le back de dev
  (`SCHEMA_URL`, Vandal sur `localhost:3000` par défaut). Le front ne lit rien dans
  le dépôt du back : les deux se développent indépendamment. La compatibilité d'un
  front avec un back plus récent est garantie côté back (`schema_spec.rb`, `feat!`) ;
- `public/.htaccess` : les routes du front servent `index.html` (Apache), cache long
  pour les assets à empreinte, `index.html` et `version.json` toujours revalidés.

## Version et CHANGELOG : seulement par la release

Entre un build et la release, la version et le CHANGELOG sont modifiés sans être
commités : ils appartiennent au commit `chore(release)`. Deux protections :

- le hook `.githooks/commit-msg`, activé par `make prepare-release`
  (`git config core.hooksPath .githooks`), refuse un commit qui les embarque
  (`git commit -a`…) sans être un `chore(release)` ; `--no-verify` pour passer outre ;
- `bin/bump guard`, lancé par `prepare-release` et `build`, rattrape un tel commit
  (hook non installé, `--no-verify`) et le nomme.

## Types de commits

Ceux du back (`back/WORKFLOW.md`) : `fix`, `perf` → patch ; `feat` → minor ;
`feat!` → major (minor en 0.x) ; `docs`, `refactor`, `test`, `chore`, `ci` → pas
de release. Le CHANGELOG reprend `feat`, `feat!`, `fix`, `perf`, `refactor` et `docs`.
