async function loadPartial(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error("Error cargando partial:", err);
    target.innerHTML = `<div style="padding:12px;color:#b00;">
      No se pudo cargar: ${url}
    </div>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPartial("#app-header", "/components/nav_bar.html");
  await loadPartial("#app-footer", "/components/footer.html");

  // Ejemplo: actualizar año en footer si existe
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
