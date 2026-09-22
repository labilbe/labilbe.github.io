# labilbe.github.io

La page d'accueil de <https://labilbe.github.io/> : la liste des projets publiés sur GitHub Pages.

Elle n'est pas écrite à la main. `build.mjs` interroge l'API GitHub, garde les dépôts publics dont
les Pages sont activées — ni le dépôt de ce site, ni les forks, ni les archives — et en fait une
page statique dans `dist/`. Publier un nouveau projet suffit donc à le voir apparaître ici. Les
projets sont listés par nom, et non par date de dernière poussée : chacun garde sa place d'une
reconstruction à l'autre.

```bash
node build.mjs          # écrit dist/index.html et dist/styles.css
```

Aucune dépendance : Node seul, et `fetch` fait le reste. Sans jeton, l'API publique répond quand
même, dans la limite de soixante appels par heure ; le workflow lui passe `GITHUB_TOKEN`.

## Ce qu'on peut régler

| Fichier | Rôle |
| --- | --- |
| `overrides.json` | Le titre, la description et les étiquettes d'un projet, quand ceux du dépôt ne suffisent pas |
| `site/styles.css` | L'habillage, repris des jeux : feutre vert, laiton, Archivo |
| `build.mjs` | La mise en page elle-même |

Une entrée d'`overrides.json` ne remplace que ce qu'elle donne — un titre seul laisse la
description du dépôt en place :

```json
{
  "echecs": {
    "title": "Échecs",
    "note": "Règles complètes, IA alpha-bêta à quatre niveaux, parties au format PGN.",
    "tags": ["C#", "Blazor WebAssembly"]
  }
}
```

## Publication

`.github/workflows/pages.yml` reconstruit et déploie la page :

- à chaque poussée sur `main` ;
- tous les jours à 5 h 17 UTC, pour que le site suive les projets sans qu'on y pense ;
- à la demande, par *Run workflow* — c'est ce qu'on lance après avoir publié un projet, plutôt
  que d'attendre le lendemain.

Avant de déployer, le workflow vérifie que la page contient au moins un lien : une liste vide
serait le signe que l'API a répondu autre chose que ce qu'on attendait, et vaut mieux un échec
visible qu'une page d'accueil muette.
