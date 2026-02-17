document.addEventListener("DOMContentLoaded", function () {
  var card = document.querySelector(".cause__card");
  if (!card) return;

  var designs = {
    tecsalud: {
      brand: "TECSALUD",
      text:
        "Acerca servicios de salud de calidad a más familias, con diagnósticos y atención accesible.",
      icons: [
        { src: "../assets/beca.png", alt: "Ícono apoyo a pacientes" },
        { src: "../assets/Instalacioines.png", alt: "Ícono infraestructura médica" },
        { src: "../assets/equipo.png", alt: "Ícono comunidad de salud" }
      ],
      image: {
        src: "../assets/IMAGEN_TECMILENIO.jpg",
        alt: "Equipo médico en TecSalud"
      },
      leftClass: "cause__left--tecsalud"
    },
    tec: {
      brand: "TEC DE MONTERREY",
      text:
        "Impulsa proyectos educativos e innovación para transformar México a través del conocimiento.",
      icons: [
        { src: "../assets/beca.png", alt: "Ícono becas académicas" },
        { src: "../assets/Instalacioines.png", alt: "Ícono campus e infraestructura" },
        { src: "../assets/equipo.png", alt: "Ícono comunidad estudiantil" }
      ],
      image: {
        src: "../assets/IMAGEN_TECMILENIO.jpg",
        alt: "Campus del Tecnológico de Monterrey"
      },
      leftClass: "cause__left--tec"
    },
    tecmilenio: {
      brand: "TECMILENIO",
      text:
        "Impulsa la educación positiva y el bienestar. Ayuda a que más personas encuentren su propósito de vida a través de becas de estudio.",
      icons: [
        { src: "../assets/beca.png", alt: "Ícono becas" },
        { src: "../assets/Instalacioines.png", alt: "Ícono institución" },
        { src: "../assets/equipo.png", alt: "Ícono comunidad" }
      ],
      image: {
        src: "../assets/IMAGEN_TECMILENIO.jpg",
        alt: "Estudiantes Tecmilenio trabajando en laptop"
      },
      leftClass: "cause__left--tecmilenio"
    }
  };

  var left = card.querySelector(".cause__left");
  var brandEl = card.querySelector(".cause__brand");
  var textEl = card.querySelector(".cause__text");
  var iconImgs = card.querySelectorAll(".cause__icon img");
  var mediaImg = card.querySelector(".cause__media img");
  var buttons = card.querySelectorAll(".cause__logo");

  var leftClasses = ["cause__left--tecsalud", "cause__left--tec", "cause__left--tecmilenio"];

  var isAnimating = false;

  function applyDesign(key) {
    var design = designs[key];
    if (!design) return;

    leftClasses.forEach(function (cls) {
      left.classList.remove(cls);
    });
    left.classList.add(design.leftClass);

    brandEl.textContent = design.brand;
    textEl.textContent = design.text;

    iconImgs.forEach(function (img, index) {
      if (design.icons[index]) {
        img.src = design.icons[index].src;
        img.alt = design.icons[index].alt;
      }
    });

    if (design.image && mediaImg) {
      mediaImg.src = design.image.src;
      mediaImg.alt = design.image.alt;
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (isAnimating) return;
      var key = button.getAttribute("data-cause");

      isAnimating = true;
      card.classList.add("cause__card--changing");

      buttons.forEach(function (b) {
        b.classList.remove("cause__logo--active");
      });
      button.classList.add("cause__logo--active");

      setTimeout(function () {
        applyDesign(key);
        card.classList.remove("cause__card--changing");
        isAnimating = false;
      }, 220);
    });
  });

  applyDesign("tecmilenio");
});

