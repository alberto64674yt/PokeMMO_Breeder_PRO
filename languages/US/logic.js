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
    if (!NATURE_DATA[natName]) return { color: "orange", text: "Neutral" };

    const data = NATURE_DATA[natName];
    
    // NEUTRAL CASE
    if (data.up === null && data.down === null) {
        return { color: "orange", text: "Neutral" };
    }

    // BAD CASE (Red) - Lowers a selected stat
    if (selectedStats.includes(data.down)) {
        return { color: "#ff5252", text: "Bad" }; 
    }

    // EXCELLENT CASE (Green) - Raises needed, lowers unneeded
    if (selectedStats.includes(data.up) && !selectedStats.includes(data.down)) {
        return { color: "#00e676", text: "Excellent" }; 
    }

    // INEFFICIENT CASE (Orange)
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
    checkboxes.forEach(cb => cb.addEventListener('change', updateCounter));
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

/* --- SHOPPING LIST --- */
function generateShoppingList() {
    const listDiv = document.getElementById('shopping-list-items');
    listDiv.innerHTML = "";
    
    // --- BLUE NOTE ---
    let blueNote = document.createElement('div');
    blueNote.className = 'info-note-blue';
    blueNote.innerHTML = `ℹ️ <strong>BREEDING REQUIREMENT:</strong><br>All Pokemon (Males and Females) must be in the <strong>SAME EGG GROUP</strong>.<br>You can also use <strong>Dittos</strong> (universal), but check if the price is worth it.`;
    listDiv.appendChild(blueNote);
    
    // Estimate Bases
    let n = config.selectedStats.length;
    let estimatedBase = Math.pow(2, n - 1) * 2; 

    // Count Items
    let itemCounts = {};
    let everstoneCount = 0;

    steps.forEach(step => {
        if (step.pA.item === "Everstone") {
            everstoneCount++;
        } else {
            if (!itemCounts[step.pA.item]) itemCounts[step.pA.item] = 0;
            itemCounts[step.pA.item]++;
        }
        
        if (step.pB.item === "Everstone") {
            everstoneCount++;
        } else {
            if (!itemCounts[step.pB.item]) itemCounts[step.pB.item] = 0;
            itemCounts[step.pB.item]++;
        }
    });

    const items = [];

    // Base Pokemon
    if (config.nature) {
        items.push({ name: `Base Female (Nature ${config.natureName})`, count: 1, icon: "genero_f.png" });
        items.push({ name: `Base Males 1x${config.value} (To Sacrifice)`, count: `~${estimatedBase}`, icon: "genero_m.png" });
    } else {
        items.push({ name: `Base Female 1x${config.value}`, count: 1, icon: "genero_f.png" });
        items.push({ name: `Base Males 1x${config.value} (Rest)`, count: `~${estimatedBase}`, icon: "genero_m.png" });
    }

    // Everstone
    if (config.nature && everstoneCount > 0) {
        items.push({ name: "Everstone (CONSUMED)", count: everstoneCount, icon: "piedraeterna.png" });
    }

    // Power Items
    for (const [name, count] of Object.entries(itemCounts)) {
        let icon = "brazal_atk.png"; // Fallback
        
        // Reverse Lookup: Real Name -> Stat -> Image
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === name) {
                icon = ASSETS_IMG_MAP[statKey];
                break;
            }
        }

        items.push({ name: `${name} (CONSUMED)`, count: count, icon: icon });
    }

    items.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><img src="../../assets/${item.icon}" style="width:30px;"><strong>${item.name}</strong></div><span style="color:var(--highlight); font-weight:bold">x${item.count}</span>`;
        listDiv.appendChild(div);
    });

    let noteDiv = document.createElement('div');
    noteDiv.className = 'shopping-note';
    noteDiv.innerHTML = `<strong>⚠️ NOTE:</strong> EVERYTHING IS CONSUMED (Power Items and Everstones).<br>Buy/Catch step by step.`;
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