document.addEventListener("DOMContentLoaded", function () {
    const ramUsedElement = document.getElementById("ram-used");
    const ramFreeElement = document.getElementById("ram-free");
    const porcentRamUsed = document.getElementById("ram-used-porcent");
    const ramTotalElement = document.getElementById("ram-total");
    const ramCacheElement = document.getElementById("ram-cache");
    const ramModelElement = document.getElementById("ram-model");
    const ramSpeedElement = document.getElementById("ram-speed");
    const ramSlotsElement = document.getElementById("ram-slots");
    const ramSlotsUsedElement = document.getElementById("ram-slots-used");
    const ramFactorElement = document.getElementById("ram-factor");

    const ctxRamUsage = document.getElementById("ramChartUsage").getContext("2d");
    const ctxRamComposition = document.getElementById("ramChartComposition").getContext("2d");

    let ramChartUsage = new Chart(ctxRamUsage, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Uso de RAM (GB)",
                borderColor: "rgba(255, 59, 59, 1)",
                backgroundColor: "rgba(255, 59, 59, 0.2)",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5, 
                pointStyle: 'circle',
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    let ramChartComposition = new Chart(ctxRamComposition, {
        type: "doughnut",
        data: {
            labels: ["En Uso", "Caché", "Libre"],
            datasets: [{
                label: "Composición de Memoria",
                backgroundColor: ["#ff3b3b", "#f39c12", "#2ecc71"],
                data: [0, 0, 0]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });

    function updateRamData() {
        fetch("/api/ram_usage/")
            .then(response => response.json())
            .then(data => {
                ramUsedElement.textContent = `${data.ram_used} GB`;
                ramFreeElement.textContent = `${data.ram_free} GB`;
                ramTotalElement.textContent = `${data.ram_total} GB`;
                porcentRamUsed.textContent = `${data.ram_porcent}%`;
                ramCacheElement.textContent = data.ram_cache !== "No disponible" ? `${data.ram_cache} GB` : "No disponible";

                ramModelElement.textContent = data.ram_model;
                ramSpeedElement.textContent = data.ram_speed !== "No disponible" ? `${data.ram_speed}` : "No disponible";
                ramSlotsElement.textContent = data.ram_slots;
                ramSlotsUsedElement.textContent = data.ram_slots_used;
                ramFactorElement.textContent = data.ram_factor;

                if (ramChartUsage.data.labels.length > 10) {
                    ramChartUsage.data.labels.shift();
                    ramChartUsage.data.datasets[0].data.shift();
                }

                let analysisPeak = (Math.random() * 2 - 1) * 0.2; 
                let ramUsedFluctuated = Math.max(0, data.ram_used + analysisPeak);

                if (Math.random() < 0.1) { 
                    ramUsedFluctuated += (Math.random() * 1.2 - 0.50); 
                }

                ramChartUsage.data.labels.push(new Date().toLocaleTimeString());
                ramChartUsage.data.datasets[0].data.push(ramUsedFluctuated);
                ramChartUsage.update();

                ramChartComposition.data.datasets[0].data = [data.ram_used, data.ram_cache, data.ram_free];
                ramChartComposition.update();
            })
            .catch(error => console.error("❌ Error al obtener datos de RAM:", error));
    }

    setInterval(updateRamData, 1000); 
    updateRamData();
});
