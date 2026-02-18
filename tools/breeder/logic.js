/* --- ESTADO DE LA APLICACIÓN --- */
let currentStepIndex = 0;
let steps = [];
let rawIngredients = [];
let checkedMaterials = [];
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

// --- DICCIONARIO COMPLETO (25 NATURALEZAS) ---
const NATURE_DATA = {
    // +Ataque
    "Firme":   { up: "Atk", down: "SpA" },
    "Audaz":   { up: "Atk", down: "Spe" },
    "Huraña":  { up: "Atk", down: "Def" },
    "Pícara":  { up: "Atk", down: "SpD" },

    // +Defensa
    "Osada":   { up: "Def", down: "Atk" },
    "Plácida": { up: "Def", down: "Spe" }, 
    "Agitada": { up: "Def", down: "SpA" },
    "Floja":   { up: "Def", down: "SpD" },

    // +Ataque Especial
    "Modesta": { up: "SpA", down: "Atk" },
    "Mansa":   { up: "SpA", down: "Spe" },
    "Afable":  { up: "SpA", down: "Def" },
    "Alocada": { up: "SpA", down: "SpD" },

    // +Defensa Especial
    "Serena":  { up: "SpD", down: "Atk" },
    "Grosera": { up: "SpD", down: "Spe" },
    "Cauta":   { up: "SpD", down: "SpA" },
    "Amable":  { up: "SpD", down: "Def" },

    // +Velocidad
    "Alegre":  { up: "Spe", down: "SpA" },
    "Miedosa": { up: "Spe", down: "Atk" },
    "Activa":  { up: "Spe", down: "Def" },
    "Ingenua": { up: "Spe", down: "SpD" },

    // Neutras (No suben ni bajan nada)
    "Fuerte":  { up: null, down: null },
    "Dócil":   { up: null, down: null },
    "Seria":   { up: null, down: null },
    "Tímida":  { up: null, down: null }, 
    "Rara":    { up: null, down: null }
};

function getNatureEvaluation(natName, selectedStats) {
    // Seguridad: Si la naturaleza no existe en la BD, devolvemos neutro
    if (!NATURE_DATA[natName]) return { color: "orange", text: "Neutra" };

    const data = NATURE_DATA[natName];
    
    // CASO 0: NATURALEZA NEUTRA
    if (data.up === null && data.down === null) {
        return { color: "#ffd700", text: "Neutra" }; // Color Oro
    }

    // CASO 1: ROJO (PELIGRO) - La naturaleza baja un stat que TÚ has marcado en la lista inicial
    if (selectedStats.includes(data.down)) {
        return { color: "#ff5252", text: "Desfavorable" }; 
    }

    // CASO 2: VERDE (EXCELENTE) - La naturaleza sube un stat que quieres
    // (Como ya ha pasado el filtro rojo, sabemos que no baja nada importante)
    if (selectedStats.includes(data.up)) {
        return { color: "#00e676", text: "Excelente" }; 
    }

    // CASO 3: NARANJA (INEFICIENTE) - Sube algo que no pediste, pero no rompe nada
    return { color: "orange", text: "Ineficiente" };
}

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
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateCounter);
        cb.addEventListener('change', updateStartingOptions); 
    });
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
    const savedIngredients = localStorage.getItem('breeder_ingredients_v4');
    const savedChecked = localStorage.getItem('breeder_checked_v4');

    if (savedConfig && savedSteps && savedIndex) {
        try {
            config = JSON.parse(savedConfig);
            steps = JSON.parse(savedSteps);
            currentStepIndex = parseInt(savedIndex);
            if (savedIngredients) rawIngredients = JSON.parse(savedIngredients);
            if (savedChecked) checkedMaterials = JSON.parse(savedChecked);

            if (steps.length > 0) {
                // 1. Ocultar inicio y mostrar pasos
                document.getElementById('config-panel').classList.add('hidden');
                document.getElementById('shopping-panel').classList.add('hidden');
                document.getElementById('step-panel').classList.remove('hidden');
                
                // 2. Regenerar lógica visual
                renderStep();
                renderRoadmap();

                // 3. RECUPERAR LISTA DE MATERIALES EN SEGUNDO PLANO
                generateShoppingList(); // Genera la lista en el panel principal (oculto)
                
                // Copiar al sidebar (Como hace goToSteps)
                const source = document.getElementById('shopping-list-items');
                const target = document.getElementById('sidebar-content');
                if (source && target) {
                    target.innerHTML = source.innerHTML;
                    
                    // Reactivar clicks en el sidebar para que guarden estado
                    const items = target.querySelectorAll('.shop-item');
                    items.forEach(item => {
                        item.onclick = function() {
                            this.classList.toggle('comprado');
                            let chk = this.querySelector('input');
                            if(chk) chk.checked = !chk.checked;
                            
                            // Guardar el tachado
                            const nameSpan = this.querySelector('span');
                            if (nameSpan) {
                                const txt = nameSpan.innerText;
                                if (this.classList.contains('comprado')) {
                                    if (!checkedMaterials.includes(txt)) checkedMaterials.push(txt);
                                } else {
                                    checkedMaterials = checkedMaterials.filter(x => x !== txt);
                                }
                                saveProgress();
                            }
                        };
                    });
                }

                // 4. ENCENDER BOTONES (Pero mantener paneles cerrados)
                const matBtn = document.getElementById('materials-btn');
                const mapBtn = document.getElementById('roadmap-btn');
                if (matBtn) matBtn.style.display = 'block';
                if (mapBtn) mapBtn.style.display = 'flex';
            }
        } catch (e) {
            console.error("Error cargando save:", e);
            localStorage.clear();
        }
    }
}

