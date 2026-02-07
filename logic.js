/* --- ESTADO DE LA APLICACIÓN --- */
let currentStepIndex = 0;
let steps = [];
let config = { 
    selectedStats: [], 
    value: 31, 
    nature: false,
    natureName: "Firme"
};

// Mapeo de Stats a Nombres de Archivos de Imagen
const ASSETS_IMG_MAP = {
    "HP": "brazal_ps.png",
    "Atk": "brazal_atk.png",
    "Def": "brazal_def.png",
    "SpA": "brazal_spa.png",
    "SpD": "brazal_spd.png",
    "Spe": "brazal_vel.png"
};

// Mapeo de Stats a Nombres Reales del Juego (Español)
const ITEM_NAME_MAP = {
    "HP": "Pesa Recia",
    "Atk": "Brazal Recio",
    "Def": "Cinto Recio",
    "SpA": "Lente Recia",
    "SpD": "Banda Recia",
    "Spe": "Franja Recia"
};

/* --- INICIALIZACIÓN --- */
window.onload = function() {
    // Reset visual
    document.getElementById('nature-check').checked = false;
    document.querySelectorAll('.stat-check input').forEach(cb => cb.checked = false);
    toggleNatureInput();
    updateCounter();
    
    // Cargar si existe
    loadProgress();

    // Listeners
    const checkboxes = document.querySelectorAll('.stat-check input');
    checkboxes.forEach(cb => cb.addEventListener('change', updateCounter));
};

function updateCounter() {
    const count = document.querySelectorAll('.stat-check input:checked').length;
    const type = document.getElementById('iv-type').value;
    const label = document.getElementById('target-counter');
    
    if (count < 2) {
        label.innerText = "Objetivo Actual: Vacío (Selecciona 2+)";
        label.style.color = "#888";
    } else {
        label.innerText = `Objetivo Actual: ${count}x${type}`;
        label.style.color = "#00e676";
    }
}

function toggleNatureInput() {
    const isChecked = document.getElementById('nature-check').checked;
    const input = document.getElementById('nature-select');
    input.style.display = isChecked ? 'block' : 'none';
}

/* --- PERSISTENCIA --- */
function loadProgress() {
    const savedConfig = localStorage.getItem('breeder_config_final_v4');
    const savedSteps = localStorage.getItem('breeder_steps_final_v4');
    const savedIndex = localStorage.getItem('breeder_index_final_v4');

    if (savedConfig && savedSteps && savedIndex) {
        try {
            config = JSON.parse(savedConfig);
            steps = JSON.parse(savedSteps);
            currentStepIndex = parseInt(savedIndex);

            if (steps.length > 0) {
                document.getElementById('config-panel').classList.add('hidden');
                document.getElementById('shopping-panel').classList.add('hidden');
                document.getElementById('step-panel').classList.remove('hidden');
                renderStep();
            }
        } catch (e) {
            localStorage.clear();
        }
    }
}

function saveProgress() {
    localStorage.setItem('breeder_config_final_v4', JSON.stringify(config));
    localStorage.setItem('breeder_steps_final_v4', JSON.stringify(steps));
    localStorage.setItem('breeder_index_final_v4', currentStepIndex.toString());
}

/* --- LÓGICA PRINCIPAL --- */
function startBreeding() {
    config.selectedStats = [];
    document.querySelectorAll('.stat-check input:checked').forEach(cb => {
        config.selectedStats.push(cb.value);
    });

    if (config.selectedStats.length < 2) {
        alert("Selecciona al menos 2 Stats.");
        return;
    }

    config.value = parseInt(document.getElementById('iv-type').value);
    config.nature = document.getElementById('nature-check').checked;
    config.natureName = document.getElementById('nature-select').value;

    steps = [];
    buildTree(config.selectedStats, config.nature);
    generateShoppingList();

    document.getElementById('config-panel').classList.add('hidden');
    document.getElementById('shopping-panel').classList.remove('hidden');
}

