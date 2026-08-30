const API_BASE = "https://pokeapi.co/api/v2/pokemon";
const INITIAL_COUNT = 12;
const PAGE_SIZE = 8;

const grid = document.querySelector("#pokemonGrid");
const statusEl = document.querySelector("#status");
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const randomButton = document.querySelector("#randomButton");
const loadMoreButton = document.querySelector("#loadMoreButton");
const cardTemplate = document.querySelector("#pokemonCardTemplate");
const dialog = document.querySelector("#pokemonDialog");
const details = document.querySelector("#pokemonDetails");
const closeDialogButton = document.querySelector("#closeDialogButton");

let loadedCount = 0;

function setStatus(message = "") {
  statusEl.textContent = message;
}

function formatId(id) {
  return `#${String(id).padStart(4, "0")}`;
}

function getArtwork(pokemon) {
  return pokemon.sprites.other?.["official-artwork"]?.front_default
    || pokemon.sprites.other?.home?.front_default
    || pokemon.sprites.front_default;
}

async function fetchPokemon(nameOrId) {
  const response = await fetch(`${API_BASE}/${String(nameOrId).toLowerCase().trim()}`);
  if (!response.ok) throw new Error("Pokémon introuvable");
  return response.json();
}

function createTypePill(type) {
  const pill = document.createElement("span");
  pill.className = "type-pill";
  pill.textContent = type.type.name;
  return pill;
}

function createCard(pokemon) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector(".pokemon-card");
  const image = node.querySelector(".pokemon-image");
  const typeContainer = node.querySelector(".pokemon-types");

  node.querySelector(".pokemon-number").textContent = formatId(pokemon.id);
  node.querySelector(".pokemon-name").textContent = pokemon.name;
  image.src = getArtwork(pokemon);
  image.alt = `Illustration de ${pokemon.name}`;
  pokemon.types.forEach(type => typeContainer.appendChild(createTypePill(type)));

  card.addEventListener("click", () => openDetails(pokemon));
  return node;
}

async function loadRange(start, count) {
  setStatus("Chargement des Pokémon…");
  loadMoreButton.disabled = true;

  try {
    const requests = Array.from({ length: count }, (_, index) => fetchPokemon(start + index));
    const pokemonList = await Promise.all(requests);
    pokemonList.forEach(pokemon => grid.appendChild(createCard(pokemon)));
    loadedCount += pokemonList.length;
    setStatus(`${loadedCount} Pokémon chargés.`);
  } catch (error) {
    setStatus("Impossible de charger les Pokémon. Vérifie ta connexion puis réessaie.");
  } finally {
    loadMoreButton.disabled = false;
  }
}

function renderDetails(pokemon) {
  const types = pokemon.types.map(t => `<span class="type-pill">${t.type.name}</span>`).join("");
  const stats = pokemon.stats.map(stat => {
    const width = Math.min(100, Math.round((stat.base_stat / 180) * 100));
    return `
      <div class="stat-row">
        <span class="stat-name">${stat.stat.name}</span>
        <div class="stat-bar"><div class="stat-fill" style="width:${width}%"></div></div>
        <span class="stat-value">${stat.base_stat}</span>
      </div>`;
  }).join("");

  details.innerHTML = `
    <div class="detail-shell">
      <div class="detail-hero">
        <img src="${getArtwork(pokemon)}" alt="Illustration de ${pokemon.name}">
        <div>
          <div class="detail-number">${formatId(pokemon.id)}</div>
          <h2 class="detail-name">${pokemon.name}</h2>
          <div class="pokemon-types">${types}</div>
          <div class="detail-meta">
            <span><strong>${pokemon.height / 10} m</strong><br>Taille</span>
            <span><strong>${pokemon.weight / 10} kg</strong><br>Poids</span>
            <span><strong>${pokemon.base_experience ?? "—"}</strong><br>Exp. de base</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <p class="eyebrow">Statistiques</p>
        ${stats}
      </div>
    </div>`;
}

function openDetails(pokemon) {
  renderDetails(pokemon);
  if (typeof dialog.showModal === "function") dialog.showModal();
}

async function searchPokemon() {
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    setStatus("Entre un nom ou un numéro de Pokémon.");
    return;
  }

  setStatus(`Recherche de “${query}”…`);
  try {
    const pokemon = await fetchPokemon(query);
    openDetails(pokemon);
    setStatus(`${pokemon.name} trouvé.`);
  } catch {
    setStatus(`Aucun Pokémon trouvé pour “${query}”.`);
  }
}

async function randomPokemon() {
  const id = Math.floor(Math.random() * 1025) + 1;
  setStatus("Choix d’un Pokémon au hasard…");
  try {
    const pokemon = await fetchPokemon(id);
    openDetails(pokemon);
    setStatus(`${pokemon.name} a été tiré au sort.`);
  } catch {
    setStatus("Impossible de tirer un Pokémon pour le moment.");
  }
}

searchButton.addEventListener("click", searchPokemon);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchPokemon();
});
randomButton.addEventListener("click", randomPokemon);
loadMoreButton.addEventListener("click", () => loadRange(loadedCount + 1, PAGE_SIZE));
closeDialogButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

loadRange(1, INITIAL_COUNT);