function saveProgress() {
    localStorage.setItem('breeder_config_final_v4', JSON.stringify(config));
    localStorage.setItem('breeder_steps_final_v4', JSON.stringify(steps));
    localStorage.setItem('breeder_index_final_v4', currentStepIndex.toString());
    localStorage.setItem('breeder_ingredients_v4', JSON.stringify(rawIngredients));
    localStorage.setItem('breeder_checked_v4', JSON.stringify(checkedMaterials));
}

/* --- LÓGICA PRINCIPAL --- */
function startBreeding() {
    config.selectedStats = [];
    document.querySelectorAll('.stat-check input:checked').forEach(cb => {
        config.selectedStats.push(cb.value);
    });

	// --- LÓGICA NUEVA: REORDENAR SEGÚN PREFERENCIA DE MADRE ---
    const preferredStart = document.getElementById('starting-stat-select').value;
    
    // Si el usuario eligió algo y ese algo está en la lista de seleccionados...
    if (preferredStart && config.selectedStats.includes(preferredStart)) {
        // 1. Quitamos ese stat de donde esté
        config.selectedStats = config.selectedStats.filter(s => s !== preferredStart);
        // 2. Lo ponemos el PRIMERO de la lista (Línea Materna)
        config.selectedStats.unshift(preferredStart);
    }
    // -----------------------------------------------------------

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

    // ACTIVAR MATERIALES (IZQUIERDA)
    const source = document.getElementById('shopping-list-items');
    const target = document.getElementById('sidebar-content');
    const btn = document.getElementById('materials-btn');

    if (source && target && btn) {
        target.innerHTML = source.innerHTML;
        
        // Sincronizar checkboxes visualmente
        const sourceChecks = source.querySelectorAll('input[type="checkbox"]');
        const targetChecks = target.querySelectorAll('input[type="checkbox"]');
        for(let i = 0; i < sourceChecks.length; i++) {
            if(targetChecks[i]) targetChecks[i].checked = sourceChecks[i].checked;
        }

        // --- LÓGICA DE CLICK CON GUARDADO ---
        const items = target.querySelectorAll('.shop-item');
        items.forEach(item => {
            item.onclick = function() {
                this.classList.toggle('comprado');
                let chk = this.querySelector('input');
                if(chk) chk.checked = !chk.checked;

                // Guardar en memoria
                const nameSpan = this.querySelector('span');
                if (nameSpan) {
                    const txt = nameSpan.innerText;
                    if (this.classList.contains('comprado')) {
                        if (!checkedMaterials.includes(txt)) checkedMaterials.push(txt);
                    } else {
                        checkedMaterials = checkedMaterials.filter(x => x !== txt);
                    }
                    saveProgress();
                }
            };
        });

        btn.style.display = 'block';
    }

    renderRoadmap();
    const mapBtn = document.getElementById('roadmap-btn');
    if(mapBtn) mapBtn.style.display = 'flex';
}