function goToSteps() {
    document.getElementById('shopping-panel').classList.add('hidden');
    document.getElementById('step-panel').classList.remove('hidden');
    currentStepIndex = 0;
    renderStep();
    saveProgress();
}

function resetApp() {
    if(confirm("¿Borrar todo y empezar de cero?")) {
        localStorage.clear();
        location.reload();
    }
}

/* --- GENERADOR RECURSIVO --- */
function buildTree(statsArray, hasNature) {
    createPokemonRecipe(statsArray, hasNature, true);
}

function createPokemonRecipe(stats, nature, isMainLine) {
    // CASO BASE: Si es 1 stat, retornamos la configuración para que el padre la use,
    // pero NO generamos un paso de crianza (es una compra/captura).
    if (stats.length === 1) {
        return { stats: stats, nature: nature, isBase: true };
    }

    let newStat = stats[stats.length - 1];
    let commonStats = [];
    let statsForB = [];
    
    if (nature) {
        // LÓGICA CON NATURALEZA (100% SEGURA)
        commonStats = stats.slice(0, stats.length - 1); 
        
        // CORRECCIÓN FINAL: Para garantizar el 100% incluso en el primer paso (2x31),
        // el padre (Sacrificio) SIEMPRE debe tener los stats comunes + el nuevo.
        statsForB = [...commonStats, newStat];

    } else {
        // Lógica Sin Naturaleza (Ventana Deslizante)
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = stats.slice(1, stats.length);       
    }

    // RECURSIÓN
    let parentA_Config = createPokemonRecipe(commonStats, nature, isMainLine);
    let parentB_Config = createPokemonRecipe(statsForB, false, false);

    // DEFINICIÓN DE OBJETOS
    let itemA, itemB;
    if (nature) {
        itemA = "Piedraeterna";
        itemB = ITEM_NAME_MAP[newStat];
    } else {
        itemA = ITEM_NAME_MAP[commonStats[0]];
        itemB = ITEM_NAME_MAP[newStat];
    }

    // TÍTULOS Y DESCRIPCIONES
    let natText = nature ? ` (con ${config.natureName})` : "";
    let stepTitle = `FUSIÓN ${stats.length}x${config.value}${natText}`;
    
    if (!isMainLine) {
        stepTitle = `CREANDO SACRIFICIO ${stats.length}x${config.value}`;
    }

    let desc = "";
    if (nature) {
        desc = `MADRE: Tiene [${commonStats.join(", ")}] y conserva la Nat con PIEDRAETERNA.\n`;
        desc += `PADRE: Tiene [${statsForB.join(", ")}] y aporta el nuevo stat con ${ITEM_NAME_MAP[newStat]}.\n`;
        desc += `\n✅ 100% SEGURO: Los stats [${commonStats.join(", ")}] se heredan fijos porque ambos padres los tienen (Solapamiento Total).`;
    } else {
        desc = `MADRE: Tiene [${commonStats.join(", ")}] (Lleva ${ITEM_NAME_MAP[commonStats[0]]}).\n`;
        desc += `PADRE: Tiene [${statsForB.join(", ")}] (Lleva ${ITEM_NAME_MAP[newStat]}).`;
    }

    let childGenderCost = isMainLine ? "PAGAR GÉNERO: HEMBRA" : "PAGAR GÉNERO: MACHO";

    // AÑADIR EL PASO
    steps.push({
        title: stepTitle,
        desc: desc,
        pA: { 
            stats: parentA_Config.stats, 
            item: itemA, 
            nat: parentA_Config.nature, 
            gender: "Hembra", 
            role: isMainLine ? "MADRE (Principal)" : "MADRE (Para Sacrificio)", 
        },
        pB: { 
            stats: parentB_Config.stats, 
            item: itemB, 
            nat: false, 
            gender: "Macho", 
            role: "PADRE (Sacrificio)", 
        },
        child: { 
            stats: stats, 
            nat: nature,
            note: isMainLine ? "Nueva Madre Principal" : "Nuevo Sacrificio Listo",
            cost: childGenderCost
        }
    });

    return { stats: stats, nature: nature, isBase: false };
}

