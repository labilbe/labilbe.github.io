// Construit la page d'accueil à partir de l'API GitHub : tout dépôt public dont les
// Pages sont activées y entre de lui-même. Aucune dépendance, aucun npm install :
// Node suffit, et la page reste un fichier statique.

import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const USER = process.env.SITE_USER ?? 'labilbe';
const SITE_REPO = `${USER}.github.io`;
const OUT = 'dist';

/** Le dépôt d'un projet, tel qu'on l'affiche. */
function card(repo, overrides) {
    const extra = overrides[repo.name] ?? {};
    return {
        name: repo.name,
        title: extra.title ?? repo.name,
        note: extra.note ?? repo.description ?? '',
        tags: extra.tags ?? [repo.language].filter(Boolean),
        url: `https://${SITE_REPO}/${repo.name}/`,
        source: repo.html_url,
        updated: (repo.pushed_at ?? '').slice(0, 10),
    };
}

async function repositories() {
    const headers = { 'accept': 'application/vnd.github+json', 'user-agent': SITE_REPO };
    if (process.env.GITHUB_TOKEN) {
        headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers });
    if (!response.ok) {
        throw new Error(`L'API GitHub a répondu ${response.status} ${response.statusText}.`);
    }

    // On ne garde que ce qui est réellement publié : le dépôt du site lui-même n'est
    // pas un projet, un fork ou une archive non plus.
    return (await response.json()).filter(repo =>
        repo.has_pages && !repo.fork && !repo.archived && !repo.private && repo.name !== SITE_REPO);
}

const escape = text => String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** « 2026-09-22 » devient « 22 septembre 2026 ». */
function inFrench(iso) {
    if (!iso) {
        return '';
    }

    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const [year, month, day] = iso.split('-').map(Number);
    return `${day} ${months[month - 1]} ${year}`;
}

function render(cards) {
    const articles = cards.map(c => `
            <li class="card">
                <a class="card__link" href="${escape(c.url)}">
                    <h2 class="card__title">${escape(c.title)}</h2>
                    ${c.note ? `<p class="card__note">${escape(c.note)}</p>` : ''}
                </a>
                <p class="card__meta">
                    ${c.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('')}
                    <a class="card__source" href="${escape(c.source)}">code source</a>
                    ${c.updated ? `<span class="card__date">mis à jour le ${escape(inFrench(c.updated))}</span>` : ''}
                </p>
            </li>`).join('');

    const count = cards.length === 1 ? '1 projet en ligne' : `${cards.length} projets en ligne`;

    return `<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Projets — ${escape(USER)}</title>
    <meta name="description" content="Les projets de ${escape(USER)} publiés sur GitHub Pages." />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="styles.css" />
</head>

<body>
    <div class="room">
        <header class="masthead">
            <h1 class="masthead__title">Projets</h1>
            <p class="masthead__note">
                Tout ce que ${escape(USER)} a publié sur GitHub Pages. Cette page se refait toute
                seule&nbsp;: un dépôt dont les Pages sont activées y apparaît au prochain passage.
            </p>
        </header>

        <main>
            <p class="count">${escape(count)}</p>
            <ul class="cards">${articles}
            </ul>
        </main>

        <footer class="footer">
            <a href="https://github.com/${escape(USER)}">github.com/${escape(USER)}</a>
            <span>Page reconstruite le ${escape(inFrench(new Date().toISOString().slice(0, 10)))}.</span>
        </footer>
    </div>
</body>

</html>
`;
}

const overrides = existsSync('overrides.json')
    ? JSON.parse(await readFile('overrides.json', 'utf8'))
    : {};

const repos = await repositories();
const cards = repos.map(repo => card(repo, overrides));

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/index.html`, render(cards));
await copyFile('site/styles.css', `${OUT}/styles.css`);

console.log(`${cards.length} projets : ${cards.map(c => c.name).join(', ')}`);
