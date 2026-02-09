/* --- APPLICATION STATE --- */
let currentStepIndex = 0;
let steps = [];
let config = { 
    selectedStats: [], 
    value: 31, 
    nature: false,
    natureName: "Adamant"
};

// Mapping Stats to Asset Filenames (Same files as Spanish version)
const ASSETS_IMG_MAP = {
    "HP": "brazal_ps.png",
    "Atk": "brazal_atk.png",
    "Def": "brazal_def.png",
    "SpA": "brazal_spa.png",
    "SpD": "brazal_spd.png",
    "Spe": "brazal_vel.png"
};

// Mapping Stats to REAL Game Item Names (English)
const ITEM_NAME_MAP = {
    "HP": "Power Weight",
    "Atk": "Power Bracer",
    "Def": "Power Belt",
    "SpA": "Power Lens",
    "SpD": "Power Band",
    "Spe": "Power Anklet"
};

// --- COMPLETE DICTIONARY (25 NATURES - ENGLISH) ---
const NATURE_DATA = {
    // +Attack
    "Adamant": { up: "Atk", down: "SpA" },
    "Brave":   { up: "Atk", down: "Spe" },
    "Lonely":  { up: "Atk", down: "Def" },
    "Naughty": { up: "Atk", down: "SpD" },

    // +Defense
    "Bold":    { up: "Def", down: "Atk" },
    "Relaxed": { up: "Def", down: "Spe" }, 
    "Impish":  { up: "Def", down: "SpA" },
    "Lax":     { up: "Def", down: "SpD" },

    // +Sp. Attack
    "Modest":  { up: "SpA", down: "Atk" },
    "Quiet":   { up: "SpA", down: "Spe" },
    "Mild":    { up: "SpA", down: "Def" },
    "Rash":    { up: "SpA", down: "SpD" },

    // +Sp. Defense
    "Calm":    { up: "SpD", down: "Atk" },
    "Sassy":   { up: "SpD", down: "Spe" },
    "Careful": { up: "SpD", down: "SpA" },
    "Gentle":  { up: "SpD", down: "Def" },

    // +Speed
    "Jolly":   { up: "Spe", down: "SpA" },
    "Timid":   { up: "Spe", down: "Atk" },
    "Hasty":   { up: "Spe", down: "Def" },
    "Naive":   { up: "Spe", down: "SpD" },

    // Neutral
    "Hardy":   { up: null, down: null },
    "Docile":  { up: null, down: null },
    "Serious": { up: null, down: null },
    "Bashful": { up: null, down: null }, 
    "Quirky":  { up: null, down: null }
};

function getNatureEvaluation(natName, selectedStats) {
    // Safety check
    if (!NATURE_DATA[natName]) return { color: "orange", text: "Neutral" };

    const data = NATURE_DATA[natName];
    
    // CASE 0: NEUTRAL NATURE (e.g. Hardy, Docile)
    if (data.up === null && data.down === null) {
        return { color: "#ffd700", text: "Neutral" }; // Gold color
    }

    // CASE 1: BAD (Red) - Lowers a stat YOU selected in the main menu
    if (selectedStats.includes(data.down)) {
        return { color: "#ff5252", text: "Bad" }; 
    }

    // CASE 2: EXCELLENT (Green) - Raises a needed stat
    // (Since it passed the Red check, we know it doesn't lower anything important)
    if (selectedStats.includes(data.up)) {
        return { color: "#00e676", text: "Excellent" }; 
    }

    // CASE 3: INEFFICIENT (Orange) - Raises something unneeded
    return { color: "orange", text: "Inefficient" };
}

/* --- INITIALIZATION --- */
window.onload = function() {
    // Visual Reset
    document.getElementById('nature-check').checked = false;
    document.querySelectorAll('.stat-check input').forEach(cb => cb.checked = false);
    toggleNatureInput();
    updateCounter();
    
    // Load if exists
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
        label.innerText = "Current Target: Empty (Select 2+)";
        label.style.color = "#888";
    } else {
        label.innerText = `Current Target: ${count}x${type}`;
        label.style.color = "#00e676";
    }
}

function toggleNatureInput() {
    const isChecked = document.getElementById('nature-check').checked;
    const input = document.getElementById('nature-select');
    input.style.display = isChecked ? 'block' : 'none';
}

