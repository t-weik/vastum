(function() {
    // ============ KONFIGURATION ============
    const STORAGE_KEY = 'vastum_life_data';
    
    // Felddefinitionen für das Formular
    const fieldDefinitions = [
        { key: 'vorname', label: 'Vorname', type: 'text', default: '' },
        { key: 'geschlecht', label: 'Geschlecht', type: 'select', options: ['weiblich', 'männlich', 'divers'], default: 'divers' },
        { key: 'alterHeute', label: 'Alter heute', type: 'number', default: 30 },
        { key: 'wohnort', label: 'Wohnort', type: 'text', default: 'Berlin' },
        { key: 'beruf', label: 'Beruf', type: 'text', default: 'Designer' },
        { key: 'schlafStd', label: 'Schlaf (h/Tag)', type: 'number', default: 7.5, step: 0.5 },
        { key: 'handyStd', label: 'Handy (hh:mm/Tag)', type: 'text', default: '02:45', placeholder: 'hh:mm' },
        { key: 'sportStdWoche', label: 'Sport (h/Woche)', type: 'number', default: 2.5, step: 0.5 },
        { key: 'freundeStdWoche', label: 'Freunde (h/Woche)', type: 'number', default: 5, step: 0.5 },
        { key: 'tvStd', label: 'TV/Stream (hh:mm/Tag)', type: 'text', default: '01:30' },
        { key: 'rauchenStk', label: 'Rauchen (Stk/Woche)', type: 'number', default: 0 },
        { key: 'suessigkeiten', label: 'Süßigkeiten (Portionen/Woche)', type: 'number', default: 3 },
        { key: 'koerpergroesse', label: 'Körpergröße (cm)', type: 'number', default: 175 },
        { key: 'gewicht', label: 'Gewicht (kg)', type: 'number', default: 72 },
        { key: 'alkohol', label: 'Alkohol', type: 'select', options: ['nie', 'selten', 'regelmäßig'], default: 'selten' },
        { key: 'alkoholLiter', label: 'Alkohol (l/Woche)', type: 'number', default: 0.3, step: 0.1 },
        { key: 'blutdruck', label: 'Blutdruck', type: 'select', options: ['niedrig', 'normal', 'hoch'], default: 'normal' },
        { key: 'stress', label: 'Stress', type: 'select', options: ['niedrig', 'normal', 'hoch'], default: 'normal' },
        { key: 'arbeitsStdWoche', label: 'Arbeit (h/Woche)', type: 'number', default: 38 },
        { key: 'urlaubstage', label: 'Urlaubstage/Jahr', type: 'number', default: 28 },
        { key: 'krankheitstage', label: 'Krankheitstage/Jahr', type: 'number', default: 5 },
        { key: 'gehalt', label: 'Gehalt (€/Jahr)', type: 'number', default: 48000 },
        { key: 'vermoegen', label: 'Vermögen (€)', type: 'number', default: 25000 }
    ];

    // Kategorien für die Overlay-Visualisierung
    const categories = [
        { key: 'schlaf', label: '😴 Schlaf', hoursPerWeek: (d) => parseFloat(d.schlafStd || 0) * 7 },
        { key: 'handy', label: '📱 Social Media', hoursPerWeek: (d) => parseTimeToHours(d.handyStd) * 7 },
        { key: 'freunde', label: '👥 Freunde', hoursPerWeek: (d) => parseFloat(d.freundeStdWoche || 0) },
        { key: 'sport', label: '🏋️ Sport', hoursPerWeek: (d) => parseFloat(d.sportStdWoche || 0) },
        { key: 'arbeit', label: '💼 Arbeit', hoursPerWeek: (d) => parseFloat(d.arbeitsStdWoche || 0) },
        { key: 'tv', label: '📺 TV/Stream', hoursPerWeek: (d) => parseTimeToHours(d.tvStd) * 7 },
        { key: 'rauchen', label: '🚬 Rauchen', hoursPerWeek: (d) => 0.1 * (parseFloat(d.rauchenStk || 0)) }
    ];

    // ============ HILFSFUNKTIONEN ============
    function parseTimeToHours(str) {
        if (!str || typeof str !== 'string') return 0;
        const parts = str.split(':');
        if (parts.length === 2) {
            const h = parseFloat(parts[0]) || 0;
            const m = parseFloat(parts[1]) || 0;
            return h + m / 60;
        }
        return parseFloat(str) || 0;
    }

    function getSampleData() {
        return {
            vorname: 'Mila',
            geschlecht: 'weiblich',
            alterHeute: 29,
            wohnort: 'Hamburg',
            beruf: 'Architektin',
            schlafStd: 7.5,
            handyStd: '02:30',
            sportStdWoche: 3,
            freundeStdWoche: 6,
            tvStd: '01:15',
            rauchenStk: 0,
            suessigkeiten: 4,
            koerpergroesse: 168,
            gewicht: 63,
            alkohol: 'selten',
            alkoholLiter: 0.5,
            blutdruck: 'normal',
            stress: 'normal',
            arbeitsStdWoche: 40,
            urlaubstage: 30,
            krankheitstage: 4,
            gehalt: 52000,
            vermoegen: 38000
        };
    }

    // ============ STATE MANAGEMENT ============
    let currentData = null;
    let activeOverlay = null; // Kategorie-Key oder null
    let viewMode = 'grid'; // 'grid' oder 'single'

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn('Fehler beim Laden der Daten:', e);
            }
        }
        return getSampleData();
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // ============ DOM REFERENZEN ============
    const settingsPanel = document.getElementById('settingsPanel');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const settingsToggle = document.getElementById('settingsToggle');
    const formContainer = document.getElementById('formContainer');
    const sampleBtn = document.getElementById('sampleBtn');
    const saveBtn = document.getElementById('saveBtn');
    const greetingName = document.getElementById('greetingName');
    const categoryContainer = document.getElementById('categoryContainer');
    const dynamicViz = document.getElementById('dynamicVisualization');
    const viewToggle = document.getElementById('viewToggle');

    // ============ FORMULAR RENDERING ============
    function renderForm(data) {
        formContainer.innerHTML = '';
        
        fieldDefinitions.forEach(field => {
            const div = document.createElement('div');
            div.className = 'input-group';
            
            const label = document.createElement('label');
            label.textContent = field.label;
            div.appendChild(label);
            
            if (field.type === 'select') {
                const select = document.createElement('select');
                select.dataset.key = field.key;
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (data[field.key] === opt) option.selected = true;
                    select.appendChild(option);
                });
                div.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.dataset.key = field.key;
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
                input.value = data[field.key] ?? field.default ?? '';
                div.appendChild(input);
            }
            
            formContainer.appendChild(div);
        });
    }

    function collectFormData() {
        const data = {};
        const inputs = formContainer.querySelectorAll('input, select');
        
        inputs.forEach(el => {
            const key = el.dataset.key;
            if (!key) return;
            
            let value = el.value;
            if (el.tagName === 'SELECT') {
                data[key] = value;
            } else {
                if (el.type === 'number') {
                    data[key] = parseFloat(value) || 0;
                } else {
                    data[key] = value;
                }
            }
        });
        
        return data;
    }

    // ============ BERECHNUNGEN ============
    function calculateStats(data) {
        const alter = parseFloat(data.alterHeute) || 30;
        const lebenserwartung = data.geschlecht === 'weiblich' ? 83 : 
                                data.geschlecht === 'männlich' ? 78 : 80;
        const geburtsjahr = new Date().getFullYear() - alter;
        const gesamteWochen = Math.round(lebenserwartung * 52.1429);
        const vergangeneWochen = Math.round(alter * 52.1429);
        const zukuenftigeWochen = gesamteWochen - vergangeneWochen;
        
        return { 
            alter, 
            lebenserwartung, 
            geburtsjahr, 
            gesamteWochen, 
            vergangeneWochen, 
            zukuenftigeWochen,
            prozentVerbraucht: ((vergangeneWochen / gesamteWochen) * 100).toFixed(1)
        };
    }

    // ============ VISUALISIERUNG ============
    function renderVisualization() {
        if (!currentData) return;
        
        const stats = calculateStats(currentData);
        
        if (viewMode === 'grid') {
            renderGridView(stats);
        } else {
            renderSingleView(stats);
        }
    }

    function renderGridView(stats) {
        dynamicViz.innerHTML = `
            <div class="viz-box">
                <div class="weeks-grid" id="weeksGrid"></div>
            </div>
            <div class="fact-box stats-right" id="statsText"></div>
        `;
        
        renderWeeksGrid(stats);
        renderStatsText(stats);
    }

    function renderWeeksGrid(stats) {
        const grid = document.getElementById('weeksGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const { gesamteWochen, vergangeneWochen } = stats;
        
        for (let i = 0; i < gesamteWochen; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            if (i < vergangeneWochen) {
                dot.classList.add('past');
                
                // Overlay-Logik
                if (activeOverlay && currentData) {
                    const cat = categories.find(c => c.key === activeOverlay);
                    if (cat) {
                        const hoursPerWeek = cat.hoursPerWeek(currentData);
                        const fraction = Math.min(hoursPerWeek / 168, 1);
                        
                        if (fraction > 0.03) {
                            const intensity = 0.4 + fraction * 0.6;
                            dot.style.background = `rgba(255, 138, 122, ${intensity})`;
                            dot.style.boxShadow = `0 0 ${6 + fraction * 8}px rgba(255, 107, 94, ${intensity})`;
                        }
                    }
                }
            } else {
                dot.classList.add('future');
            }
            
            dot.title = `Woche ${i + 1}`;
            grid.appendChild(dot);
        }
    }

    function renderStatsText(stats) {
        const box = document.getElementById('statsText');
        if (!box) return;
        
        box.innerHTML = `
            <p><strong>👤 ${currentData.vorname || 'Du'}</strong>, ${currentData.alterHeute} Jahre</p>
            <p>📍 ${currentData.wohnort || ''} · ${currentData.beruf || ''}</p>
            <hr>
            <p>🔹 Vergangene Wochen: <strong>${stats.vergangeneWochen.toLocaleString()}</strong></p>
            <p>🔹 Verbleibende Wochen: <strong>${stats.zukuenftigeWochen.toLocaleString()}</strong></p>
            <p>📊 Lebensanteil verbraucht: <strong>${stats.prozentVerbraucht}%</strong></p>
            <p>🎂 Geburtsjahr: ~${stats.geburtsjahr}</p>
            <p>⏳ Lebenserwartung: ${stats.lebenserwartung} Jahre</p>
        `;
    }

    function renderSingleView(stats) {
        dynamicViz.innerHTML = '<div class="single-view-grid" id="singleViewContainer"></div>';
        const container = document.getElementById('singleViewContainer');
        if (!container) return;
        
        categories.forEach(cat => {
            const hPerWeek = cat.hoursPerWeek(currentData);
            const hoursTotalLife = hPerWeek * stats.gesamteWochen;
            const weeksEquivalent = (hoursTotalLife / 168).toFixed(1);
            
            const item = document.createElement('div');
            item.className = 'single-item';
            item.innerHTML = `
                <span class="single-item-label">${cat.label}</span>
                <span class="single-item-value">⏳ ${weeksEquivalent} Wochen</span>
            `;
            container.appendChild(item);
        });
        
        // Gesamtsumme hinzufügen
        const totalItem = document.createElement('div');
        totalItem.className = 'single-item';
        totalItem.style.borderColor = 'rgba(167, 139, 250, 0.4)';
        totalItem.innerHTML = `
            <span class="single-item-label">📐 Gesamtlebenswochen</span>
            <span class="single-item-value">${stats.gesamteWochen.toLocaleString()} Wochen</span>
        `;
        container.appendChild(totalItem);
    }

    function updateCategoryPills() {
        categoryContainer.innerHTML = '';
        
        categories.forEach(cat => {
            const pill = document.createElement('span');
            pill.className = `pill ${activeOverlay === cat.key ? 'active' : ''}`;
            pill.textContent = cat.label;
            pill.dataset.catKey = cat.key;
            
            pill.addEventListener('click', () => {
                if (activeOverlay === cat.key) {
                    activeOverlay = null;
                } else {
                    activeOverlay = cat.key;
                }
                updateCategoryPills();
                if (viewMode === 'grid') {
                    renderVisualization();
                }
            });
            
            categoryContainer.appendChild(pill);
        });
    }

    // ============ PANEL-STEUERUNG ============
    function showDashboard() {
        settingsPanel.classList.add('hidden-panel');
        dashboardPanel.classList.remove('hidden-panel');
        
        if (currentData) {
            greetingName.innerHTML = `◉ ${currentData.vorname || 'Du'}, deine Wochen`;
        }
        
        activeOverlay = null;
        viewMode = 'grid';
        viewToggle.textContent = '📐 Einzelansicht';
        
        updateCategoryPills();
        renderVisualization();
    }

    function showSettings() {
        dashboardPanel.classList.add('hidden-panel');
        settingsPanel.classList.remove('hidden-panel');
        
        if (currentData) {
            renderForm(currentData);
        }
    }

    // ============ EVENT LISTENER ============
    settingsToggle.addEventListener('click', () => {
        if (settingsPanel.classList.contains('hidden-panel')) {
            showSettings();
        } else {
            if (currentData && currentData.vorname) {
                showDashboard();
            }
        }
    });

    saveBtn.addEventListener('click', () => {
        const newData = collectFormData();
        saveData(newData);
        currentData = newData;
        showDashboard();
    });

    sampleBtn.addEventListener('click', () => {
        const sample = getSampleData();
        renderForm(sample);
    });

    viewToggle.addEventListener('click', () => {
        if (viewMode === 'grid') {
            viewMode = 'single';
            viewToggle.textContent = '🔲 Wochenansicht';
            activeOverlay = null;
            updateCategoryPills();
        } else {
            viewMode = 'grid';
            viewToggle.textContent = '📐 Einzelansicht';
        }
        renderVisualization();
    });

    // ============ INITIALISIERUNG ============
    function init() {
        currentData = loadData();
        
        if (currentData && currentData.vorname) {
            showDashboard();
        } else {
            showSettings();
            renderForm(currentData);
        }
    }

    init();
})();
