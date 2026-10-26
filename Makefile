# Workflow de release du front : même modèle que le back (version calculée d'après
# les types de commits depuis le dernier tag, voir bin/bump), version dans package.json.
#
#   make check            oxlint, oxfmt --check, schéma embarqué présent
#   make schema           récupère le schéma du back de dev dans src/schema.json
#   make version          version publiée, position git, prochaine version
#
#   make prepare-release  arbre propre, quelque chose à publier, vérifications
#   make build            check, version calculée, brouillon du CHANGELOG régénéré,
#                         dist/ (autant de fois que nécessaire)
#   make deploy-plan      ce que deploy copierait ou supprimerait (rien n'est écrit)
#   make deploy           copie dist/ sur la pré-prod (TARGET=dev, par défaut)
#   (valider sur la pré-prod, relire le CHANGELOG après le dernier build)
#   make release          commit « chore(release) » + tag (pas de git push)
#   make deploy TARGET=prod
#
# Avant le tag, on peut corriger le code : par des commits, puis make build à nouveau.
# Invariant : le dist/ déployé en prod est celui construit sur le commit tagué.
# Destinations de déploiement : deploy.mk.

APP := ascacou-web
STATE := .release-state
RELEASE_FILES := $(APP)/package.json $(APP)/CHANGELOG.md
# Back de dev (Vandal), comme le proxy de vite ; le front ne lit rien dans le dépôt du back.
SCHEMA_URL ?= http://localhost:3000/api/v1/vandal/schema.json
DOCKER ?= docker
TARGET ?= dev

include deploy.mk

# Les conteneurs tournent avec l'uid de l'hôte (compose.yaml).
export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

# Évalué à chaque usage (pas :=) : la version change pendant le build.
version = $(shell bin/bump V)

# Commande dans un conteneur node jetable (dépendances à jour, lockfile respecté).
run = $(DOCKER) compose run --rm -T node sh -c 'pnpm install --frozen-lockfile --silent && $(1)'

# Champ du dist/version.json construit.
built = $(shell jq -r .$(1) $(APP)/dist/version.json 2>/dev/null)

DEST = $(DEPLOY_$(TARGET))
RSYNC = rsync -rlz --checksum --delete-after --delay-updates --itemize-changes \
  --chmod=D755,F644 $(APP)/dist/ $(DEST)/

.PHONY: check schema version prepare-release build release deploy-plan deploy \
  check-schema check-clean check-release-files check-version check-changelog check-deploy

check: check-schema
	$(call run,pnpm lint && pnpm exec oxfmt --check src)

# Mise à jour volontaire du contrat embarqué (à commiter) ; même mise en forme que
# la référence du back (doc/schema.json), pour des diffs lisibles.
schema:
	curl -sf $(SCHEMA_URL) -o $(APP)/src/schema.json.tmp
	python3 -m json.tool --no-ensure-ascii $(APP)/src/schema.json.tmp > $(APP)/src/schema.json
	rm -f $(APP)/src/schema.json.tmp

check-schema:
	@jq -e .resources $(APP)/src/schema.json >/dev/null 2>&1 || { \
		echo "$(APP)/src/schema.json absent ou invalide : make schema"; exit 1; }

version:
	@bin/bump version

check-clean:
	@test -z "$$(git status --porcelain)" || { \
		git status --short; echo "L'arbre de travail doit être propre"; exit 1; }

# Pas de modification non commitée en dehors de package.json et CHANGELOG.md : sinon
# dist/ contiendrait du code absent du tag. Les corrections se commitent.
check-release-files:
	@test -z "$$(git status --porcelain -- . $(addprefix ':!',$(RELEASE_FILES)))" || { \
		git status --short; \
		echo "Modifications non commitées : commiter les corrections (hors $(RELEASE_FILES))"; \
		exit 1; }

# La version de package.json doit être celle que build a calculée.
check-version:
	@test "$$(bin/bump V)" = "$$(bin/bump peek)" || { \
		echo "La version calculée est $$(bin/bump peek), package.json dit $$(bin/bump V) : make build"; \
		exit 1; }

check-changelog:
	@grep -q "^# $(version)$$" $(APP)/CHANGELOG.md || { \
		echo "Pas d'entrée $(version) dans $(APP)/CHANGELOG.md"; exit 1; }

# Le hook commit-msg réserve version et CHANGELOG au commit chore(release) ;
# bin/bump guard rattrape un commit qui les a embarqués malgré tout.
prepare-release: check-clean
	git config core.hooksPath .githooks
	bin/bump guard
	@echo "Prochaine version : $$(bin/bump peek)"
	$(MAKE) --no-print-directory check
	@echo prepared > $(STATE)
	@echo "Prêt : make build"

# La recette est développée avant de s'exécuter : la version écrite par
# bin/bump next se lit donc par le shell ($$(bin/bump V)), pas par $(version).
build: check-release-files
	@grep -qE '^(prepared|built)' $(STATE) 2>/dev/null || { \
		echo "Lancer d'abord make prepare-release"; exit 1; }
	bin/bump guard
	$(MAKE) --no-print-directory check
	bin/bump next
	bin/bump write-changelog
	$(call run,pnpm build)
	@jq -n --arg version "$$(bin/bump V)" --arg commit "$$(git rev-parse HEAD)" \
		--arg built_at "$$(date -u +%FT%TZ)" '{$$version, $$commit, $$built_at}' \
		> $(APP)/dist/version.json
	@echo "built $$(git rev-parse HEAD)" > $(STATE)
	@echo "dist/ $$(bin/bump V) construit : make deploy (pré-prod), puis relire $(APP)/CHANGELOG.md et make release"

release: check-release-files check-version check-changelog
	@test "$$(cat $(STATE) 2>/dev/null)" = "built $$(git rev-parse HEAD)" || { \
		echo "Le dernier build ne correspond pas au commit courant : make build"; exit 1; }
	@# Une release sans commit est une anomalie : pas de || true.
	git add $(RELEASE_FILES)
	git commit -m "chore(release): $(version)"
	git tag -a "v$(version)" -m "chore(release): v$(version)"
	@echo released > $(STATE)
	@echo "v$(version) taguée localement. Git n'est pas poussé. Prod : make deploy TARGET=prod"

# Destination ouverte, dist/ construit ; en prod, seulement le dist/ d'une release :
# construit sur le commit qui précède le commit de release tagué.
check-deploy:
	@test -n "$(DEST)" || { echo "Pas de destination pour TARGET=$(TARGET) (deploy.mk)"; exit 1; }
	@test -n "$(call built,version)" || { echo "Pas de dist/ construit : make build"; exit 1; }
	@if [ "$(TARGET)" = prod ]; then \
		tag="v$(call built,version)"; \
		git rev-parse -q --verify "refs/tags/$$tag" >/dev/null || { \
			echo "dist/ $(call built,version) n'est pas une release ($$tag absent) : make release"; exit 1; }; \
		test "$$(git rev-parse "$$tag^{commit}^")" = "$(call built,commit)" || { \
			echo "dist/ n'a pas été construit sur le commit de $$tag"; exit 1; }; \
	fi

deploy-plan: check-deploy
	@echo "dist/ $(call built,version) → $(DEST) (essai à blanc)"
	$(RSYNC) --dry-run

deploy: check-deploy
	@echo "dist/ $(call built,version) → $(DEST)"
	$(RSYNC)
