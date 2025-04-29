// Define un objeto de configuración al inicio
const COURSE_CONFIG = {
  COURSE_CONFIG_URL: "config.json",
  DEBUG: true,
};
window.addEventListener("DOMContentLoaded", () => {
  const originalBodyClass = "menu-right";
  document.body.addEventListener("slideChange", function (e) {
    document.body.classList = originalBodyClass;
    const sco = event.detail.slide;
    const divElement = document.querySelectorAll('.page-sco > div')[0]; // Índice basado en 0
    // $('.title_page').html(sco.title);
    setTimeout(() => {
      scrollToElement(divElement);
    }, 500);
    showTemplateInstruction(course360.isVisited());
    $('#next-btn').removeClass('animate__animated animate__pulse animate__infinite');
  });
  document.body.addEventListener("slideCompleted", function (e) {
    showTemplateInstruction(true);
  });

  const elementInstruction = document.getElementById("template-instruction");
  elementInstruction.addEventListener("click", () => {
    // elementInstruction.classList.remove("show");
  });
  //Inicializa los tooltips de BS5
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

/**
 * The function `showTemplateInstruction` toggles the visibility of an element with the id
 * 'template-instruction' based on the value of the flag parameter.
 * @param [flag=true] - The `flag` parameter in the `showTemplateInstruction` function is a boolean
 * parameter that determines whether to show or hide the template instruction element on the webpage.
 * If `flag` is `true`, the element will be shown by adding the "show" class to it. If `flag` is
 */
function showTemplateInstruction(flag) {
  const element = document.getElementById("template-instruction");
  if (flag) {
    element.classList.add("show");
    $('#next-btn').addClass('animate__animated animate__pulse animate__infinite');
    /* setTimeout( ()=>{
        element.classList.remove("show");
    },5000); */
  } else {
    element.classList.remove("show");
    $('#next-btn').removeClass('animate__animated animate__pulse animate__infinite');
  }
}


/**
 * Desplaza un elemento contenedor a la posición de un elemento objetivo.
 *
 * @param {string|HTMLElement} target - Selector CSS o elemento HTML del objetivo.
 * @param {string} [scrollableSelector=".sco.swiper-slide-active"] - Selector del contenedor desplazable (opcional).
 */
function scrollToElement(target, scrollableSelector = ".sco.swiper-slide-active") {
  // Si target es un selector CSS, selecciona el elemento; si no, usa directamente el HTMLElement
  var element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element || !(element instanceof HTMLElement)) {
    console.error("Element not found or invalid:", target);
    return;
  }

  // Seleccionar el contenedor desplazable
  var scrollableElement = document.querySelector(scrollableSelector);
  if (!scrollableElement) {
    console.error(`Scrollable element not found: ${scrollableSelector}`);
    return;
  }

  // Asegurar que el contenedor es desplazable
  scrollableElement.style.scrollBehavior = "smooth"; // Habilita el desplazamiento suave
  element.scrollIntoView({
    behavior: "smooth", // Suave desplazamiento
    block: "start", // Alinear el elemento al inicio del contenedor
    inline: "nearest", // Mantener alineación horizontal
  });
}




