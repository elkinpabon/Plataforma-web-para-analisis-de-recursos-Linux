document.addEventListener("DOMContentLoaded", function () {
    function fetchCpuData() {
        fetch("/api/cpu_usage/")
            .then(response => response.json())
            .then(data => {
                const event = new CustomEvent("cpuDataFetched", { detail: data });
                document.dispatchEvent(event);
            })
            .catch(error => console.error("❌ Error al obtener datos de CPU:", error));
    }

    setInterval(fetchCpuData, 1000);
    fetchCpuData();
});
