document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("life-grid");
    const drawer = document.getElementById("settings-drawer");
    const userForm = document.getElementById("user-form");

    // Lade Daten oder Setze Defaults
    let userData = JSON.parse(localStorage.getItem("lifeData")) || {
        vorname: "", alter: 30, lebenserwartung: 85, 
        schlaf: 8, handy: "03:00", tv: "01:30", 
        arbeitsstunden: 40, sport: 4, freunde: 6
    };

    const toggleDrawer = (state) => drawer.classList.toggle("open", state);
    document.getElementById("settings-toggle").onclick = () => toggleDrawer(true);
    document.getElementById("settings-close").onclick = () => toggleDrawer(false);

    // Hilfsfunktion: Zeit-String zu Dezimalstunden
    const parseTime = (str) => {
        if(!str || !str.includes(":")) return 0;
        const [h, m] = str.split(":").map(Number);
        return h + (m / 60);
    };

    document.getElementById("btn-example").onclick = () => {
        const ex = { vorname: "Maximilian", alter: 35, lebenserwartung: 85, schlaf: 7.5, handy: "03:20", tv: "01:15", arbeitsstunden: 38, sport: 5, freunde: 12 };
        Object.keys(ex).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = ex[key]; });
    };

    userForm.onsubmit = (e) => {
        e.preventDefault();
        const newData = {};
        [...userForm.elements].forEach(el => { if(el.id) newData[el.id] = el.value; });
        userData = newData;
        localStorage.setItem("lifeData", JSON.stringify(userData));
        toggleDrawer(false);
        render();
    };

    function render() {
        grid.innerHTML = "";
        const totalMonths = userData.lebenserwartung * 12;
        const passedMonths = userData.alter * 12;
        const dotsPerRow = 24; 
        const rowsPerBlock = 5; 

        let monthCount = 0;
        while (monthCount < totalMonths) {
            const blockIdx = Math.floor(monthCount / (dotsPerRow * rowsPerBlock));
            const block = document.createElement("div");
            block.className = "decade-block";
            
            const label = document.createElement("div");
            label.className = "decade-label";
            label.innerText = blockIdx * 10;
            block.appendChild(label);

            for (let r = 0; r < rowsPerBlock; r++) {
                const row = document.createElement("div");
                row.className = "year-row";
                for (let d = 0; d < dotsPerRow; d++) {
                    if (monthCount < totalMonths) {
                        const dot = document.createElement("div");
                        dot.className = `dot ${monthCount < passedMonths ? 'past' : 'future'}`;
                        dot.id = `m-${monthCount}`;
                        row.appendChild(dot);
                        monthCount++;
                    }
                }
                block.appendChild(row);
            }
            grid.appendChild(block);
        }
        updateStats("standard");
    }

    function updateStats(filter) {
        const dots = document.querySelectorAll(".dot");
        const totalMonths = dots.length;
        dots.forEach(d => d.className = d.className.replace(/highlighted|dimmed/g, "").trim());

        let ratio = 0;
        let title = "Gelebte Zeit";
        let subtext = "";

        if (filter === "standard") {
            ratio = (userData.alter * 12) / totalMonths;
            subtext = `${userData.alter * 12} Monate von ${totalMonths} bereits gelebt.`;
        } else {
            // Berechnung in Relation zum Gesamtleben (24h Basis oder 168h Woche Basis)
            const factors = {
                schlaf: userData.schlaf / 24,
                handy: parseTime(userData.handy) / 24,
                tv: parseTime(userData.tv) / 24,
                arbeit: userData.arbeitsstunden / 168,
                sport: userData.sport / 168,
                freunde: userData.freunde / 168
            };
            ratio = factors[filter] || 0;
            title = `Lebensanteil: ${filter}`;
            const totalYears = (totalMonths / 12 * ratio).toFixed(1);
            subtext = `Hochgerechnet verbringst du ${totalYears} Jahre deines Lebens mit ${filter}.`;
        }

        document.getElementById("stat-title").innerText = title;
        document.getElementById("stat-percent").innerText = Math.round(ratio * 100) + "%";
        document.getElementById("stat-absolute").innerText = subtext;

        if (filter !== "standard") {
            const target = Math.round(totalMonths * ratio);
            dots.forEach((d, i) => {
                if (i < target) d.classList.add("highlighted");
                else d.classList.add("dimmed");
            });
        }
    }

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updateStats(btn.dataset.filter);
        };
    });

    // Init
    Object.keys(userData).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = userData[key]; });
    render();
});