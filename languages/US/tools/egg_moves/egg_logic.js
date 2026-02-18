// --- CONFIGURACIÓN Y ESTADO GLOBAL ---
const PATH_POKEDEX = '../../../../data/pokedex_en.json';
const PATH_MOVES = '../../../../data/moves_en.json';
const PATH_CHAINS = '../../../../data/chains_en.json';

let POKEDEX = {};
let MOVES = {};
let CHAINS = {};
let CURRENT_POKE_ID = null;

const TYPE_COLORS = {
    "Normal": "#A8A77A", "Fire": "#EE8130", "Water": "#6390F0", "Electric": "#F7D02C",
    "Grass": "#7AC74C", "Ice": "#96D9D6", "Fighting": "#C22E28", "Poison": "#A33EA1",
    "Ground": "#E2BF65", "Flying": "#A98FF3", "Psychic": "#F95587", "Bug": "#A6B91A",
    "Rock": "#B6A136", "Ghost": "#735797", "Dragon": "#6F35FC", "Steel": "#B7B7CE",
    "Dark": "#705746", "Fairy": "#D685AD"
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [resDex, resMoves, resChains] = await Promise.all([
            fetch(PATH_POKEDEX),
            fetch(PATH_MOVES),
            fetch(PATH_CHAINS)
        ]);
        POKEDEX = await resDex.json();
        MOVES = await resMoves.json();
        CHAINS = await resChains.json();
        
        initSearch();

        const params = new URLSearchParams(window.location.search);
        const pokeId = params.get('id');
        if (pokeId) renderPokemon(pokeId);
    } catch (err) {
        console.error("Error loading databases:", err);
    }
});

// --- BUSCADOR (Respetado íntegro) ---
const initSearch = () => {
    const input = document.getElementById('pokeSearch');
    const suggestions = document.getElementById('suggestions');
    if (!input || !suggestions) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        suggestions.innerHTML = '';
        if (query.length < 2) { suggestions.style.display = 'none'; return; }

        const filtered = Object.values(POKEDEX).filter(p => 
            p.name.toLowerCase().includes(query) || p.id.toString() === query
        ).slice(0, 10);

        if (filtered.length > 0) {
            filtered.forEach(p => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png"><span class="suggestion-text">${p.name} (#${p.id})</span>`;
                div.onclick = () => { suggestions.style.display = 'none'; input.value = p.name; renderPokemon(p.id); };
                suggestions.appendChild(div);
            });
            suggestions.style.display = 'block';
        } else { suggestions.style.display = 'none'; }
    });
};