/* --- LISTA DE COMPRA PRECISA --- */
function generateShoppingList() {
    const listDiv = document.getElementById('shopping-list-items');
    listDiv.innerHTML = "";
    
    // --- NUEVO: AVISO AZUL (GRUPO HUEVO / DITTO) ---
    let blueNote = document.createElement('div');
    blueNote.className = 'info-note-blue';
    blueNote.innerHTML = `ℹ️ <strong>REQUISITO DE CRÍA:</strong><br>Todos los Pokémon (Machos y Hembras) deben ser del <strong>MISMO GRUPO HUEVO</strong>.<br>También puedes usar <strong>Dittos</strong> (son universales), aunque revisa si te compensa el precio.`;
    listDiv.appendChild(blueNote);
    // ------------------------------------------------

    // Cálculo estimado de bases
    let n = config.selectedStats.length;
    let estimatedBase = Math.pow(2, n - 1) * 2; 

    // Contar Items Reales escaneando los pasos generados
    let itemCounts = {};
    let everstoneCount = 0;

    steps.forEach(step => {
        // Objeto Padre A
        if (step.pA.item === "Piedraeterna") {
            everstoneCount++;
        } else {
            if (!itemCounts[step.pA.item]) itemCounts[step.pA.item] = 0;
            itemCounts[step.pA.item]++;
        }
        
        // Objeto Padre B
        if (step.pB.item === "Piedraeterna") {
            everstoneCount++;
        } else {
            if (!itemCounts[step.pB.item]) itemCounts[step.pB.item] = 0;
            itemCounts[step.pB.item]++;
        }
    });

    const items = [];

    // Pokémon Base
    if (config.nature) {
        items.push({ name: `Hembra Base (Naturaleza ${config.natureName})`, count: 1, icon: "genero_f.png" });
        items.push({ name: `Machos Base 1x${config.value} (Para sacrificar)`, count: `~${estimatedBase}`, icon: "genero_m.png" });
    } else {
        items.push({ name: `Hembra Base 1x${config.value}`, count: 1, icon: "genero_f.png" });
        items.push({ name: `Machos Base 1x${config.value} (Resto)`, count: `~${estimatedBase}`, icon: "genero_m.png" });
    }

    // Piedraeterna (SE CONSUME)
    if (config.nature && everstoneCount > 0) {
        items.push({ name: "Piedraeterna (SE CONSUMEN)", count: everstoneCount, icon: "piedraeterna.png" });
    }

    // Objetos Recios (Usando nombres reales)
    for (const [name, count] of Object.entries(itemCounts)) {
        // Encontrar el icono basado en el nombre del objeto
        let icon = "brazal_atk.png"; // Fallback
        
        // Búsqueda inversa: Nombre Real -> Stat -> Imagen
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === name) {
                icon = ASSETS_IMG_MAP[statKey];
                break;
            }
        }

        items.push({ name: `${name} (SE CONSUMEN)`, count: count, icon: icon });
    }

    items.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><img src="assets/${item.icon}" style="width:30px;"><strong>${item.name}</strong></div><span style="color:var(--highlight); font-weight:bold">x${item.count}</span>`;
        listDiv.appendChild(div);
    });

    let noteDiv = document.createElement('div');
    noteDiv.className = 'shopping-note';
    noteDiv.innerHTML = `<strong>⚠️ NOTA:</strong> TODO SE CONSUME (Objetos Recios y Piedraeterna).<br>Ve comprando/capturando paso a paso.`;
    listDiv.appendChild(noteDiv);
}

/* --- RENDERIZADO --- */
function renderStep() {
    const step = steps[currentStepIndex];
    const val = config.value;

    document.getElementById('step-title').innerText = step.title;
    document.getElementById('step-desc').innerText = step.desc;
    document.getElementById('step-counter').innerText = `Paso ${currentStepIndex + 1} de ${steps.length}`;
    document.getElementById('progress-fill').style.width = ((currentStepIndex + 1) / steps.length) * 100 + "%";

    renderCard('card-parent-a', 'stats-a', 'item-img-a', 'item-name-a', step.pA, val);
    renderCard('card-parent-b', 'stats-b', 'item-img-b', 'item-name-b', step.pB, val);
    
    // Renderizado del HIJO
    let childHtml = "";
    step.child.stats.forEach(s => {
        childHtml += `<div class="stat-row"><span>${s}</span><span class="stat-val perfect">${val}</span></div>`;
    });
    
    // Solo mostrar "Nature OK" si el hijo tiene naturaleza (Línea materna)
    if (step.child.nat) {
        childHtml += `<div class="stat-row" style="color:gold"><span>${config.natureName}</span><span class="stat-val perfect">OK</span></div>`;
    }
    
    document.getElementById('stats-child').innerHTML = childHtml;
    document.getElementById('child-note').innerText = step.child.note;

    // Badge Coste en el HIJO
    let childCard = document.querySelector('.child-card');
    let existingCost = childCard.querySelector('.gender-cost-badge');
    if (existingCost) existingCost.remove();

    if (step.child.cost) {
        let costBadge = document.createElement('div');
        costBadge.className = 'gender-cost-badge';
        costBadge.innerText = step.child.cost;
        childCard.appendChild(costBadge);
    }
}

function renderCard(cardId, statsId, imgId, txtId, data, val) {
    const card = document.getElementById(cardId);
    card.classList.remove('has-nature');
    const existingBadge = card.querySelector('.nature-badge');
    if(existingBadge) existingBadge.remove();

    // Limpieza de coste en padres
    let oldCost = card.querySelector('.gender-cost-badge');
    if (oldCost) oldCost.remove();

    card.querySelector('.gender-icon').src = "assets/" + (data.gender === "Hembra" ? "genero_f.png" : "genero_m.png");
    card.querySelector('.role-badge').innerText = data.role;
    
    // Solo mostrar badge de naturaleza si data.nat es true (Madres línea principal)
    if (data.nat) {
        card.classList.add('has-nature');
        let badge = document.createElement('div');
        badge.className = 'nature-badge';
        badge.innerHTML = '🧬 ' + config.natureName;
        card.appendChild(badge);
    }

    let html = "";
    data.stats.forEach(s => {
        html += `<div class="stat-row"><span>${s}</span><span class="stat-val perfect">${val}</span></div>`;
    });
    
    // Fila de naturaleza en los stats
    if (data.nat) {
        html += `<div class="stat-row" style="color:gold; border-top:1px dashed #555; margin-top:5px; padding-top:2px;"><span>${config.natureName}</span><span>Favorable</span></div>`;
    }
    document.getElementById(statsId).innerHTML = html;

    // Icono del objeto
    let icon = "pokeball.png";
    let itemName = data.item;

    if (itemName === "Piedraeterna") {
        icon = "piedraeterna.png";
    } else {
        // Buscar el icono correspondiente al nombre real del objeto
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === itemName) {
                icon = ASSETS_IMG_MAP[statKey];
                break;
            }
        }
        // Fallback por si acaso
        if (icon === "pokeball.png" && itemName.includes("Reci")) icon = "brazal_atk.png";
    }
    
    document.getElementById(imgId).src = "assets/" + icon;
    document.getElementById(txtId).innerText = itemName;
}

function nextStep() {
    if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        renderStep();
        saveProgress();
    } else {
        alert("¡PROYECTO TERMINADO! Felicidades.");
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
        saveProgress();
    }
}