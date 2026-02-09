/* --- APPLICATION STATE --- */
let currentStepIndex = 0;
let steps = [];
let rawIngredients = [];
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

/* --- RECURSIVE GENERATOR WITH GENDERS --- */
function buildTree(statsArray, hasNature) {
    rawIngredients = []; // Clear ingredients list
    // Main line starts requiring a FEMALE (Mother)
    createPokemonRecipe(statsArray, hasNature, true, "Female");
}

function createPokemonRecipe(stats, nature, isMainLine, requiredGender) {
    // BASE CASE: 1x31 Ingredient (Buy/Catch)
    if (stats.length === 1) {
        rawIngredients.push({
            stat: stats[0],
            gender: requiredGender,
            isMain: isMainLine // We track if this is the Main Mother line
        });
        
        return { stats: stats, nature: nature, isBase: true };
    }

    let newStat = stats[stats.length - 1];
    let commonStats = [];
    let statsForB = [];
    
    if (nature) {
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = [...commonStats, newStat];
    } else {
        commonStats = stats.slice(0, stats.length - 1); 
        statsForB = stats.slice(1, stats.length);       
    }

    // RECURSION:
    // Parent A MUST always be Female (Mother)
    // Parent B MUST always be Male (Father)
    let parentA_Config = createPokemonRecipe(commonStats, nature, isMainLine, "Female");
    let parentB_Config = createPokemonRecipe(statsForB, false, false, "Male");

    // ITEM DEFINITIONS
    let itemA, itemB;
    if (nature) {
        itemA = "Everstone";
        itemB = ITEM_NAME_MAP[newStat];
    } else {
        itemA = ITEM_NAME_MAP[commonStats[0]];
        itemB = ITEM_NAME_MAP[newStat];
    }

    // --- TEXTS & DESCRIPTIONS (Distinguishing Main Project vs Fodder) ---
    let natText = nature ? ` + NATURE (${config.natureName})` : "";
    let stepTitle = "";
    let desc = "";

    if (isMainLine) {
        stepTitle = `🏆 YOUR PROJECT: FUSION ${stats.length}x${config.value}${natText}`;
        desc = `THIS IS A MAIN STEP.\nYou are improving your Main Mother using a Male Fodder.\n\n`;
        desc += `🔸 MOTHER (Main): Inherits base stats [${commonStats.join(", ")}].\n`;
        desc += `🔹 FATHER (Fodder): Provides the new stat [${newStat}] to complete the step.`;
    } else {
        stepTitle = `⚙️ PREPARING FODDER ${stats.length}x${config.value}`;
        desc = `THIS STEP IS JUST FOR CREATING MATERIALS.\nYou need to create a strong Male to give to your Main Mother later.\n\n`;
        desc += `🔸 MOTHER (Fodder): Has [${commonStats.join(", ")}].\n`;
        desc += `🔹 FATHER (Fodder): Has [${statsForB.join(", ")}].`;
    }

    let childGenderCost = isMainLine ? "REQ: FEMALE (Your Project)" : "REQ: MALE (For later use)";

    // SAVE STEP
    steps.push({
        title: stepTitle,
        desc: desc,
        pA: { 
            stats: parentA_Config.stats, 
            item: itemA, 
            nat: parentA_Config.nature, 
            gender: "Female", 
            role: isMainLine ? "MOTHER (Main)" : "MOTHER (Fodder)", 
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
            note: isMainLine ? "PROJECT ADVANCED" : "FODDER READY",
            cost: childGenderCost
        }
    });

    return { stats: stats, nature: nature, isBase: false };
}

