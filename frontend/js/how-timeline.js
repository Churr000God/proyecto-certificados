document.addEventListener("DOMContentLoaded", function () {
  var steps = document.querySelectorAll(".how__step");
  var progressFill = document.querySelector(".how__progress-fill");
  if (!steps.length || !progressFill) return;

  function activateStep(i) {
    steps.forEach(function (s, idx) {
      s.classList.toggle("how__step--active", idx === i);
      var fill = idx <= i ? 1 : 0;
      s.style.setProperty("--fill", fill);
    });
    var stepCount = steps.length - 1;
    var w = (i / stepCount) * 100;
    // Usar variable CSS para manejar width/height responsive
    progressFill.style.setProperty('--progress', w + '%');
    // Mantener compatibilidad si el CSS no usa la variable aún
    progressFill.style.width = w + "%"; 
  }

  steps.forEach(function (step) {
    step.addEventListener("mouseenter", function () {
      activateStep(parseInt(step.dataset.index, 10));
    });
    step.addEventListener("focus", function () {
      activateStep(parseInt(step.dataset.index, 10));
    });
    step.addEventListener("click", function () {
      activateStep(parseInt(step.dataset.index, 10));
    });
  });

  activateStep(0);
});