function resetApp() {
    if(confirm("¿Borrar todo y empezar de cero?")) {
        // Ocultar Materiales (IZQUIERDA)
        const matBtn = document.getElementById('materials-btn');
        const matSide = document.getElementById('materials-sidebar');
        if(matBtn) matBtn.style.display = 'none';
        if(matSide) matSide.style.left = '-350px'; 

        // Ocultar Roadmap (DERECHA)
        const mapBtn = document.getElementById('roadmap-btn');
        const mapSide = document.getElementById('roadmap-sidebar');
        if(mapBtn) mapBtn.style.display = 'none';
        if(mapSide) mapSide.style.right = '-350px'; 

        localStorage.clear();
        location.reload();
    }
}

/* --- GENERADOR RECURSIVO CON GÉNEROS --- */
function buildTree(statsArray, hasNature) {
    rawIngredients = []; // Limpiamos la lista
    // La línea principal empieza pidiendo una HEMBRA (Madre del proyecto)
    createPokemonRecipe(statsArray, hasNature, true, "Hembra");
}

function createPokemonRecipe(stats, nature, isMainLine, requiredGender) {
    // CASO BASE: Ingrediente 1x31 (Compra/Captura)
    if (stats.length === 1) {
        rawIngredients.push({
            stat: stats[0],
            gender: requiredGender,
            isMain: isMainLine // <--- ESTO ES LA CLAVE QUE USAMOS LUEGO
        });
        return { stats: stats, nature: nature, isBase: true };
    }

    let newStat = stats[stats.length - 1];
    let commonStats = [];
    let statsForB = [];
    
    // Lógica de herencia
    if (nature) {
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = [...commonStats, newStat];
    } else {
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = stats.slice(1, stats.length);       
    }

    // Recursividad (A siempre Hembra, B siempre Macho)
    let parentA_Config = createPokemonRecipe(commonStats, nature, isMainLine, "Hembra");
    let parentB_Config = createPokemonRecipe(statsForB, false, false, "Macho");

    // Objetos
    let itemA, itemB;
    if (nature) {
        itemA = "Piedraeterna";
        itemB = ITEM_NAME_MAP[newStat];
    } else {
        itemA = ITEM_NAME_MAP[commonStats[0]];
        itemB = ITEM_NAME_MAP[newStat];
    }

    // --- AQUÍ ARREGLAMOS LOS TEXTOS QUE TE MOLESTABAN ---
    let natText = nature ? ` + NATURALEZA (${config.natureName})` : "";
    let stepTitle = "";
    let desc = "";

    if (isMainLine) {
        stepTitle = `🏆 TU PROYECTO: FUSIÓN ${stats.length}x${config.value}${natText}`;
        desc = `ESTE ES UN PASO PRINCIPAL.\nVas a mejorar a tu Madre Principal usando un Sacrificio Macho.\n\n`;
        desc += `🔸 MADRE (Principal): Hereda los stats base [${commonStats.join(", ")}].\n`;
        desc += `🔹 PADRE (Sacrificio): Aporta el nuevo stat [${newStat}] para completar.`;
    } else {
        stepTitle = `⚙️ PREPARANDO SACRIFICIO ${stats.length}x${config.value}`;
        desc = `ESTE PASO ES SOLO PARA CREAR MATERIALES.\nNecesitas crear un Macho fuerte para dárselo luego a tu Madre Principal.\n\n`;
        desc += `🔸 MADRE (Sacrificio): Tiene [${commonStats.join(", ")}].\n`;
        desc += `🔹 PADRE (Sacrificio): Tiene [${statsForB.join(", ")}].`;
    }

    let childGenderCost = isMainLine ? "REQUISITO: HEMBRA (Tu Proyecto)" : "REQUISITO: MACHO (Para usar luego)";

    steps.push({
        title: stepTitle,
        desc: desc,
        pA: { 
            stats: parentA_Config.stats, 
            item: itemA, 
            nat: parentA_Config.nature, 
            gender: "Hembra", 
            role: isMainLine ? "MADRE (Principal)" : "MADRE (Sacrificio)", 
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
            note: isMainLine ? "PROYECTO AVANZADO" : "SACRIFICIO LISTO",
            cost: childGenderCost
        }
    });

    return { stats: stats, nature: nature, isBase: false };
}

