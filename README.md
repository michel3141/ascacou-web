# Ascacou — web

Front de la version web et mobile d'**Ascacou**, jeu de construction imaginé par
**Marc Buonomo** ([ascacou.com](https://www.ascacou.com/)) :
« Le jeu où la stratégie se mêle à la géométrie ».

- `ascacou-web/` : l'application (Vite, React, UnoCSS), servie par le back
  [ascacou-api](https://github.com/michel3141/ascacou-api).
- Développement : `docker compose up` (serveur de vite sur :5173, API et cable
  relayés vers le back de dev).
- Releases et déploiement : [WORKFLOW.md](WORKFLOW.md).
- Le conteneur tourne avec l'uid de l'hôte : les recettes `make` le passent
  d'elles-mêmes ; pour `docker compose` à la main, sur une machine où l'uid n'est
  pas 1000 : `printf 'HOST_UID=%s\nHOST_GID=%s\n' $(id -u) $(id -g) > .env`.

## Licence

Tous droits réservés : code publié pour consultation, sans licence de réutilisation.
Voir [LICENSE](LICENSE) ; pour contribuer : [CONTRIBUTING.md](CONTRIBUTING.md).
