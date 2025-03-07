document.addEventListener("DOMContentLoaded", function() {
    const ctxCpu = document.getElementById("cpuChart").getContext("2d");
    const ctxRam = document.getElementById("ramChart").getContext("2d");
    const ctxNet = document.getElementById("netChart").getContext("2d");
    const ctxDisk = document.getElementById("diskChart").getContext("2d");

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
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 500 },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    const ramChart = new Chart(ctxRam, {
        type: "bar",
        data: {
            labels: ["Usada", "Libre"],
            datasets: [{
                label: "Memoria RAM (GB)",
                backgroundColor: ["#ff3b3b", "#4caf50"],
                data: [0, 0],
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 500 },
            scales: { y: { beginAtZero: true } }
        }
    });

    const netChart = new Chart(ctxNet, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Subida (kbps)",
                    borderColor: "#ff3b3b",
                    backgroundColor: "rgba(255, 59, 59, 0.2)",
                    data: [],
                    borderWidth: 2,
                    fill: true,
                },
                {
                    label: "Bajada (kbps)",
                    borderColor: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                    data: [],
                    borderWidth: 2,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            animation: { duration: 500 },
            scales: {
                y: { beginAtZero: true, suggestedMax: 1000 },
                x: { display: true }
            }
        }
    });

    const diskChart = new Chart(ctxDisk, {
        type: "doughnut",
        data: {
            labels: ["Usado", "Disponible"],
            datasets: [{
                backgroundColor: ["#ff3b3b", "#4caf50"],
                data: [0, 0],
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 500 },
            cutout: "60%"
        }
    });

    function fetchData() {
        fetch("/api/system_usage/")
            .then(response => response.json())
            .then(data => {
                document.getElementById("cpu-usage").textContent = data.cpu_usage + "%";
                document.getElementById("cpu-speed").textContent = data.cpu_speed.toFixed(2) + " GHz";
                document.getElementById("cpu-base-speed").textContent = data.cpu_speed.toFixed(2) + " GHz";
                document.getElementById("ram-used").textContent = data.ram_used.toFixed(2) + " GB";
                document.getElementById("ram-total").textContent = data.ram_total.toFixed(2) + " GB";
                document.getElementById("net-upload").textContent = data.net_upload.toFixed(2) + " kbps";
                document.getElementById("net-download").textContent = data.net_download.toFixed(2) + " kbps";
                document.getElementById("disk-used").textContent = data.disk_used.toFixed(2) + " GB";
                document.getElementById("disk-total").textContent = data.disk_total.toFixed(2) + " GB";
    
                document.getElementById("cpu-model").textContent = data.cpu_model;
                document.getElementById("cpu-cores").textContent = data.cpu_cores;
                document.getElementById("cpu-logical").textContent = data.cpu_logical;
                document.getElementById("cpu-sockets").textContent = data.cpu_sockets;

                updateCpuChart(data.cpu_usage);
                updateBarChart(ramChart, data.ram_used, data.ram_total - data.ram_used);
                updateNetworkChart(data.net_upload, data.net_download);
                updateDoughnutChart(diskChart, data.disk_used, data.disk_total - data.disk_used);
            })
            .catch(error => console.error("Error al obtener los datos:", error));
    }

    function updateCpuChart(newUsage) {
        cpuChart.data.labels.push("");
        cpuChart.data.datasets[0].data.push(newUsage);
        if (cpuChart.data.labels.length > 10) {
            cpuChart.data.labels.shift();
            cpuChart.data.datasets[0].data.shift();
        }
        cpuChart.update();
    }

    function updateNetworkChart(uploadSpeed, downloadSpeed) {
        if (isNaN(uploadSpeed) || isNaN(downloadSpeed)) return;

        if (netChart.data.labels.length >= 10) {
            netChart.data.labels.shift();
            netChart.data.datasets[0].data.shift();
            netChart.data.datasets[1].data.shift();
        }

        let currentTime = new Date().toLocaleTimeString();
        netChart.data.labels.push(currentTime);
        netChart.data.datasets[0].data.push(uploadSpeed);
        netChart.data.datasets[1].data.push(downloadSpeed);

        let maxVal = Math.max(...netChart.data.datasets[0].data, ...netChart.data.datasets[1].data);
        netChart.options.scales.y.suggestedMax = maxVal + 100;

        netChart.update();
    }

    function updateBarChart(chart, used, free) {
        chart.data.datasets[0].data = [used, free];
        chart.update();
    }

    function updateDoughnutChart(chart, used, free) {
        chart.data.datasets[0].data = [used, free];
        chart.update();
    }

    setInterval(fetchData, 2000);
    fetchData();
});

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    function toggleMenu() {
        sidebar.classList.toggle("open");
    }

    menuToggle.addEventListener("click", toggleMenu);
    
});
