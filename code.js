document.addEventListener("DOMContentLoaded", () => {
    // DOM-Elemente
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsClose = document.getElementById("settings-close");
    const drawer = document.getElementById("settings-drawer");
    const overlay = document.getElementById("drawer-overlay");
    const userForm = document.getElementById("user-form");
    const btnExample = document.getElementById("btn-example");
    const gridContainer = document.getElementById("life-grid");

    // Statistik-Elemente
    const statTitle = document.getElementById("stat-title");
    const statPercent = document.getElementById("stat-percent");
    const statAbsolute = document.getElementById("stat-absolute");
    const statPastPercent = document.getElementById("stat-past-percent");

    // Default Benutzer-Daten (Fallback falls localStorage leer)
    const defaultData = {
        vorname: "Gast",
        geschlecht: "divers",
        alter: 25,
        lebenserwartung: 80,
        wohnort: "München",
        beruf: "Entwickler",
        schlaf: 8,
        arbeitsstunden: 40,
        handy: "03:00",
        tv: "01:30",
        sport: 3,
        freunde: 10,
        rauchen: 0,
        suessigkeiten: "mittel",
        groesse: 180,
        gewicht: 75,
        alkohol_konsum: "selten",
        alkohol_liter: 0.5,
        blutdruck: "normal",
        stress: "normal",
        urlaub: 30,
        krankheitstage: 5,
        gehalt: 2500,
        vermoegen: 15000
    };

    // Beispiel-Musterdaten (35-jährige Person)
    const exampleData = {
        vorname: "Maximilian",
        geschlecht: "maennlich",
        alter: 35,
        lebenserwartung: 82,
        wohnort: "Hamburg",
        beruf: "Projektleiter",
        schlaf: 7.5,
        arbeitsstunden: 38,
        handy: "02:45",
        tv: "01:15",
        sport: 4,
        freunde: 8,
        rauchen: 5,
        suessigkeiten: "mittel",
        groesse: 182,
        gewicht: 81,
        alkohol_konsum: "regelmaessig",
        alkohol_liter: 1.2,
        blutdruck: "normal",
        stress: "hoch",
        urlaub: 30,
        krankheitstage: 4,
        gehalt: 3200,
        vermoegen: 45000
    };

    let userData = {};

    // --- DRAWER (EINSTELLUNGEN) STEUERUNG ---
    function openDrawer() {
        drawer.classList.add("open");
        overlay.classList.add("active");
    }

    function closeDrawer() {
        drawer.classList.remove("open");
        overlay.classList.remove("active");
    }

    settingsToggle.addEventListener("click", openDrawer);
    settingsClose.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);

    // --- FORMULAR & LOCAL STORAGE ---
    function loadUserData() {
        const stored = localStorage.getItem("lifeInWeeksData");
        if (stored) {
            userData = JSON.parse(stored);
        } else {
            userData = { ...defaultData };
            // Wenn keine Daten da sind, direkt Einstellungs-Drawer öffnen
            openDrawer();
        }
        fillFormFields(userData);
    }

    function fillFormFields(data) {
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) field.value = data[key];
        });
    }

    userForm.addEventListener("submit", (e) => {
        e.preventDefault();
        Object.keys(defaultData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                // Konvertiere Zahlenwerte
                if (field.type === "number") {
                    userData[key] = parseFloat(field.value) || 0;
                } else {
                    userData[key] = field.value;
                }
            }
        });
        localStorage.setItem("lifeInWeeksData", JSON.stringify(userData));
        closeDrawer();
        initVisualization();
    });

    btnExample.addEventListener("click", () => {
        fillFormFields(exampleData);
    });

    // --- HILFSFUNKTIONEN ZUR ZEIT-UMRECHNUNG ---
    function timeToHours(timeStr) {
        if (!timeStr || !timeStr.includes(":")) return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours + (minutes / 60);
    }

    // --- DOT-GRID ERSTELLEN ---
    function initVisualization() {
        gridContainer.innerHTML = "";
        const totalMonths = userData.lebenserwartung * 12;
        const passedMonths = userData.alter * 12;

        let currentDecadeBlock = null;

        for (let month = 0; month < totalMonths; month++) {
            const yearIndex = Math.floor(month / 12);
            const decadeIndex = Math.floor(yearIndex / 10);
            const monthInYear = month % 12;

            // Alle 10 Jahre einen neuen Dekaden-Container erstellen
            if (monthInYear === 0 && yearIndex % 10 === 0) {
                currentDecadeBlock = document.createElement("div");
                currentDecadeBlock.className = "decade-block";
                gridContainer.appendChild(currentDecadeBlock);
            }

            // Am Jahresanfang eine neue Zeile starten
            let yearRow;
            if (monthInYear === 0) {
                yearRow = document.createElement("div");
                yearRow.className = "year-row";
                yearRow.dataset.year = yearIndex;

                const label = document.createElement("span");
                label.className = "year-label";
                label.innerText = yearIndex === 0 ? "Geburt" : `${yearIndex} J.`;
                yearRow.appendChild(label);

                const monthsContainer = document.createElement("div");
                monthsContainer.className = "months-container";
                yearRow.appendChild(monthsContainer);

                currentDecadeBlock.appendChild(yearRow);
            } else {
                yearRow = currentDecadeBlock.querySelector(`.year-row[data-year="${yearIndex}"]`);
            }

            const monthsContainer = yearRow.querySelector(".months-container");
            const dot = document.createElement("div");
            
            // Dot-ID ist die laufende Nummer des Monats
            dot.className = "dot";
            dot.id = `m-${month}`;

            // Initialisierung als Vergangen oder Zukunft
            if (month < passedMonths) {
                dot.classList.add("past");
            } else {
                dot.classList.add("future");
            }

            monthsContainer.appendChild(dot);
        }

        // Standard-Statistik aufrufen
        setActiveFilter("standard");
    }

    // --- FILTER- & STATISTIK-LOGIK ---
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            setActiveFilter(e.target.dataset.filter);
        });
    });

    function setActiveFilter(filterType) {
        const totalMonths = userData.lebenserwartung * 12;
        const passedMonths = userData.alter * 12;
        const dots = document.querySelectorAll(".dot");

        // Alle Punkte in Standardzustand zurücksetzen
        dots.forEach(dot => {
            dot.classList.remove("highlighted", "dimmed");
        });

        let fraction = 0; // Welcher Anteil des Lebens wird durch diesen Faktor belegt?
        let labelText = "";
        let customSubtext = "";
        let totalStatHours = 0; // Für die Berechnung

        switch (filterType) {
            case "standard":
                fraction = passedMonths / totalMonths;
                labelText = "Gelebte Lebenszeit";
                customSubtext = `${passedMonths} von ${totalMonths} Monaten gelebt`;
                break;

            case "schlaf":
                // Stunden Schlaf pro Tag im Verhältnis zu 24 Stunden
                fraction = userData.schlaf / 24;
                labelText = "Verschlafenes Leben";
                break;

            case "arbeit":
                // Stunden Arbeit pro Woche im Verhältnis zu den Gesamtstunden einer Woche (168h)
                fraction = userData.arbeitsstunden / 168;
                labelText = "Arbeitszeit im Leben";
                break;

            case "handy":
                // Handynutzung pro Tag im Verhältnis zu 24 Std
                fraction = timeToHours(userData.handy) / 24;
                labelText = "Handy-Bildschirmzeit";
                break;

            case "freunde":
                // Freunde-Zeit pro Woche im Verhältnis zu 168h
                fraction = userData.freunde / 168;
                labelText = "Zeit mit Freunden";
                break;

            case "sport":
                // Sport-Zeit pro Woche im Verhältnis zu 168h
                fraction = userData.sport / 168;
                labelText = "Zeit für Sport";
                break;

            case "tv":
                // TV-Zeit pro Tag im Verhältnis zu 24 Std
                fraction = timeToHours(userData.tv) / 24;
                labelText = "Fernsehkonsum";
                break;
        }

        // Ziel-Anzahl der einzufärbenden Punkte berechnen
        const targetHighlightCount = Math.round(totalMonths * fraction);

        // UI Statistiken aktualisieren
        statTitle.innerText = labelText;
        statPercent.innerText = `${(fraction * 100).toFixed(1)}%`;
        
        if (filterType === "standard") {
            statAbsolute.innerText = customSubtext;
            statPastPercent.innerText = "100%";
        } else {
            const absoluteMonths = Math.round(totalMonths * fraction);
            const absoluteYears = (absoluteMonths / 12).toFixed(1);
            statAbsolute.innerText = `Das entspricht ca. ${absoluteYears} Jahren (${absoluteMonths} Monaten) deines gesamten Lebens.`;
            
            // Anteil am bisherigen Leben (immer gleich dem aktuellen Prozentsatz)
            statPastPercent.innerText = `${(fraction * 100).toFixed(1)}%`;
        }

        // --- SCHLANGEN-ANIMATION ---
        // Färbe die berechneten x% der Punkte nacheinander fließend ein
        let delay = 0;
        const maxAnimationDuration = 1500; // Maximale Dauer in ms für den gesamten Durchlauf
        const stepDelay = Math.max(1, maxAnimationDuration / totalMonths); // Dynamischer Delay pro Punkt

        dots.forEach((dot, index) => {
            setTimeout(() => {
                // Überprüfen, ob die aktuelle Filter-Klasse immer noch aktiv ist
                const currentActiveBtn = document.querySelector(".filter-btn.active");
                if (!currentActiveBtn || currentActiveBtn.dataset.filter !== filterType) return;

                if (filterType === "standard") {
                    // Standardfall: Nutzt das native Profil (Vergangenheit ausgefüllt, Zukunft leer)
                    dot.classList.remove("dimmed");
                } else {
                    // Analyse-Fälle: Die ersten X % des Lebens werden farblich akzentuiert, der Rest verblasst
                    if (index < targetHighlightCount) {
                        dot.classList.add("highlighted");
                    } else {
                        dot.classList.add("dimmed");
                    }
                }
            }, delay);
            delay += stepDelay;
        });
    }

    // App initialisieren
    loadUserData();
    initVisualization();
});