/* --- PERSISTENCE (ENGLISH KEYS) --- */
function loadProgress() {
    // Note: Keys changed to '_en' to avoid conflict with Spanish version
    const savedConfig = localStorage.getItem('breeder_config_final_v4_en');
    const savedSteps = localStorage.getItem('breeder_steps_final_v4_en');
    const savedIndex = localStorage.getItem('breeder_index_final_v4_en');

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
            localStorage.removeItem('breeder_config_final_v4_en');
            localStorage.removeItem('breeder_steps_final_v4_en');
            localStorage.removeItem('breeder_index_final_v4_en');
        }
    }
}

function saveProgress() {
    localStorage.setItem('breeder_config_final_v4_en', JSON.stringify(config));
    localStorage.setItem('breeder_steps_final_v4_en', JSON.stringify(steps));
    localStorage.setItem('breeder_index_final_v4_en', currentStepIndex.toString());
}

/* --- MAIN LOGIC --- */
function startBreeding() {
    config.selectedStats = [];
    document.querySelectorAll('.stat-check input:checked').forEach(cb => {
        config.selectedStats.push(cb.value);
    });

	// --- NEW LOGIC: REORDER BASED ON MOTHER PREFERENCE ---
    const preferredStart = document.getElementById('starting-stat-select').value;
    
    if (preferredStart && config.selectedStats.includes(preferredStart)) {
        // 1. Remove that stat from current position
        config.selectedStats = config.selectedStats.filter(s => s !== preferredStart);
        // 2. Add it to the BEGINNING (Mother Line)
        config.selectedStats.unshift(preferredStart);
    }
    // -----------------------------------------------------

    if (config.selectedStats.length < 2) {
        alert("Please select at least 2 Stats.");
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
    if(confirm("Delete everything and start over?")) {
        // Only clear English keys
        localStorage.removeItem('breeder_config_final_v4_en');
        localStorage.removeItem('breeder_steps_final_v4_en');
        localStorage.removeItem('breeder_index_final_v4_en');
        location.reload();
    }
}

/* --- RECURSIVE GENERATOR --- */
function buildTree(statsArray, hasNature) {
    createPokemonRecipe(statsArray, hasNature, true);
}

function createPokemonRecipe(stats, nature, isMainLine) {
    // BASE CASE
    if (stats.length === 1) {
        return { stats: stats, nature: nature, isBase: true };
    }

    let newStat = stats[stats.length - 1];
    let commonStats = [];
    let statsForB = [];
    
    if (nature) {
        // Logic WITH Nature
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = [...commonStats, newStat];
    } else {
        // Logic WITHOUT Nature
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = stats.slice(1, stats.length);       
    }

    // RECURSION
    let parentA_Config = createPokemonRecipe(commonStats, nature, isMainLine);
    let parentB_Config = createPokemonRecipe(statsForB, false, false);

    // ITEM DEFINITION
    let itemA, itemB;
    if (nature) {
        itemA = "Everstone";
        itemB = ITEM_NAME_MAP[newStat];
    } else {
        itemA = ITEM_NAME_MAP[commonStats[0]];
        itemB = ITEM_NAME_MAP[newStat];
    }

    // TITLES AND DESCRIPTIONS
    let natText = nature ? ` (w/ ${config.natureName})` : "";
    let stepTitle = `FUSION ${stats.length}x${config.value}${natText}`;
    
    if (!isMainLine) {
        stepTitle = `CREATING FODDER ${stats.length}x${config.value}`;
    }

    let desc = "";
    if (nature) {
        desc = `MOTHER: Has [${commonStats.join(", ")}] and keeps Nature with EVERSTONE.\n`;
        desc += `FATHER: Has [${statsForB.join(", ")}] and gives the new stat with ${ITEM_NAME_MAP[newStat]}.\n`;
        desc += `\n✅ 100% SAFE: Stats [${commonStats.join(", ")}] are inherited fixed because both parents have them (Full Overlap).`;
    } else {
        desc = `MOTHER: Has [${commonStats.join(", ")}] (Holds ${ITEM_NAME_MAP[commonStats[0]]}).\n`;
        desc += `FATHER: Has [${statsForB.join(", ")}] (Holds ${ITEM_NAME_MAP[newStat]}).`;
    }

    let childGenderCost = isMainLine ? "GENDER COST: FEMALE" : "GENDER COST: MALE";

    // ADD STEP
    steps.push({
        title: stepTitle,
        desc: desc,
        pA: { 
            stats: parentA_Config.stats, 
            item: itemA, 
            nat: parentA_Config.nature, 
            gender: "Female", 
            role: isMainLine ? "MOTHER (Main)" : "MOTHER (For Fodder)", 
        },
        pB: { 
            stats: parentB_Config.stats, 
            item: itemB, 
            nat: false, 
            gender: "Male", 
            role: "FATHER (Fodder)", 
        },
        child: { 
            stats: stats, 
            nat: nature,
            note: isMainLine ? "New Main Mother" : "New Fodder Ready",
            cost: childGenderCost
        }
    });

    return { stats: stats, nature: nature, isBase: false };
}

function generateShoppingList() {
    const listDiv = document.getElementById('shopping-list-items');
    listDiv.innerHTML = "";
    
    // --- 1. BLUE NOTE (Info) ---
    let blueNote = document.createElement('div');
    blueNote.className = 'info-note-blue';
    blueNote.innerHTML = `ℹ️ <strong>BREEDING REQUIREMENT:</strong><br>All Pokemon (Males and Females) must be in the <strong>SAME EGG GROUP</strong>.<br>You can also use <strong>Dittos</strong> (universal), but check if the price is worth it.`;
    listDiv.appendChild(blueNote);

    // --- 2. COUNTERS (Exact Math) ---
    let everstoneCount = 0;
    let powerItemsCount = {}; // To count Power Items
    let fodderMalesCount = {}; // To count Base Males by Stat

    // Loop through steps to count exactly what is needed
    steps.forEach(step => {
        // PARENT A
        if (step.pA.item === "Everstone") {
            everstoneCount++;
        } else {
            let item = step.pA.item;
            if (!powerItemsCount[item]) powerItemsCount[item] = 0;
            powerItemsCount[item]++;
        }

        // PARENT B (Fodder)
        if (step.pB.item === "Everstone") {
            everstoneCount++;
        } else {
            // 1. Count the item
            let item = step.pB.item;
            if (!powerItemsCount[item]) powerItemsCount[item] = 0;
            powerItemsCount[item]++;

            // 2. Identify which STAT corresponds to this item (for the Male list)
            // (e.g., If item is "Power Weight", it's an HP Male)
            let statFound = null;
            for (const [key, val] of Object.entries(ITEM_NAME_MAP)) {
                if (val === item) { // val is "Power Weight", key is "HP"
                    statFound = key; 
                    break;
                }
            }
            
            if (statFound) {
                if (!fodderMalesCount[statFound]) fodderMalesCount[statFound] = 0;
                fodderMalesCount[statFound]++;
            }
        }
    });

    // --- 3. CREATE VISUAL LIST ---
    const itemsToShow = [];

    // A) BASE FEMALE (Mother)
    let motherStat = config.selectedStats[0]; 
    let motherTitle = config.nature 
        ? `Base Female 1x${config.value} (${motherStat}) + Nat. ${config.natureName}` 
        : `Base Female 1x${config.value} (${motherStat})`;

    itemsToShow.push({
        name: motherTitle,
        count: 1,
        icon: "genero_f.png"
    });

    // B) BASE MALES (Broken down by Stat)
    for (const [stat, count] of Object.entries(fodderMalesCount)) {
        itemsToShow.push({
            name: `Base Males 1x${config.value} (<strong>${stat}</strong>)`,
            count: count,
            icon: "genero_m.png"
        });
    }

    // C) EVERSTONES
    if (config.nature && everstoneCount > 0) {
        itemsToShow.push({ 
            name: "Everstone (CONSUMED)", 
            count: everstoneCount, 
            icon: "piedraeterna.png"
        });
    }

    // D) POWER ITEMS
    for (const [itemName, count] of Object.entries(powerItemsCount)) {
        let icon = "brazal_atk.png"; 
        // Find correct icon based on English Name
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === itemName) {
                icon = ASSETS_IMG_MAP[statKey];
                break;
            }
        }
        itemsToShow.push({ 
            name: `${itemName} (CONSUMED)`, 
            count: count, 
            icon: icon
        });
    }

    // --- 4. RENDER HTML (With Checkboxes) ---
    itemsToShow.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        
        // Styles for clickability
        div.style.cursor = 'pointer';
        div.style.userSelect = 'none'; 

        // Click Logic: Toggle class and checkbox
        div.onclick = function() { 
            this.classList.toggle('comprado'); 
            let chk = this.querySelector('input');
            if(chk) chk.checked = !chk.checked;
        };

        // INTERNAL HTML
        // Note: We use ../../assets/ because this file is inside languages/US/
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <input type="checkbox" style="pointer-events:none; transform: scale(1.2);"> 
                <img src="../../assets/${item.icon}" style="width:32px; height:32px; object-fit:contain;">
                <span style="font-size: 0.95em;">${item.name}</span>
            </div>
            <div style="background:var(--highlight); color:#000; padding:2px 8px; border-radius:4px; font-weight:bold;">
                x${item.count}
            </div>
        `;
        listDiv.appendChild(div);
    });

    // Final Note
    let noteDiv = document.createElement('div');
    noteDiv.className = 'shopping-note';
    noteDiv.innerHTML = `<strong>TIP:</strong> Tap items to cross them out as you get them.`;
    listDiv.appendChild(noteDiv);
}

/* --- RENDERING --- */
function renderStep() {
    const step = steps[currentStepIndex];
    const val = config.value;

    document.getElementById('step-title').innerText = step.title;
    document.getElementById('step-desc').innerText = step.desc;
    document.getElementById('step-counter').innerText = `Step ${currentStepIndex + 1} of ${steps.length}`;
    document.getElementById('progress-fill').style.width = ((currentStepIndex + 1) / steps.length) * 100 + "%";

    renderCard('card-parent-a', 'stats-a', 'item-img-a', 'item-name-a', step.pA, val);
    renderCard('card-parent-b', 'stats-b', 'item-img-b', 'item-name-b', step.pB, val);
    
    // Render Child
    let childHtml = "";
    step.child.stats.forEach(s => {
        childHtml += `<div class="stat-row"><span>${s}</span><span class="stat-val perfect">${val}</span></div>`;
    });
    
    if (step.child.nat) {
        childHtml += `<div class="stat-row" style="color:gold"><span>${config.natureName}</span><span class="stat-val perfect">OK</span></div>`;
    }
    
    document.getElementById('stats-child').innerHTML = childHtml;
    document.getElementById('child-note').innerText = step.child.note;

    // Cost Badge
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

    let oldCost = card.querySelector('.gender-cost-badge');
    if (oldCost) oldCost.remove();

    // Fix Image Path for Gender
    card.querySelector('.gender-icon').src = "../../assets/" + (data.gender === "Female" ? "genero_f.png" : "genero_m.png");
    card.querySelector('.role-badge').innerText = data.role;
    
    if (data.nat) {
        card.classList.add('has-nature');
        let badge = document.createElement('div');
        badge.className = 'nature-badge';
        // Fix Image Path for Nature Icon
        badge.innerHTML = `<img src="../../assets/nature_icon.png" class="nature-icon-img"> ${config.natureName}`;
        card.appendChild(badge);
    }

    let html = "";
    data.stats.forEach(s => {
        html += `<div class="stat-row"><span>${s}</span><span class="stat-val perfect">${val}</span></div>`;
    });
    
    if (data.nat) {
        const evaluation = getNatureEvaluation(config.natureName, config.selectedStats);
        html += `<div class="stat-row" style="color:${evaluation.color}; border-top:1px dashed #555; margin-top:5px; padding-top:2px;">
                    <span>${config.natureName}</span>
                    <span style="font-weight:bold">${evaluation.text}</span>
                 </div>`;
    }
    document.getElementById(statsId).innerHTML = html;

    // Item Icon
    let icon = "pokeball.png";
    let itemName = data.item;

    if (itemName === "Everstone") {
        icon = "piedraeterna.png";
    } else {
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === itemName) {
                icon = ASSETS_IMG_MAP[statKey];
                break;
            }
        }
        if (icon === "pokeball.png" && itemName.includes("Power")) icon = "brazal_atk.png";
    }
    
    // Fix Image Path for Item
    document.getElementById(imgId).src = "../../assets/" + icon;
    document.getElementById(txtId).innerText = itemName;
}

function nextStep() {
    if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        renderStep();
        saveProgress();
    } else {
        alert("PROJECT FINISHED! Congratulations.");
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
        saveProgress();
    }
}

/* --- NEW FUNCTION: UPDATE STARTING OPTIONS --- */
function updateStartingOptions() {
    const checkboxes = document.querySelectorAll('.stat-check input:checked');
    const container = document.getElementById('starting-stat-container');
    const select = document.getElementById('starting-stat-select');
    
    // Safety check
    if (!container || !select) return;

    if (checkboxes.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Save current selection
    const currentVal = select.value;
    select.innerHTML = ""; // Clear options

    checkboxes.forEach(cb => {
        let option = document.createElement('option');
        option.value = cb.value;
        option.text = cb.value; // e.g. HP, Atk...
        select.appendChild(option);
    });

    // Restore selection if possible
    if (currentVal) {
        let options = Array.from(select.options);
        if (options.some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    }
}