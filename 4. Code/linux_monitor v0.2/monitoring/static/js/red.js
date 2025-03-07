document.addEventListener("DOMContentLoaded", function () {
    const adapterElement = document.getElementById("network-adapter");
    const ipv4Element = document.getElementById("ipv4-address");
    const ipv6Element = document.getElementById("ipv6-address");
    const typeElement = document.getElementById("connection-type");

    const uploadElement = document.getElementById("network-upload");
    const downloadElement = document.getElementById("network-download");

    const interfacesList = document.getElementById("network-interfaces");
    const ctxNetwork = document.getElementById("networkChart").getContext("2d");

    let networkChart = new Chart(ctxNetwork, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "📤 Envío (kbps)",
                    borderColor: "rgba(255, 59, 59, 1)",
                    backgroundColor: "rgba(255, 59, 59, 0.2)",
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: "rgba(255, 59, 59, 1)",
                    tension: 0.3, 
                    data: []
                },
                {
                    label: "📥 Recepción (kbps)",
                    borderColor: "rgba(34, 193, 195, 1)",
                    backgroundColor: "rgba(34, 193, 195, 0.2)",
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: "rgba(34, 193, 195, 1)",
                    tension: 0.3, 
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500, 
                easing: "easeInOutQuart"
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 5000, 
                    ticks: {
                        color: "#ffffff",
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    }
                },
                x: {
                    ticks: {
                        color: "#ffffff",
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff",
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
    
    function updateNetworkData() {
        fetch("/api/network_usage/")
            .then(response => response.json())
            .then(data => {
                try {
                    if (data.main_interface) {
                        adapterElement.innerHTML = `<strong>Adaptador:</strong> <span>${data.main_interface.adaptador}</span>`;
                        ipv4Element.innerHTML = `<strong></strong> <span>${data.main_interface.ipv4 || "No disponible"}</span>`;
                        ipv6Element.innerHTML = `<strong></strong> <span>${data.main_interface.ipv6 || "No disponible"}</span>`;
                        typeElement.innerHTML = `<strong></strong> <span>${data.main_interface.tipo_conexion || "Desconocido"}</span>`;
    
                        uploadElement.innerHTML = `📤 <strong style="color:#ff3b3b;">Envío:</strong> <span>${data.main_interface.envio} kbps</span>`;
                        downloadElement.innerHTML = `📥 <strong style="color:#22C1C3;">Recepción:</strong> <span>${data.main_interface.recepcion} kbps</span>`;
    
                        if (networkChart.data.labels.length >= 15) {
                            networkChart.data.labels.shift();
                            networkChart.data.datasets[0].data.shift();
                            networkChart.data.datasets[1].data.shift();
                        }
    
                        let currentTime = new Date().toLocaleTimeString();
                        networkChart.data.labels.push(currentTime);
                        networkChart.data.datasets[0].data.push(data.main_interface.envio);
                        networkChart.data.datasets[1].data.push(data.main_interface.recepcion);
    
                        let maxVal = Math.max(...networkChart.data.datasets[0].data, ...networkChart.data.datasets[1].data);
                        networkChart.options.scales.y.suggestedMax = maxVal + 500;
                        
                        networkChart.options.animation = {
                            duration: 300, 
                            easing: "easeInOutQuart"
                        };
                        networkChart.update();
                    }

                    interfacesList.innerHTML = "";
                    if (data.interfaces && data.interfaces.length > 0) {
                        data.interfaces.forEach((iface, index) => {
                            let li = document.createElement("li");
                            li.innerHTML = `<strong style="color:#ff3b3b;">Interfaz ${index + 1}:</strong> <span>${iface}</span>`;
                            li.style.padding = "10px 0"; // 🔹 Espacio adicional entre interfaces
                            interfacesList.appendChild(li);
                        });
                    } else {
                        interfacesList.innerHTML = "<li><strong>Interfaz:</strong> No se encontraron interfaces.</li>";
                    }
                } catch (error) {
                    console.error("❌ Error al procesar datos de red:", error);
                    interfacesList.innerHTML = "<li>Error al cargar las interfaces.</li>";
                }
            })
            .catch(error => {
                console.error("❌ Error al obtener datos de red:", error);
                interfacesList.innerHTML = "<li>Error al conectar con el servidor.</li>";
            });
    }
    
    setInterval(updateNetworkData, 500);
    updateNetworkData();
    
});