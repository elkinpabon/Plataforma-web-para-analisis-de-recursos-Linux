document.addEventListener("DOMContentLoaded", function() {
    function fetchData() {
        fetch("/api/system_usage/")
            .then(response => response.json())
            .then(data => {
                document.getElementById("cpu-usage").textContent = data.cpu_usage + "%";
                document.getElementById("cpu-speed").textContent = data.cpu_speed.toFixed(2) + " GHz";
                document.getElementById("ram-used").textContent = data.ram_used.toFixed(2) + " GB";
                document.getElementById("ram-total").textContent = data.ram_total.toFixed(2) + " GB";
                document.getElementById("net-upload").textContent = data.net_upload.toFixed(2) + " MB";
                document.getElementById("net-download").textContent = data.net_download.toFixed(2) + " MB";
                document.getElementById("disk-used").textContent = data.disk_used.toFixed(2) + " GB";
                document.getElementById("disk-total").textContent = data.disk_total.toFixed(2) + " GB";
            })
            .catch(error => console.error("Error al obtener los datos:", error));
    }

    setInterval(fetchData, 5000);
    fetchData();
});
