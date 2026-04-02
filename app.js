const REPO_CONFIG = {
  owner: "emonbhuiyan",
  repo: "Dil-Bilgisi-Rehberi-Yeni-Istanbul",
  branch: "main",
  acceptedLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
  acceptedTypes: ["Grammar", "Vocabulary"],
};

const state = {
  docs: [],
  filters: {
    level: "",
    type: "",
    query: "",
    unfinishedOnly: false,
  },
  ui: {
    theme: localStorage.getItem("turkishStudyTheme") || "light",
    studyMode: localStorage.getItem("turkishStudyMode") === "true",
  },
  favorites: JSON.parse(localStorage.getItem("turkishStudyFavorites") || "[]"),
  progress: JSON.parse(localStorage.getItem("turkishStudyProgress") || "{}"),
};

const els = {
  docsContainer: document.getElementById("docsContainer"),
  statusBox: document.getElementById("statusBox"),
  levelFilters: document.getElementById("levelFilters"),
  typeFilters: document.getElementById("typeFilters"),
  globalSearch: document.getElementById("globalSearch"),
  docNav: document.getElementById("docNav"),
  clearLevelBtn: document.getElementById("clearLevelBtn"),
  clearTypeBtn: document.getElementById("clearTypeBtn"),
  themeBtn: document.getElementById("themeBtn"),
  studyModeBtn: document.getElementById("studyModeBtn"),
  expandAllBtn: document.getElementById("expandAllBtn"),
  collapseAllBtn: document.getElementById("collapseAllBtn"),
  onlyUnfinished: document.getElementById("onlyUnfinished"),
  levelCount: document.getElementById("levelCount"),
  docCount: document.getElementById("docCount"),
  unitCount: document.getElementById("unitCount"),
  progressCount: document.getElementById("progressCount"),
  docCardTemplate: document.getElementById("docCardTemplate"),
};

function setTheme() {
  document.body.classList.toggle("dark", state.ui.theme === "dark");
}

function saveUi() {
  localStorage.setItem("turkishStudyTheme", state.ui.theme);
  localStorage.setItem("turkishStudyMode", String(state.ui.studyMode));
}

function saveFavorites() {
  localStorage.setItem("turkishStudyFavorites", JSON.stringify(state.favorites));
}

