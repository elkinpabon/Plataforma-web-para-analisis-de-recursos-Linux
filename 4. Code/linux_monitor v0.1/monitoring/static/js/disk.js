const ctxTransferSpeed = document.getElementById("diskTransferChart").getContext("2d");
const ctxDiskUsage = document.getElementById("diskUsageChart").getContext("2d");

let transferSpeedChart = new Chart(ctxTransferSpeed, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "📤 Escritura (MB/s)",
                borderColor: "rgba(255, 59, 59, 1)",
                backgroundColor: "rgba(255, 59, 59, 0.2)",
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                data: []
            },
            {
                label: "📥 Lectura (MB/s)",
                borderColor: "rgba(34, 193, 195, 1)",
                backgroundColor: "rgba(34, 193, 195, 0.2)",
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                data: []
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 50 },
        scales: {
            y: { beginAtZero: true },
            x: { display: false }
        }
    }
});

const MAX_DATA_POINTS = 10;

let diskUsageChart = new Chart(ctxDiskUsage, {
    type: "doughnut",
    data: {
        labels: ["En uso", "Disponible"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#ff3b3b", "#1e90ff"]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: "#ffffff" } }
        }
    }
});

function updateDiskData() {
    fetch("/api/disk_usage/")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const writeSpeed = parseFloat(data.write_speed) || 0;
            const readSpeed = parseFloat(data.read_speed) || 0;
            const totalSpace = parseFloat(data.total_space) || 0;
            const usedSpace = parseFloat(data.used_space) || 0;
            const freeSpace = totalSpace - usedSpace; 

            if (transferSpeedChart.data.labels.length > MAX_DATA_POINTS) {
                transferSpeedChart.data.labels.shift();
                transferSpeedChart.data.datasets[0].data.shift();
                transferSpeedChart.data.datasets[1].data.shift();
            }
            transferSpeedChart.data.labels.push(new Date().toLocaleTimeString());
            transferSpeedChart.data.datasets[0].data.push(writeSpeed);
            transferSpeedChart.data.datasets[1].data.push(readSpeed);
            transferSpeedChart.update();

            diskUsageChart.data.datasets[0].data = [usedSpace, freeSpace];
            diskUsageChart.update();

            document.getElementById("disk-write-speed").textContent = `${writeSpeed.toFixed(2)} MB/s`;
            document.getElementById("disk-read-speed").textContent = `${readSpeed.toFixed(2)} MB/s`;
            document.getElementById("disk-total").textContent = `${totalSpace.toFixed(2)} GB`;
            document.getElementById("disk-used").textContent = `${usedSpace.toFixed(2)} GB`;
            document.getElementById("disk-free").textContent = `${freeSpace.toFixed(2)} GB`;
            document.getElementById("disk-type").textContent = data.disk_type || "Desconocido";
            document.getElementById("disk-format").textContent = data.disk_format || "Desconocido";
        })
        .catch(error => console.error("❌ Error al obtener datos del disco:", error));
}

setInterval(updateDiskData, 1000);
updateDiskData();
