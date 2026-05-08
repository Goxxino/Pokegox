// Registra il plugin per mostrare i valori sulle barre
Chart.register(ChartDataLabels);

// Configurazione Globale (Tema e Costanti)
const THEME = {
    font: "'Montserrat', sans-serif",
    colorTextMuted: '#aaa',
    colorUp: '#ff5555',   // Rosso per stat aumentata
    colorDown: '#5588ff', // Blu per stat diminuita
    colorNeutral: '#fff'
};

const STAT_LABELS = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE'];

// Mappa Nature: Indici (0:HP, 1:ATK, 2:DEF, 3:SPA, 4:SPD, 5:SPE)
const NATURES = {
    'ardita': { up: null, down: null }, 'docile': { up: null, down: null },
    'ritrosa': { up: null, down: null }, 'furba': { up: null, down: null }, 'seria': { up: null, down: null },
    
    'schiva': { up: 1, down: 2 }, 'decisa': { up: 1, down: 3 }, 'birbona': { up: 1, down: 4 }, 'audace': { up: 1, down: 5 },
    'sicura': { up: 2, down: 1 }, 'scaltra': { up: 2, down: 3 }, 'fiacca': { up: 2, down: 4 }, 'placida': { up: 2, down: 5 },
    'modesta': { up: 3, down: 1 }, 'mite': { up: 3, down: 2 }, 'ardente': { up: 3, down: 4 }, 'quieta': { up: 3, down: 5 },
    'calma': { up: 4, down: 1 }, 'gentile': { up: 4, down: 2 }, 'cauta': { up: 4, down: 3 }, 'vivace': { up: 4, down: 5 },
    'timida': { up: 5, down: 1 }, 'lesta': { up: 5, down: 2 }, 'allegra': { up: 5, down: 3 }, 'ingenua': { up: 5, down: 4 }
};

// Funzione per creare opzioni di chart personalizzate in base alla natura
const getChartOptions = (nature) => {
    const natureData = NATURES[nature];
    
    return {
        indexAxis: 'y',
        scales: {
            x: {
                display: false,
                max: 255 
            },
            y: {
                grid: { display: false },
                ticks: {
                    color: THEME.colorTextMuted,
                    font: {
                        family: THEME.font,
                        size: 13,
                        weight: '600'
                    }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const idx = context.dataIndex;
                        const statName = context.chart.data.labels[idx];
                        const val = context.dataset.data[idx];
                        const iv = context.dataset.ivs ? context.dataset.ivs[idx] : '';
                        const ev = context.dataset.evs ? context.dataset.evs[idx] : '';
                        return [`${statName}: ${val}`, `IV: ${iv}`, `EV: ${ev}`];
                    }
                }
            },
            datalabels: {
                color: (context) => {
                    const idx = context.dataIndex;
                    if (idx === natureData.up) return THEME.colorUp;
                    if (idx === natureData.down) return THEME.colorDown;
                    return THEME.colorNeutral;
                },
                anchor: 'end',
                align: 'right',
                offset: 5,
                font: { size: 13, weight: 'bold' }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        // Questo arrotonda le barre a "pillola"
        elements: {
            bar: {
                borderRadius: 20, 
                borderSkipped: false
            }
        }
    };
};

// Funzione generica per disegnare il grafico
const drawChart = (elementId, data, color, nature) => {
    const canvas = document.getElementById(elementId);
    if (!canvas) return; // Protezione in caso il grafico non esista sulla pagina corrente
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: STAT_LABELS,
            datasets: [{
                data: data.stats,
                ivs: data.ivs,
                evs: data.evs,
                backgroundColor: color + 'cc', // Leggera trasparenza
                barThickness: 8, // Barre più sottili = più eleganza
            }]
        },
        options: getChartOptions(nature)
    });
};

// Render IV/EV statistics as HTML grid table
const renderStatsTable = (containerId, { ivs, evs }, color) => {
    const container = document.getElementById(containerId);
    if (!container) return; // Protezione per le altre pagine
    
    const gridHTML = `
        <div class="stats-grid">
            <div class="stats-grid-header">
                <div>STAT</div>
                <div>IV</div>
                <div>EV</div>
            </div>
            ${STAT_LABELS.map((label, i) => `
                <div class="stats-grid-row">
                    <div class="stats-grid-cell label">${label}</div>
                    <div class="stats-grid-cell iv">${ivs[i]}</div>
                    <div class="stats-grid-cell ev" style="color: ${color}">
                        <span>${evs[i]}</span>
                        <div class="ev-bar">
                            <div class="ev-bar-fill" style="width: ${(evs[i]/252)*100}%; background: ${color};"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = gridHTML;
};

// --- CARICAMENTO DATI (JSON Esterno) ---
fetch('team-data.json')
    .then(response => response.json())
    .then(teamData => {
        // Inizializzazione Loop
        teamData.forEach(pokemon => {
            drawChart(`chart${pokemon.id}`, pokemon, pokemon.color, pokemon.nature);
            renderStatsTable(`stats${pokemon.id}`, pokemon, pokemon.color);
        });
    })
    .catch(error => console.error('Errore nel caricamento dei dati:', error));

// --- GESTIONE MODALE OTTIMIZZATA (Event Delegation) ---
const modal = document.getElementById('locationModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

const openModal = (title, content) => {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = content;
    modal.classList.add('show');
};

const closeModal = () => modal.classList.remove('show');

// UN SOLO event listener per TUTTI i click sulla pagina
document.body.addEventListener('click', (e) => {
    // 1. Chiusura modale (click su "X" o fuori dal contenuto)
    if (e.target.closest('.modal-close') || e.target === modal) {
        closeModal();
    }
    
    // 2. Apertura modale da un elemento cliccabile (.clickable-move o .location-box)
    const trigger = e.target.closest('.clickable-move, .location-box');
    if (trigger) {
        const dataDiv = trigger.nextElementSibling;
        if (dataDiv && (dataDiv.classList.contains('move-data') || dataDiv.classList.contains('location-data'))) {
            const title = dataDiv.querySelector('.data-title').innerHTML;
            const content = dataDiv.querySelector('.data-content').innerHTML;
            openModal(title, content);
        }
    }
});

// Chiusura con tasto Esc
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
});

// --- GENERAZIONE E GESTIONE NAVBAR DINAMICA ---
document.addEventListener("DOMContentLoaded", function() {
    // 1. Definisci l'HTML della navbar centralizzata
    const navbarHTML = `
        <nav class="main-nav">
            <a href="home.html" class="nav-logo">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png" alt="Logo">
                <span>GOXXINO</span>
            </a>
            <ul class="nav-links">
                <li><a href="home.html">Home</a></li>
                <li><a href="index.html">Il Mio Team</a></li>
                <li><a href="palmer.html">Farm BP</a></li>
                <li><a href="slaves.html">Pokémon Slave</a></li>
                <li><a href="utilities.html">Utilities</a></li>
                <li><a href="farm-squame.html">Farm Squame</a></li>
                <li><a href="consigli.html">Tips & Tricks</a></li>
            </ul>
        </nav>
    `;

    // 2. Inserisci la navbar all'inizio del tag <body>
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // 3. Gestione dinamica della classe "active"
    let currentPage = window.location.pathname.split('/').pop();
    if (currentPage === '') currentPage = 'home.html'; 

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // 4. Gestione Navbar (Scomparsa allo scroll)
    const navBar = document.querySelector('.main-nav');
    if (navBar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 250) {
                navBar.classList.add('hidden-nav');
            } else {
                navBar.classList.remove('hidden-nav');
            }
        });
    }
});