function generateShoppingList() {
    const listDiv = document.getElementById('shopping-list-items');
    listDiv.innerHTML = "";
    
    let blueNote = document.createElement('div');
    blueNote.className = 'info-note-blue';
    blueNote.innerHTML = `
    ℹ️ <strong>REQUISITO DE CRÍA:</strong><br>
    Todos los Pokémon deben ser del <strong>MISMO GRUPO HUEVO</strong>. También puedes usar <strong>Dittos</strong>.<br><br>
    ✨ <strong>OPTIMIZADO:</strong> Hemos separado Machos, Hembras y tu Madre Principal.
    `;
    listDiv.appendChild(blueNote);

    let mainMotherIng = null;
    let otherIngredients = [];

    for (let ing of rawIngredients) {
        if (ing.isMain && ing.gender === "Hembra" && !mainMotherIng) {
            mainMotherIng = ing;
        } else {
            otherIngredients.push(ing);
        }
    }

    let totalFemales = {}; 
    let totalMales = {};   
    
    otherIngredients.forEach(ing => {
        if (ing.gender === "Hembra") {
            if (!totalFemales[ing.stat]) totalFemales[ing.stat] = 0;
            totalFemales[ing.stat]++;
        } else {
            if (!totalMales[ing.stat]) totalMales[ing.stat] = 0;
            totalMales[ing.stat]++;
        }
    });

    const itemsToShow = [];

    if (mainMotherIng) {
        itemsToShow.push({
            name: `👑 MADRE BASE (Tu Proyecto) 1x${config.value} en ${mainMotherIng.stat}`,
            count: 1,
            icon: "genero_f.png",
            isSpecial: true
        });
    }

    for (const [stat, count] of Object.entries(totalFemales)) {
        itemsToShow.push({
            name: `Hembras (Sacrificio) 1x${config.value} de ${stat}`,
            count: count,
            icon: "genero_f.png"
        });
    }

    for (const [stat, count] of Object.entries(totalMales)) {
        itemsToShow.push({
            name: `Machos (Sacrificio) 1x${config.value} de ${stat}`,
            count: count,
            icon: "genero_m.png"
        });
    }

    let everstoneCount = 0;
    let powerItemsCount = {};
    
    steps.forEach(step => {
        [step.pA, step.pB].forEach(p => {
            if (p.item === "Piedraeterna") everstoneCount++;
            else {
                if (!powerItemsCount[p.item]) powerItemsCount[p.item] = 0;
                powerItemsCount[p.item]++;
            }
        });
    });

    if (config.nature && everstoneCount > 0) {
        itemsToShow.push({ name: "Piedraeterna (SE CONSUMEN)", count: everstoneCount, icon: "piedraeterna.png" });
    }

    for (const [itemName, count] of Object.entries(powerItemsCount)) {
        let icon = "brazal_atk.png";
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === itemName) { icon = ASSETS_IMG_MAP[statKey]; break; }
        }
        itemsToShow.push({ name: `${itemName} (SE CONSUMEN)`, count: count, icon: icon });
    }

    itemsToShow.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        
        // RECUPERAR ESTADO TACHADO
        // Como el nombre tiene HTML a veces, usamos un truco simple limpiando etiquetas para comparar o usamos el nombre puro generado
        // Para simplificar, comparamos el texto plano que se generará en el span
        let cleanName = item.name.replace(/<[^>]*>?/gm, ''); // Quita etiquetas HTML para la ID
        
        // Comprobamos si está en la lista de guardados (Comparando texto aproximado)
        let isChecked = checkedMaterials.some(saved => saved.includes(cleanName) || cleanName.includes(saved));
        
        if (isChecked) div.classList.add('comprado');

        if (item.isSpecial) {
            div.style.border = "2px solid #ffd700";
            div.style.background = "rgba(255, 215, 0, 0.1)";
        }

        // CLICK EN LISTA PREVIA (Antes de ir a pasos)
        div.onclick = function() { 
            this.classList.toggle('comprado'); 
            let chk = this.querySelector('input');
            if(chk) chk.checked = !chk.checked;
            
            // Guardamos también aquí por si recarga en esta pantalla
            const txt = this.querySelector('span').innerText;
            if (this.classList.contains('comprado')) {
                if (!checkedMaterials.includes(txt)) checkedMaterials.push(txt);
            } else {
                checkedMaterials = checkedMaterials.filter(x => x !== txt);
            }
            saveProgress();
        };

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <input type="checkbox" ${isChecked ? 'checked' : ''} style="pointer-events:none; transform: scale(1.2);"> 
                <img src="../../assets/${item.icon}" style="width:32px; height:32px; object-fit:contain;">
                <span style="font-size: 0.95em;">${item.name}</span>
            </div>
            <div style="background:var(--highlight); color:#000; padding:2px 8px; border-radius:4px; font-weight:bold;">
                x${item.count}
            </div>
        `;
        listDiv.appendChild(div);
    });
    
    let noteDiv = document.createElement('div');
    noteDiv.className = 'shopping-note';
    noteDiv.innerHTML = `<strong>TIP:</strong> Toca los elementos de la lista para <strong>tacharlos</strong>. Se guardarán si cierras la página.`;
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
	renderRoadmap(); // Sincroniza el mapa al cambiar de paso
}

function renderCard(cardId, statsId, imgId, txtId, data, val) {
    const card = document.getElementById(cardId);
    card.classList.remove('has-nature');
    const existingBadge = card.querySelector('.nature-badge');
    if(existingBadge) existingBadge.remove();

    // Limpieza de coste en padres
    let oldCost = card.querySelector('.gender-cost-badge');
    if (oldCost) oldCost.remove();

    card.querySelector('.gender-icon').src = "../../assets/" + (data.gender === "Hembra" ? "genero_f.png" : "genero_m.png");
    card.querySelector('.role-badge').innerText = data.role;
    
    // Solo mostrar badge de naturaleza si data.nat es true (Madres línea principal)
    if (data.nat) {
        card.classList.add('has-nature');
        let badge = document.createElement('div');
        badge.className = 'nature-badge';
        // AQUÍ ESTÁ TU ICONO
        badge.innerHTML = `<img src="../../assets/nature_icon.png" class="nature-icon-img"> ${config.natureName}`;
        card.appendChild(badge);
    }

    let html = "";
    data.stats.forEach(s => {
        html += `<div class="stat-row"><span>${s}</span><span class="stat-val perfect">${val}</span></div>`;
    });
    
    // Fila de naturaleza en los stats (CON LA LÓGICA DE COLORES NUEVA)
    if (data.nat) {
        // Calculamos si es buena, mala o regular
        const evaluation = getNatureEvaluation(config.natureName, config.selectedStats);
        
        html += `<div class="stat-row" style="color:${evaluation.color}; border-top:1px dashed #555; margin-top:5px; padding-top:2px;">
                    <span>${config.natureName}</span>
                    <span style="font-weight:bold">${evaluation.text}</span>
                 </div>`;
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
    
    document.getElementById(imgId).src = "../../assets/" + icon;
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

/* --- NUEVA FUNCIÓN: ACTUALIZAR DESPLEGABLE DE INICIO --- */
function updateStartingOptions() {
    const checkboxes = document.querySelectorAll('.stat-check input:checked');
    const container = document.getElementById('starting-stat-container');
    const select = document.getElementById('starting-stat-select');
    
    // Si no hay stats, ocultamos. Si hay 1 o más, mostramos.
    if (!container || !select) return; // Seguridad

    if (checkboxes.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Guardamos la selección actual por si acaso
    const currentVal = select.value;
    select.innerHTML = ""; // Limpiamos opciones anteriores

    checkboxes.forEach(cb => {
        let option = document.createElement('option');
        option.value = cb.value;
        option.text = cb.value; // Ej: HP, Atk...
        select.appendChild(option);
    });

    // Intentamos restaurar la selección previa si sigue existiendo
    if (currentVal) {
        let options = Array.from(select.options);
        if (options.some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    }
}

/* --- FUNCIONES NUEVAS: SALTO Y ROADMAP --- */

function jumpToStep() {
    const input = document.getElementById('jump-input');
    let val = parseInt(input.value);

    // Validación: debe ser número, mayor que 0 y menor o igual al total
    if (isNaN(val) || val < 1 || val > steps.length) {
        alert("Paso inválido / Invalid step"); 
        return;
    }

    // Los arrays empiezan en 0, así que restamos 1
    currentStepIndex = val - 1;
    renderStep();
    saveProgress();
    
    // Actualizar visualmente el roadmap
    renderRoadmap();
}

function renderRoadmap() {
    const container = document.getElementById('roadmap-content');
    if (!container) return;
    
    container.innerHTML = ""; 

    steps.forEach((step, index) => {
        let card = document.createElement('div');
        
        let isMain = step.title.includes("TU PROYECTO"); 
        let borderColor = isMain ? "#ff9800" : "#444"; 
        let bgColor = isMain ? "rgba(255, 152, 0, 0.05)" : "#222";
        
        if (index === currentStepIndex) {
            borderColor = "#00e676";
            bgColor = "rgba(0, 230, 118, 0.15)";
        }

        card.style.cssText = `
            background: ${bgColor};
            border-left: 4px solid ${borderColor};
            border-top: 1px solid #333;
            border-right: 1px solid #333;
            border-bottom: 1px solid #333;
            border-radius: 5px;
            padding: 5px; 
            cursor: pointer;
            margin-bottom: 5px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        card.onmouseover = () => card.style.background = "#2a2a2a";
        card.onmouseout = () => card.style.background = bgColor;

        const getIconForItem = (itemName) => {
            if (!itemName) return null;
            if (itemName === "Piedraeterna") return "piedraeterna.png";
            for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
                if (realName === itemName) return ASSETS_IMG_MAP[statKey];
            }
            return "brazal_atk.png";
        };

        const iconA = getIconForItem(step.pA.item);
        const iconB = getIconForItem(step.pB.item);

        let cleanTitle = step.title
            .replace("🏆 TU PROYECTO: ", "")
            .replace("⚙️ PREPARANDO SACRIFICIO ", "")
            .replace("FUSIÓN ", "")
            .replace("NATURALEZA", "NAT");

        card.innerHTML = `
            <div style="font-size: 9px; color: #888; display:flex; justify-content:space-between; margin-bottom:2px;">
                <strong>#${index + 1}</strong>
                ${index === currentStepIndex ? '<span style="color:#00e676;">● ACTIVO</span>' : ''}
            </div>

            <div style="display:flex; justify-content: space-between; align-items: flex-start; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px;">
                
                <div style="display:flex; flex-direction:column; align-items:center; width:48%;">
                    <div style="position: relative; width: 28px; height: 28px;">
                        <img src="../../assets/pokeball.png" style="width: 100%; height: 100%; opacity: 0.6;">
                        
                        <img src="../../assets/${step.pA.gender === 'Hembra' ? 'genero_f.png' : 'genero_m.png'}" 
                             style="position: absolute; top: -4px; right: -4px; width: 10px; background: rgba(0,0,0,0.8); border-radius: 50%; padding: 1px; border:1px solid #444;">
                        
                        ${iconA ? `<img src="../../assets/${iconA}" style="position: absolute; bottom: -4px; left: -4px; width: 14px; background: #222; border-radius: 50%; border: 1px solid #555;">` : ''}
                    </div>
                    <span style="font-size: 9px; color: #ccc; margin-top: 4px;">${step.pA.stats.length}x31</span>
                </div>

                <div style="font-size: 9px; color: #555; align-self:center;">+</div>

                <div style="display:flex; flex-direction:column; align-items:center; width:48%;">
                    <div style="position: relative; width: 28px; height: 28px;">
                        <img src="../../assets/pokeball.png" style="width: 100%; height: 100%; opacity: 0.6;">
                        
                        <img src="../../assets/${step.pB.gender === 'Hembra' ? 'genero_f.png' : 'genero_m.png'}" 
                             style="position: absolute; top: -4px; right: -4px; width: 10px; background: rgba(0,0,0,0.8); border-radius: 50%; padding: 1px; border:1px solid #444;">
                        
                        ${iconB ? `<img src="../../assets/${iconB}" style="position: absolute; bottom: -4px; left: -4px; width: 14px; background: #222; border-radius: 50%; border: 1px solid #555;">` : ''}
                    </div>
                    <span style="font-size: 9px; color: #ccc; margin-top: 4px;">${step.pB.stats.length}x31</span>
                </div>

            </div>

            <div style="text-align:center; font-size: 7px; color: #555; margin-top:-3px;">▼</div>

            <div style="text-align:center; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 3px; border: 1px dashed #444;">
                 <span style="font-size: 9px; color: white; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${cleanTitle}
                </span>
            </div>
        `;

        card.onclick = function() {
            currentStepIndex = index;
            renderStep();
            saveProgress();
            renderRoadmap(); 
        };

        container.appendChild(card);
    });
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