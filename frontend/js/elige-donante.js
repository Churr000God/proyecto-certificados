document.addEventListener("DOMContentLoaded", function () {
  var MENU_STORAGE_KEY = "menu_config";
  var hasSelectedCause = false;
  try {
    var selected = JSON.parse(localStorage.getItem("selected_cause") || "null");
    hasSelectedCause = !!(selected && selected.cause_id);
  } catch (e) {}

  if (!hasSelectedCause) {
    try {
      var menu = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || "null");
      if (!menu) throw new Error("no menu");
    } catch (e) {
      window.location.replace("../views/index.html#causas");
      return;
    }
  }

  var buttons = document.querySelectorAll(".donor__cta");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.getAttribute("data-type");
      try {
        localStorage.setItem("donor_type", type);
      } catch (e) {}
      if (type === 'individual') {
        window.location.href = "../views/donacion_individual.html";
      } else {
        // Fallback or future implementation for corporate
        window.location.href = "../views/donacion_corporativa.html"; 
      }
    });
  });
});
