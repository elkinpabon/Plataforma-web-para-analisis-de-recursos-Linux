document.addEventListener("DOMContentLoaded", function () {
    const cpuUsageElement = document.getElementById("cpu-usage");
    const cpuSpeedElement = document.getElementById("cpu-speed");
    const cpuModelElement = document.getElementById("cpu-model");
    const cpuBaseSpeedElement = document.getElementById("cpu-base-speed");
    const cpuCoresElement = document.getElementById("cpu-cores");
    const cpuLogicalElement = document.getElementById("cpu-logical");
    const cpuSocketsElement = document.getElementById("cpu-sockets");
    const runningProcessesElement = document.getElementById("running-processes");
    const processListElement = document.getElementById("process-list");
    const loadMoreButton = document.getElementById("load-more");

    let offset = 0;
    const limit = 10;  
    const maxProcesses = 50;
    let allProcesses = []; 

    const ctxCpu = document.getElementById("cpuChart").getContext("2d");
    const cpuChart = new Chart(ctxCpu, {
        type: "line",
        data: {
            labels: Array(10).fill(""),
            datasets: [{
                label: "Uso de CPU (%)",
                borderColor: "rgba(255, 59, 59, 1)",
                backgroundColor: "rgba(255, 59, 59, 0.2)",
                data: Array(10).fill(0),
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,  
            animation: { duration: 0 },
            scales: {
                x: { display: false },
                y: { beginAtZero: true, max: 100 }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    function updateCpuChart(newUsage) {
        const labels = cpuChart.data.labels;
        const data = cpuChart.data.datasets[0].data;

        labels.push("");
        data.push(newUsage);

        if (labels.length > 10) {
            labels.shift();
            data.shift();
        }

        cpuChart.update();
    }

    function fetchCpuData() {
        fetch("/api/cpu_usage/")
            .then(response => response.json())
            .then(data => {
                cpuUsageElement.textContent = `${data.cpu_usage}%`;
                cpuSpeedElement.textContent = `${data.cpu_speed} GHz`;
                cpuModelElement.textContent = data.cpu_model;
                cpuBaseSpeedElement.textContent = `${data.cpu_speed} GHz`;
                cpuCoresElement.textContent = data.cpu_cores;
                cpuLogicalElement.textContent = data.cpu_logical;
                cpuSocketsElement.textContent = data.cpu_sockets;
                runningProcessesElement.textContent = data.running_processes;

                updateCpuChart(data.cpu_usage);
            })
            .catch(error => console.error("❌ Error al obtener datos de CPU:", error));
    }

    function fetchProcessData() {
        fetch(`/api/cpu_usage/`)
            .then(response => response.json())
            .then(data => {
                if (data.processes && data.processes.length > 0) {
                    allProcesses = data.processes.sort((a, b) => b.cpu_percent - a.cpu_percent);

                    offset = 0;
                    displayProcesses();
                }
            })
            .catch(error => console.error("❌ Error al obtener datos de procesos:", error));
    }

    function displayProcesses() {
        const processesToShow = allProcesses.slice(offset, offset + limit);

        processesToShow.forEach(process => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td>${process.cpu_percent.toFixed(2)}%</td>
                <td>${process.memory_percent.toFixed(2)}%</td>
            `;
            processListElement.appendChild(row);
        });

        offset += limit;

        if (offset >= maxProcesses || offset >= allProcesses.length) {
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = "No hay más procesos";
        }
    }

    setInterval(fetchCpuData, 1000);
    fetchCpuData();
    fetchProcessData();

    loadMoreButton.addEventListener("click", displayProcesses);
});
