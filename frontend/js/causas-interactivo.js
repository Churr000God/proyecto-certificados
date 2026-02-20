document.addEventListener("DOMContentLoaded", function () {
  var card = document.querySelector(".cause__card");
  if (!card) return;

  var MENU_STORAGE_KEY = "menu_config";

  var placeholderEntry = {
    cause_id: null,
    brand_id: null,
    cause_name: "Seleccione una causa...",
    cause_description: "Por favor, elige una opción para ver los temas disponibles.",
    created_at: null,
    is_placeholder: true,
    topics: []
  };

  var brandMenuConfig = {
    tecmilenio: [
      {
        cause_id: "24b431a4-91b4-468b-9ab3-7900e5538ab0",
        brand_id: "5ea2245d-4910-4c07-90b1-b668bfe02305",
        cause_name: "Becas",
        cause_description: "Apoya becas para estudiantes de Tecmilenio.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecmi:beca-completa", topic_name: "Beca completa" },
          { topic_id: "tecmi:beca-parcial", topic_name: "Beca parcial" },
          { topic_id: "tecmi:beca-merito", topic_name: "Beca por mérito" },
          { topic_id: "tecmi:beca-necesidad", topic_name: "Beca por necesidad" }
        ]
      },
      {
        cause_id: "1e4262e0-d1c8-4453-a87a-8ce0a3f2c6e8",
        brand_id: "5ea2245d-4910-4c07-90b1-b668bfe02305",
        cause_name: "Apoyo a equipos representativos",
        cause_description: "Impulsa equipos deportivos y culturales representativos.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecmi:equipos-deportivos", topic_name: "Equipos deportivos" },
          { topic_id: "tecmi:equipos-culturales", topic_name: "Equipos culturales" },
          { topic_id: "tecmi:equipos-academicos", topic_name: "Equipos académicos" }
        ]
      },
      {
        cause_id: "3c3ac8af-f60f-4845-84f3-7b1632325801",
        brand_id: "5ea2245d-4910-4c07-90b1-b668bfe02305",
        cause_name: "Mejora de instalaciones",
        cause_description: "Mejora espacios e infraestructura del campus.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecmi:instalaciones-deportivas", topic_name: "Instalaciones deportivas" },
          { topic_id: "tecmi:instalaciones-academicas", topic_name: "Instalaciones académicas" },
          { topic_id: "tecmi:espacios-comunes", topic_name: "Espacios comunes" }
        ]
      },
      {
        cause_id: "08feb492-435d-42b0-b734-221eaa3241e5",
        brand_id: "5ea2245d-4910-4c07-90b1-b668bfe02305",
        cause_name: "Programas sociales",
        cause_description: "Programas sociales y de impacto en la comunidad.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecmi:voluntariado", topic_name: "Voluntariado" },
          { topic_id: "tecmi:proyectos-comunidad", topic_name: "Proyectos con la comunidad" }
        ]
      }
    ],
    tec: [
      {
        cause_id: "a0b08649-6c01-4222-970e-55c4e5bc09bb",
        brand_id: "93b67f3e-5f32-4f94-9df7-d93542980a58",
        cause_name: "Becas",
        cause_description: "Apoya becas para estudiantes del Tec de Monterrey.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tec:beca-liderazgo", topic_name: "Beca de liderazgo" },
          { topic_id: "tec:beca-talento", topic_name: "Beca de talento" },
          { topic_id: "tec:beca-necesidad", topic_name: "Beca por necesidad" }
        ]
      },
      {
        cause_id: "47e93076-0db1-4911-af74-5f291d90b24a",
        brand_id: "93b67f3e-5f32-4f94-9df7-d93542980a58",
        cause_name: "Apoyo a equipos representativos",
        cause_description: "Impulsa equipos representativos académicos, deportivos y culturales.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tec:borregos", topic_name: "Equipos Borregos" },
          { topic_id: "tec:grupos-culturales", topic_name: "Grupos culturales" }
        ]
      },
      {
        cause_id: "5c979660-87e0-4b9c-9539-58a7cee3a2de",
        brand_id: "93b67f3e-5f32-4f94-9df7-d93542980a58",
        cause_name: "Mejora de instalaciones",
        cause_description: "Fortalece laboratorios, aulas y espacios del campus.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tec:laboratorios", topic_name: "Laboratorios" },
          { topic_id: "tec:bibliotecas", topic_name: "Bibliotecas" },
          { topic_id: "tec:espacios-innovacion", topic_name: "Espacios de innovación" }
        ]
      },
      {
        cause_id: "e6b5c649-e73c-416b-92eb-30f01448f698",
        brand_id: "93b67f3e-5f32-4f94-9df7-d93542980a58",
        cause_name: "Programas sociales",
        cause_description: "Proyectos de impacto social impulsados por el Tec.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tec:liderazgo-social", topic_name: "Liderazgo social" },
          { topic_id: "tec:proyectos-sustentabilidad", topic_name: "Proyectos de sustentabilidad" }
        ]
      }
    ],
    tecsalud: [
      {
        cause_id: "a41dd701-f99d-4fc7-9b37-2039da018990",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Apoyo para medicinas",
        cause_description: "Ayuda a cubrir medicinas para pacientes que lo necesitan.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:medicinas-cronicas", topic_name: "Medicinas para enfermedades crónicas" },
          { topic_id: "tecsalud:medicinas-especializadas", topic_name: "Medicinas especializadas" }
        ]
      },
      {
        cause_id: "c853e3dd-9a87-468c-9397-89c22f638126",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Cirugías",
        cause_description: "Contribuye a cirugías de alto impacto para pacientes.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:cirugias-mayores", topic_name: "Cirugías mayores" },
          { topic_id: "tecsalud:cirugias-menores", topic_name: "Cirugías menores" }
        ]
      },
      {
        cause_id: "5e364a23-b836-4b25-be13-f88a2c8553cd",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Medicamentos",
        cause_description: "Apoya la compra de medicamentos especializados.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:medicamentos-oncologia", topic_name: "Medicamentos de oncología" },
          { topic_id: "tecsalud:medicamentos-urgencias", topic_name: "Medicamentos de urgencias" }
        ]
      },
      {
        cause_id: "eb385f94-c102-450b-a614-2700033dd6c9",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Consultas",
        cause_description: "Facilita consultas médicas a pacientes vulnerables.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:consultas-generales", topic_name: "Consultas generales" },
          { topic_id: "tecsalud:consultas-especialidad", topic_name: "Consultas de especialidad" }
        ]
      },
      {
        cause_id: "752ee410-e9d8-465e-b793-1fb30e5c87f6",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Instalaciones médicas",
        cause_description: "Mejora infraestructura y equipo médico.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:equipo-medico", topic_name: "Equipo médico" },
          { topic_id: "tecsalud:areas-hospitalarias", topic_name: "Áreas hospitalarias" }
        ]
      },
      {
        cause_id: "681f0be2-c809-4a0d-b6b9-c349dcf52e54",
        brand_id: "577c62b2-cfe5-4157-a386-f940b47a12d5",
        cause_name: "Campañas de impacto social",
        cause_description: "Campañas de prevención y salud para la comunidad.",
        created_at: null,
        is_placeholder: false,
        topics: [
          { topic_id: "tecsalud:prevencion", topic_name: "Prevención y promoción de la salud" },
          { topic_id: "tecsalud:campanas-comunidad", topic_name: "Campañas en comunidades vulnerables" }
        ]
      }
    ]
  };

  function getIconSprite(index) {
    var sprites = [
      { src: "../assets/beca.png", alt: "Ícono becas" },
      { src: "../assets/Instalacioines.png", alt: "Ícono instalaciones" },
      { src: "../assets/equipo.png", alt: "Ícono comunidad" }
    ];
    return sprites[index % sprites.length];
  }

  function saveMenuConfigForBrand(key) {
    var entries = brandMenuConfig[key] || [];
    var payload = {
      menu_config: [placeholderEntry].concat(entries)
    };
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function renderCauseIconsForBrand(key) {
    var causes = brandMenuConfig[key] || [];
    var iconsContainer = card.querySelector(".cause__icons");
    if (!iconsContainer) return;
    iconsContainer.innerHTML = "";
    var currentSelectedRaw = localStorage.getItem("selected_cause");
    var currentSelected = null;
    try {
      currentSelected = currentSelectedRaw ? JSON.parse(currentSelectedRaw) : null;
    } catch (e) {}
    causes.forEach(function (cause, index) {
      if (cause.is_placeholder) return;
      var sprite = getIconSprite(index);
      var wrapper = document.createElement("div");
      wrapper.className = "cause__icon";
      wrapper.setAttribute("data-cause-id", cause.cause_id || "");
      wrapper.setAttribute("title", cause.cause_name || "");

      var img = document.createElement("img");
      img.src = sprite.src;
      img.alt = sprite.alt;

      var tooltip = document.createElement("span");
      tooltip.className = "cause__tooltip";
      tooltip.textContent = cause.cause_name || "";

      wrapper.appendChild(img);
      wrapper.appendChild(tooltip);
      iconsContainer.appendChild(wrapper);

      if (currentSelected && currentSelected.cause_id === cause.cause_id) {
        wrapper.classList.add("cause__icon--active");
      }

      wrapper.addEventListener("click", function () {
        var payload = {
          cause_id: cause.cause_id,
          brand_id: cause.brand_id,
          cause_name: cause.cause_name
        };
        try {
          localStorage.setItem("selected_cause", JSON.stringify(payload));
        } catch (e) {}
        iconsContainer.querySelectorAll(".cause__icon").forEach(function (el) {
          el.classList.remove("cause__icon--active");
        });
        wrapper.classList.add("cause__icon--active");
        var err = card.querySelector(".cause__error");
        if (err) err.remove();
      });
    });

    var iconCount = iconsContainer.children.length;
    if (iconCount > 4) {
      iconsContainer.classList.add("cause__icons--scrollable");
    } else {
      iconsContainer.classList.remove("cause__icons--scrollable");
      iconsContainer.scrollLeft = 0;
    }

    if (iconsAutoScrollTimer) {
      clearInterval(iconsAutoScrollTimer);
      iconsAutoScrollTimer = null;
    }

    if (iconCount > 4) {
      iconsAutoScrollTimer = setInterval(function () {
        var maxScroll = iconsContainer.scrollWidth - iconsContainer.clientWidth;
        if (maxScroll <= 0) return;
        if (iconsContainer.scrollLeft >= maxScroll) {
          iconsContainer.scrollLeft = 0;
          return;
        }
        iconsContainer.scrollLeft += 1;
      }, 100);
    }
  }

  function ensureCtaRequiresSelection() {
    document.addEventListener(
      "click",
      function (evt) {
        var a = evt.target.closest("a");
        if (!a) return;
        var href = a.getAttribute("href") || "";
        if (!/generar_certificado\.html(\?|#|$)/.test(href)) return;
        var selected = null;
        try {
          selected = JSON.parse(localStorage.getItem("selected_cause") || "null");
        } catch (e) {}
        if (!selected || !selected.cause_id) {
          evt.preventDefault();
          var causesSection = document.querySelector("#causas");
          if (causesSection) {
            causesSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          var existing = card.querySelector(".cause__error");
          if (!existing) {
            var msg = document.createElement("div");
            msg.className = "cause__error";
            msg.textContent = "Por favor, selecciona una causa para continuar.";
            var leftPane = card.querySelector(".cause__left");
            if (leftPane) {
              leftPane.insertBefore(msg, leftPane.querySelector(".cause__icons"));
            }
          }
        }
      },
      true
    );
  }

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
  var iconsAutoScrollTimer = null;

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

      saveMenuConfigForBrand(key);
      renderCauseIconsForBrand(key);

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
  saveMenuConfigForBrand("tecmilenio");
  renderCauseIconsForBrand("tecmilenio");
  ensureCtaRequiresSelection();
});