/* --- PRECISE SHOPPING LIST (Optimized) --- */
function generateShoppingList() {
    const listDiv = document.getElementById('shopping-list-items');
    listDiv.innerHTML = "";
    
    // BLUE NOTE (Translated)
    let blueNote = document.createElement('div');
    blueNote.className = 'info-note-blue';
    blueNote.innerHTML = `
        ℹ️ <strong>BREEDING REQUIREMENT:</strong><br>
        All Pokémon (Males and Females) must be from the <strong>SAME EGG GROUP</strong>. You can also use <strong>Dittos</strong> (universal), though check if the price is worth it.
        <br><br>
        ✨ <strong>OPTIMIZED:</strong> We have separated Males, Females, and your Main Mother so you save money and don't get confused.
    `;
    listDiv.appendChild(blueNote);

    // --- 1. SEPARATE MAIN MOTHER FROM FODDER ---
    let mainMotherIng = null;
    let otherIngredients = [];

    for (let ing of rawIngredients) {
        if (ing.isMain && ing.gender === "Female" && !mainMotherIng) {
            mainMotherIng = ing; // Found the jewel
        } else {
            otherIngredients.push(ing);
        }
    }

    // --- 2. COUNT REMAINDER (Fodder) ---
    let totalFemales = {}; 
    let totalMales = {};   
    
    otherIngredients.forEach(ing => {
        if (ing.gender === "Female") {
            if (!totalFemales[ing.stat]) totalFemales[ing.stat] = 0;
            totalFemales[ing.stat]++;
        } else {
            if (!totalMales[ing.stat]) totalMales[ing.stat] = 0;
            totalMales[ing.stat]++;
        }
    });

    // 2. COUNT ITEMS
    let everstoneCount = 0;
    let powerItemsCount = {};
    
    steps.forEach(step => {
        [step.pA, step.pB].forEach(p => {
            if (p.item === "Everstone") everstoneCount++;
            else {
                if (!powerItemsCount[p.item]) powerItemsCount[p.item] = 0;
                powerItemsCount[p.item]++;
            }
        });
    });

    // --- RENDER ---
    const itemsToShow = [];

    // A) THE MAIN MOTHER (Gold Border)
    if (mainMotherIng) {
        itemsToShow.push({
            name: `👑 <strong>MOTHER BASE (Your Project)</strong><br><span style="font-size:0.9em; color:#ccc">Must be 1x${config.value} in ${mainMotherIng.stat}</span>`,
            count: 1,
            icon: "genero_f.png",
            isSpecial: true
        });
    }

    // B) FEMALES (Fodder)
    for (const [stat, count] of Object.entries(totalFemales)) {
        itemsToShow.push({
            name: `Females (Fodder) 1x${config.value} in <strong>${stat}</strong>`,
            count: count,
            icon: "genero_f.png"
        });
    }

    // C) MALES (Fodder)
    for (const [stat, count] of Object.entries(totalMales)) {
        itemsToShow.push({
            name: `Males (Fodder) 1x${config.value} in <strong>${stat}</strong>`,
            count: count,
            icon: "genero_m.png"
        });
    }

    // D) ITEMS
    if (config.nature && everstoneCount > 0) {
        itemsToShow.push({ name: "Everstone (CONSUMED)", count: everstoneCount, icon: "piedraeterna.png" });
    }

    for (const [itemName, count] of Object.entries(powerItemsCount)) {
        let icon = "brazal_atk.png";
        // Map English item names to asset filenames
        for (const [statKey, realName] of Object.entries(ITEM_NAME_MAP)) {
            if (realName === itemName) { icon = ASSETS_IMG_MAP[statKey]; break; }
        }
        itemsToShow.push({ name: `${itemName} (CONSUMED)`, count: count, icon: icon });
    }

    // CREATE HTML
    itemsToShow.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        
        // Special Gold Style for Main Mother
        if (item.isSpecial) {
            div.style.border = "2px solid #ffd700";
            div.style.background = "rgba(255, 215, 0, 0.1)";
        }

        div.onclick = function() { 
            this.classList.toggle('comprado'); 
            let chk = this.querySelector('input');
            if(chk) chk.checked = !chk.checked;
        };

        // IMAGE PATH FIXED: ../../assets/
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
    
    // RED NOTE (Translated)
    let noteDiv = document.createElement('div');
    noteDiv.className = 'shopping-note';
    noteDiv.innerHTML = `<strong>TIP:</strong> Tap items in the list to <strong>cross them off</strong> as you catch or buy them.`;
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