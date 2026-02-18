/* --- VARIABLES GLOBALES --- */
let evData = {}; 
const MAX_SINGLE_STAT = 252;
const MAX_TOTAL_EVS = 510;

/* --- INICIALIZACIÓN --- */
window.onload = function() {
    fetch('../../data/ev_data_es.json')
        .then(response => {
            if (!response.ok) throw new Error("CORS Error");
            return response.json();
        })
        .then(data => evData = data)
        .catch(error => {
            console.error(error);
            document.getElementById('status-msg').innerText = "⚠️ Error: Abre esto con Live Server (CORS).";
            document.getElementById('status-msg').style.color = "red";
        });

    const inputs = document.querySelectorAll('.stat-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            updateTotals();
        });
    });
};

/* --- VALIDACIÓN 0-252 --- */
function validateInput(input) {
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0;
    if (val > MAX_SINGLE_STAT) input.value = MAX_SINGLE_STAT;
    else if (val < 0) input.value = 0;
}

/* --- ACTUALIZAR TOTALES --- */
function updateTotals() {
    let currentTotal = 0;
    document.querySelectorAll('.stat-input').forEach(inp => currentTotal += (parseInt(inp.value) || 0));

    const fill = document.getElementById('progress-fill');
    const msg = document.getElementById('status-msg');
    
    document.getElementById('total-display').innerText = `${currentTotal} / ${MAX_TOTAL_EVS}`;
    fill.style.width = Math.min((currentTotal / MAX_TOTAL_EVS) * 100, 100) + "%";

    if (currentTotal < MAX_TOTAL_EVS) {
        fill.style.backgroundColor = "#ff9800"; 
        msg.innerText = `Faltan ${MAX_TOTAL_EVS - currentTotal} EVs.`;
        msg.style.color = "#aaa";
    } else if (currentTotal === MAX_TOTAL_EVS) {
        fill.style.backgroundColor = "#00e676"; 
        msg.innerText = "¡EVs Completos! (510/510)";
        msg.style.color = "#00e676";
    } else {
        fill.style.backgroundColor = "#ff5252"; 
        msg.innerText = `⚠️ ¡TE HAS PASADO! Sobran ${currentTotal - MAX_TOTAL_EVS} EVs.`;
        msg.style.color = "#ff5252";
    }
    return currentTotal;
}

/* --- CÁLCULO FINAL --- */
function calculateHordes() {
    const container = document.getElementById('results-container');
    container.innerHTML = "";

    if (Object.keys(evData).length === 0) {
        container.innerHTML = `<p style="color:red; text-align:center;">Error: Datos no cargados (Usa Live Server).</p>`;
        return;
    }

    if (updateTotals() !== MAX_TOTAL_EVS) {
        container.innerHTML = `<div style="background:rgba(255,82,82,0.1); border:1px solid #ff5252; padding:20px; text-align:center; border-radius:8px; color:#ff5252;"><strong>⚠️ Deben ser 510 EVs exactos.</strong></div>`;
        return;
    }

    // OBTENER MULTIPLICADOR DE ITEM
    const itemMultiplier = parseInt(document.getElementById('item-select').value) || 1;
    
    const region = document.getElementById('region-select').value;
    const regionData = evData[region] || evData["Kanto"];

    const statsMap = { "ev-hp": "HP", "ev-atk": "Atk", "ev-def": "Def", "ev-spa": "SpA", "ev-spd": "SpD", "ev-spe": "Spe" };

    for (const [inputId, statKey] of Object.entries(statsMap)) {
        const val = parseInt(document.getElementById(inputId).value) || 0;
        if (val > 0) {
            const info = regionData[statKey];
            const evPerHorde = info.yield * itemMultiplier;
            const hordesNeeded = Math.ceil(val / evPerHorde);
            
            generateResultCard(statKey, val, info, hordesNeeded, itemMultiplier, container);
        }
    }
}

function generateResultCard(statName, targetEVs, info, hordesCount, multiplier, container) {
    const card = document.createElement('div');
    card.className = 'horde-card';
    
    const colors = { "HP": "#FF5959", "Atk": "#F5AC78", "Def": "#FAE078", "SpA": "#9DB7F5", "SpD": "#A7DB8D", "Spe": "#FA92B2" };
    
    let itemText = "Sin Item / Repartir Exp";
    if (multiplier === 2) itemText = "Brazal Firme (x2)";

    // URL de la imagen (Sprite oficial)
    const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${info.id}.png`;

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="font-size:1.2em; color:${colors[statName] || 'white'};">${statName} - Objetivo: ${targetEVs}</strong>
            <span style="background:#333; padding:4px 8px; border-radius:4px; font-size:0.9em;">${itemText}</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.95em; color:#ddd;">
            <div>
                📍 <strong>${info.location}</strong><br>
                <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                    <img src="${imgUrl}" alt="${info.pokemon}" style="width:40px; height:40px; image-rendering: pixelated;">
                    <span>${info.pokemon} (${info.method})</span>
                </div>
            </div>
            <div style="text-align:right;">
                🎯 <strong>Hordas:</strong> <span style="color:var(--highlight); font-size:1.4em; font-weight:bold;">${hordesCount}</span><br>
                <span style="font-size:0.8em; color:#888;">(Dulce Aroma)</span>
            </div>
        </div>
    `;
    container.appendChild(card);
}

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
        btn.innerHTML = "✅ COPIADO"; // En inglés cambiar a "✅ COPIED"
        btn.style.background = "#00e676";
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "#444";
        }, 2000);
    });
}