// --- RENDERIZADO DE FICHA ---
const renderPokemon = (id) => {
    const p = POKEDEX[id];
    if (!p) return;
    CURRENT_POKE_ID = id;

    const header = document.getElementById('pokemonHeader');
    header.style.display = 'flex';
    header.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" style="width:100px;">
        <div class="pokemon-info">
            <h2>${p.name} (#${p.id})</h2>
            <div id="egg-groups-display">
                ${p.egg_groups.map(g => `<span class="type-badge" style="background:#555">${g}</span>`).join('')}
            </div>
        </div>
    `;

    const grid = document.getElementById('movesGrid');
    grid.innerHTML = '';
    const eggMoves = p.moves.egg || [];

    eggMoves.forEach(moveId => {
        const moveData = MOVES[moveId];
        if (!moveData) return;

        const card = document.createElement('div');
        card.className = 'move-card';
        card.innerHTML = `
            <div class="move-header" onclick="this.parentElement.querySelector('.parents-container').classList.toggle('show')">
                <span class="move-name">${moveData.name}</span>
                <span class="type-badge" style="background:${TYPE_COLORS[moveData.type] || '#777'}">${moveData.type}</span>
            </div>
            <div class="parents-container" id="chain-container-${moveId}">
                ${renderChainSelector(id, moveId)}
            </div>
        `;
        grid.appendChild(card);
    });
};

// --- SELECTOR DE RUTAS ---
const renderChainSelector = (pokeId, moveId) => {
    const routes = CHAINS[pokeId]?.[moveId];
    if (!routes || routes.length === 0) return `<div style="padding:15px; color:#888;">No breeding data found (check build_chains.py).</div>`;

    let buttonsHtml = `<div style="display:flex; gap:5px; padding:10px; background:#000; overflow-x:auto;">`;
    routes.forEach((_, i) => {
        buttonsHtml += `<button class="method-badge method-level" style="cursor:pointer; border:none;" onclick="window.switchRoute('${moveId}', ${i})">Route ${i+1}</button>`;
    });
    buttonsHtml += `</div><div id="route-content-${moveId}" style="padding:15px;">${generateHumanSteps(routes[0])}</div>`;
    return buttonsHtml;
};

window.switchRoute = (moveId, index) => {
    const routes = CHAINS[CURRENT_POKE_ID]?.[moveId];
    const container = document.getElementById(`route-content-${moveId}`);
    if (routes && routes[index]) container.innerHTML = generateHumanSteps(routes[index]);
};

// --- LÓGICA HUMANA MEJORADA (DIRECTOS + CADENAS) ---
const generateHumanSteps = (routeData) => {
    // CASO A: PADRE DIRECTO (Es una Lista [])
    if (Array.isArray(routeData)) {
        const finalPoke = POKEDEX[CURRENT_POKE_ID].name;
        return `
            <div style="background: #2e7d32; padding: 12px; border-radius: 5px; margin-bottom: 10px;">
                <b style="color: #fff; font-size: 0.9rem;">DIRECT BREEDING</b>
                <p style="font-size: 0.85rem; color: #eee; margin: 5px 0;">Breed your <b style="color:#f48fb1;">${finalPoke} Female (♀️)</b> with one of these <b>Males (♂️)</b>:</p>
                <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
                    ${routeData.map(p => `
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
                            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" style="width:24px;">
                            <span style="font-size:0.85rem;"><b>${p.name}</b> - ${p.method === 'level' ? 'Level '+p.lvl : p.method.toUpperCase()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // CASO B: CADENA COMPLEJA (Es un Diccionario {})
    const flatten = (node) => {
        if (node.bridge_name) return [node, ...flatten(node.next_step)];
        return [node]; 
    };

    const flatChain = flatten(routeData);
    const origin = flatChain.pop(); 
    const bridges = flatChain; 

    let html = `
        <div style="background: #455a64; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #607d8b;">
            <b style="color: #fff; font-size: 0.9rem;">STEP 1: The Origin</b>
            <p style="font-size: 0.85rem; color: #eee; margin: 5px 0;">Obtain a <b>Male (♂️)</b> with the move:</p>
            <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
                ${origin.map(p => `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" style="width:24px;">
                        <span style="font-size:0.85rem;">${p.name} (${p.method === 'level' ? 'Lvl '+p.lvl : p.method.toUpperCase()})</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    bridges.reverse().forEach((step, index) => {
        html += `
            <div style="border-left: 2px solid #4fc3f7; margin-left: 10px; padding-left: 15px; margin-bottom: 15px;">
                <b style="color: #4fc3f7; font-size: 0.9rem;">STEP ${index + 2}: Intermediate Breeding</b>
                <p style="font-size: 0.85rem; color: #ccc; margin: 5px 0;">
                    Breed the <b>Male (♂️)</b> from the previous step with a:<br>
                    <span style="color:#f48fb1; font-weight:bold;">${step.bridge_name} Female (♀️)</span>.
                </p>
                <p style="font-size: 0.75rem; color: #ffa726;">⚠️ Ensure you get a <b>${step.bridge_name} MALE</b> for the next step.</p>
            </div>
        `;
    });

    const finalPoke = POKEDEX[CURRENT_POKE_ID].name;
    html += `
        <div style="background: #1565c0; padding: 10px; border-radius: 5px;">
            <b style="color: #fff; font-size: 0.9rem;">FINAL STEP: Your Target</b>
            <p style="font-size: 0.85rem; color: #eee; margin: 5px 0;">Breed that last Male with your <b style="color:#f48fb1;">${finalPoke} Female (♀️)</b>.</p>
            <p style="font-size: 0.9rem; color: #afffba; font-weight:bold; margin-top:5px; text-align:center;">✨ Move inherited! ✨</p>
        </div>
    `;

    return html;
};

	// --- LÓGICA DE LA TARJETA DE AUTOR ---
function toggleAuthorCard() {
    const modal = document.getElementById('author-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function copyNick() {
    const nick = "albertovgYT";
    navigator.clipboard.writeText(nick).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ COPIED"; // En inglés cambiar a "✅ COPIED"
        btn.style.background = "#00e676";
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "#444";
        }, 2000);
    });
}