function saveProgress() {
  localStorage.setItem("turkishStudyProgress", JSON.stringify(state.progress));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(html, query) {
  if (!query.trim()) return html;
  const pattern = new RegExp(`(${escapeRegExp(query.trim())})`, "gi");
  return html.replace(pattern, "<mark>$1</mark>");
}

function normalizeMarkdown(raw) {
  let text = raw.replace(/\r\n/g, "\n");

  text = text
    .replace(/\s+---\s+/g, "\n\n---\n\n")
    .replace(/\s+(#{1,4}\s+)/g, "\n\n$1")
    .replace(/\*\s\*\s\*/g, "\n\n---\n\n")
    .replace(/\s+(\*\s\*\*Usage:)/g, "\n$1")
    .replace(/\s+(\*\s\*\*Examples:)/g, "\n$1")
    .replace(/\s+(\*\s\*\*Note:)/g, "\n$1")
    .replace(/\s+(###\s+)/g, "\n\n$1")
    .replace(/\s+(##\s+)/g, "\n\n$1")
    .replace(/\s+(#\s+Unit\s+)/g, "\n\n# Unit ")
    .replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

function extractUnits(markdown, fallbackTitle) {
  const normalized = normalizeMarkdown(markdown);
  const headingRegex = /^#{1,2}\s+Unit\s+\d+.*$/gim;
  const matches = [...normalized.matchAll(headingRegex)];

  if (!matches.length) {
    return [{
      title: fallbackTitle,
      id: slugify(fallbackTitle),
      html: marked.parse(normalized),
      raw: normalized,
    }];
  }

  const units = matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : normalized.length;
    const block = normalized.slice(start, end).trim();
    const title = block.split("\n")[0].replace(/^#{1,2}\s+/, "").trim();
    return {
      title,
      id: slugify(title),
      html: marked.parse(block),
      raw: block,
    };
  });

  return units;
}

async function fetchRepoContents() {
  const apiUrl = `https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/contents/?ref=${REPO_CONFIG.branch}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
  }
  return response.json();
}

function filenameToMeta(name) {
  const match = name.match(/^(A1|A2|B1|B2|C1|C2)_(Grammar|Vocabulary)\.md$/i);
  if (!match) return null;
  return { level: match[1].toUpperCase(), type: capitalize(match[2]) };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getDocKey(doc) {
  return `${doc.level}-${doc.type}`;
}

function getUnitKey(doc, unit) {
  return `${getDocKey(doc)}::${unit.id}`;
}

function getCompletionPercent() {
  const totalUnits = state.docs.reduce((sum, doc) => sum + doc.units.length, 0);
  if (!totalUnits) return 0;
  const done = state.docs.reduce((sum, doc) => {
    return sum + doc.units.filter((unit) => state.progress[getUnitKey(doc, unit)]).length;
  }, 0);
  return Math.round((done / totalUnits) * 100);
}

async function loadDocs() {
  els.statusBox.textContent = "Loading repository content...";

  const contents = await fetchRepoContents();
  const files = contents
    .filter((item) => item.type === "file")
    .filter((item) => filenameToMeta(item.name));

  const docs = await Promise.all(
    files.map(async (file) => {
      const meta = filenameToMeta(file.name);
      const raw = await fetch(file.download_url).then((res) => {
        if (!res.ok) throw new Error(`Could not fetch ${file.name}`);
        return res.text();
      });

      const title = `${meta.level} ${meta.type}`;
      const units = extractUnits(raw, title);
      const intro = normalizeMarkdown(raw).split(/\n#{1,2}\s+Unit\s+\d+/i)[0].trim();

      return {
        name: file.name,
        level: meta.level,
        type: meta.type,
        title,
        sourceUrl: file.html_url,
        intro: intro ? marked.parse(intro) : `<p>${title} notes and study material.</p>`,
        units,
      };
    })
  );

  docs.sort((a, b) => {
    const levelOrder = REPO_CONFIG.acceptedLevels.indexOf(a.level) - REPO_CONFIG.acceptedLevels.indexOf(b.level);
    if (levelOrder !== 0) return levelOrder;
    return a.type.localeCompare(b.type);
  });

  state.docs = docs;
  els.statusBox.textContent = `Loaded ${docs.length} markdown files from the repository.`;
  renderFilters();
  renderNav();
  renderStats();
  renderDocs();
}

function renderFilters() {
  const levels = [...new Set(state.docs.map((doc) => doc.level))];
  const types = [...new Set(state.docs.map((doc) => doc.type))];

  els.levelFilters.innerHTML = levels.map((level) => `
    <button class="chip ${state.filters.level === level ? "active" : ""}" data-filter-level="${level}" type="button">${level}</button>
  `).join("");

  els.typeFilters.innerHTML = types.map((type) => `
    <button class="chip ${state.filters.type === type ? "active" : ""}" data-filter-type="${type}" type="button">${type}</button>
  `).join("");

  els.levelFilters.querySelectorAll("[data-filter-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.level = state.filters.level === btn.dataset.filterLevel ? "" : btn.dataset.filterLevel;
      renderFilters();
      renderDocs();
    });
  });

  els.typeFilters.querySelectorAll("[data-filter-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.type = state.filters.type === btn.dataset.filterType ? "" : btn.dataset.filterType;
      renderFilters();
      renderDocs();
    });
  });
}

function renderNav() {
  els.docNav.innerHTML = state.docs.map((doc) => {
    const id = `doc-${slugify(getDocKey(doc))}`;
    return `<a href="#${id}">${doc.level} · ${doc.type}</a>`;
  }).join("");
}

function renderStats() {
  const levelCount = new Set(state.docs.map((doc) => doc.level)).size;
  const docCount = state.docs.length;
  const unitCount = state.docs.reduce((sum, doc) => sum + doc.units.length, 0);
  const progress = getCompletionPercent();

  els.levelCount.textContent = String(levelCount);
  els.docCount.textContent = String(docCount);
  els.unitCount.textContent = String(unitCount);
  els.progressCount.textContent = `${progress}%`;
}

function isFavorite(doc) {
  return state.favorites.includes(getDocKey(doc));
}

function toggleFavorite(doc) {
  const key = getDocKey(doc);
  if (isFavorite(doc)) {
    state.favorites = state.favorites.filter((item) => item !== key);
  } else {
    state.favorites.push(key);
  }
  saveFavorites();
  renderDocs();
}

function matchDoc(doc) {
  const query = state.filters.query.trim().toLowerCase();
  if (state.filters.level && doc.level !== state.filters.level) return false;
  if (state.filters.type && doc.type !== state.filters.type) return false;

  const haystack = [doc.title, doc.type, doc.level, doc.name, ...doc.units.map((unit) => `${unit.title} ${unit.raw}`)]
    .join(" ")
    .toLowerCase();

  if (query && !haystack.includes(query)) return false;

  if (state.filters.unfinishedOnly) {
    const hasOpenUnit = doc.units.some((unit) => !state.progress[getUnitKey(doc, unit)]);
    if (!hasOpenUnit) return false;
  }

  return true;
}

function renderDocs() {
  const docs = state.docs.filter(matchDoc);
  els.docsContainer.innerHTML = "";

  if (!docs.length) {
    els.docsContainer.innerHTML = `<div class="empty-state">No content matched your current filters.</div>`;
    return;
  }

  const sortedDocs = [...docs].sort((a, b) => Number(isFavorite(b)) - Number(isFavorite(a)));

  sortedDocs.forEach((doc) => {
    const fragment = els.docCardTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".doc-card");
    const title = fragment.querySelector(".doc-title");
    const subtitle = fragment.querySelector(".doc-subtitle");
    const levelPill = fragment.querySelector(".level-pill");
    const typePill = fragment.querySelector(".type-pill");
    const favoriteBtn = fragment.querySelector(".favorite-btn");
    const unitList = fragment.querySelector(".unit-list");

    article.id = `doc-${slugify(getDocKey(doc))}`;
    title.textContent = doc.title;
    subtitle.innerHTML = highlightText(doc.intro, state.filters.query);
    levelPill.textContent = doc.level;
    typePill.textContent = doc.type;
    favoriteBtn.textContent = isFavorite(doc) ? "★" : "☆";
    favoriteBtn.addEventListener("click", () => toggleFavorite(doc));

    doc.units.forEach((unit, index) => {
      const details = document.createElement("details");
      details.className = "unit-card";
      if (state.ui.studyMode && index === 0) details.open = true;

      const summary = document.createElement("summary");
      summary.className = "unit-summary";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${unit.title}</strong><br><small>${doc.level} ${doc.type}</small>`;

      const actions = document.createElement("div");
      actions.className = "unit-actions";

      const studyLabel = document.createElement("label");
      studyLabel.className = "toggle-inline";
      studyLabel.innerHTML = `<input class="study-checkbox" type="checkbox" ${state.progress[getUnitKey(doc, unit)] ? "checked" : ""}><span>Studied</span>`;
      studyLabel.querySelector("input").addEventListener("change", (event) => {
        state.progress[getUnitKey(doc, unit)] = event.target.checked;
        saveProgress();
        renderStats();
        if (state.filters.unfinishedOnly) renderDocs();
      });

      actions.appendChild(studyLabel);
      summary.appendChild(left);
      summary.appendChild(actions);

      const body = document.createElement("div");
      body.className = "unit-body";
      body.innerHTML = highlightText(unit.html, state.filters.query);

      details.appendChild(summary);
      details.appendChild(body);
      unitList.appendChild(details);
    });

    els.docsContainer.appendChild(fragment);
  });
}

function expandCollapseAll(open) {
  document.querySelectorAll(".unit-card").forEach((card) => {
    card.open = open;
  });
}

function bindEvents() {
  els.globalSearch.addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    renderDocs();
  });

  els.clearLevelBtn.addEventListener("click", () => {
    state.filters.level = "";
    renderFilters();
    renderDocs();
  });

  els.clearTypeBtn.addEventListener("click", () => {
    state.filters.type = "";
    renderFilters();
    renderDocs();
  });

  els.themeBtn.addEventListener("click", () => {
    state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
    setTheme();
    saveUi();
  });

  els.studyModeBtn.addEventListener("click", () => {
    state.ui.studyMode = !state.ui.studyMode;
    els.studyModeBtn.textContent = state.ui.studyMode ? "Study mode on" : "Study mode";
    saveUi();
    renderDocs();
  });

  els.expandAllBtn.addEventListener("click", () => expandCollapseAll(true));
  els.collapseAllBtn.addEventListener("click", () => expandCollapseAll(false));

  els.onlyUnfinished.addEventListener("change", (event) => {
    state.filters.unfinishedOnly = event.target.checked;
    renderDocs();
  });
}

async function init() {
  setTheme();
  els.studyModeBtn.textContent = state.ui.studyMode ? "Study mode on" : "Study mode";
  bindEvents();

  try {
    await loadDocs();
  } catch (error) {
    console.error(error);
    els.statusBox.innerHTML = `
      <strong>Could not load the markdown files.</strong><br>
      Check that GitHub Pages is serving this repository and that the repo name in <code>app.js</code> is correct.
    `;
  }
}

init();
