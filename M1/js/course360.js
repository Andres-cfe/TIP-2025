/**
 *
 * Módulo course360 para gestionar funciones y solicitudes relacionadas con la navegación de un curso eLearning.
 * Proporciona métodos para cargar contenido, manejar audio, integrar con SCORM y más.
 *
 * @namespace course360
 * @version 1.0.0
 *
 * @requires jQuery
 * @requires pipwerks SCORM Wrapper for JavaScript
 * @requires Howler.js
 * @requires SweetAlert2.js
 * @requires Bootstrap@4.6.2
 * @requires Swiper 11.1.5
 *
 * @class ExtendedHowl
 * @extends Howl
 * @classdesc Extiende la clase Howl para añadir funcionalidad de actualización de tiempo.
 * @method onTimeUpdate - Añade un listener para actualizaciones de tiempo.
 * @method offTimeUpdate - Elimina un listener de actualizaciones de tiempo.
 * @method _startTimeUpdate - Inicia el intervalo para actualizaciones de tiempo.
 * @method _emitTimeUpdate - Emite las actualizaciones de tiempo a los listeners.
 *
 * @class AudioController
 * @classdesc Controlador para la gestión del audio en el curso.
 * @method loadAudio - Carga un archivo de audio dado su URL.
 * @method playAudio - Reproduce el audio cargado.
 * @method pauseAudio - Pausa el audio reproducido.
 * @method stopAudio - Detiene el audio reproducido.
 * @method toggleAudio - Alterna entre reproducir y pausar el audio.
 * @method toggleMute - Silencia o activa el sonido del audio.
 * @method updateUI - Actualiza la interfaz de usuario del control de audio.
 * @method setAudioUrl - Establece un nuevo archivo de audio para reproducir.
 * @method setAudio - Establece una nueva instancia de Howl para reproducir.
 *
 * @function initializeScorm - Inicializa la conexión con SCORM.
 * @function setProgress - Guarda el progreso del usuario en SCORM o sessionStorage.
 * @function getProgress - Obtiene el progreso del usuario desde SCORM o sessionStorage.
 * @function finishScorm - Finaliza y guarda el progreso del curso en SCORM.
 * @function loadConfig - Carga la configuración del curso desde un archivo JSON.
 * @function initializeCourse - Inicializa el curso, configurando el título y el menú.
 * @function buildMenu - Construye el menú de navegación del curso.
 * @function loadContent - Carga el contenido del módulo o tema actual.
 * @function setupNavigation - Configura los botones de navegación (anterior y siguiente).
 * @function updateProgressBar - Actualiza la barra de progreso del curso.
 * @function setActiveMenuItem - Establece el ítem activo del menú basado en el módulo o tema actual.
 * @function openSidebar - Abre el menú lateral de navegación.
 * @function closeSidebar - Cierra el menú lateral de navegación.
 * @function showStartOptions - Muestra las opciones de inicio al usuario.
 * @function verifyContentArray - Verifica y actualiza el array de contenido guardado.
 *
 * @license Licencia Comercial Propietaria
 * @version 1.0.0
 * @author salvador.martinez@espacio360.com.mx
 * @copyright Este software está protegido por derechos de autor y es propiedad de E360 Digital Solutions S.A. de C.V.
 * Solo se permite su uso de acuerdo con los términos y condiciones establecidos en el contrato de licencia.
 * Para obtener una licencia y acceder a las características completas y el soporte, contáctenos en licencias@espacio360.com.mx
 *
 */
var course360 = (function (COURSE_CONFIG) {
  "use strict";
  class ExtendedHowl extends Howl {
    constructor(options) {
      super(options);
      this._timeupdateListeners = [];
      this._interval = null;
      this._startTimeUpdate();
    }

    _startTimeUpdate() {
      this._interval = setInterval(() => {
        if (this.playing()) {
          const currentTime = this.seek();
          this._emitTimeUpdate(currentTime);
        }
      }, 250);
    }

    _emitTimeUpdate(currentTime) {
      this._timeupdateListeners.forEach((callback) => callback(currentTime));
    }

    onTimeUpdate(callback) {
      this._timeupdateListeners.push(callback);
    }

    offTimeUpdate(callback) {
      this._timeupdateListeners = this._timeupdateListeners.filter((listener) => listener !== callback);
    }

    stop(id) {
      super.stop(id);
      clearInterval(this._interval);
      this._interval = null;
    }

    pause(id) {
      super.pause(id);
      clearInterval(this._interval);
      this._interval = null;
    }

    play(id) {
      const playResult = super.play(id);
      this._startTimeUpdate();
      return playResult;
    }
  }

  /**
   * Controlador para la gestión del audio en el curso.
   * @class
   */
  class AudioController {
    constructor() {
      this.audioElement = null;
      this.audioControlButton = document.getElementById("audio-control");
      this.audioIcon = document.getElementById("audio-icon");
      this.audioControlButton.addEventListener("click", this.toggleMute.bind(this));
      this.progressCircle = document.getElementById("progress-circle");
      this.audioProgress = document.getElementById("audio-progress");
      this.isPlaying = false;
      this.isMuted = false;
      this.audioProgress.style.display = "none";
    }

    loadAudio(audioUrl) {
      this.stopAudio();
      if (audioUrl) {
        this.audioElement = new ExtendedHowl({
          src: [audioUrl],
          onend: this.onEnd.bind(this),
          onplay: this.onPlay.bind(this),
          onpause: this.onPause.bind(this),
          onstop: this.onStop.bind(this),
          onmute: this.onMute.bind(this),
        });
        this.audioElement.onTimeUpdate(this.updateProgressCircle.bind(this));
      } else {
        this.stopAudio();
        this.audioElement = null;
      }
    }

    playAudio() {
      if (this.audioElement) {
        this.audioElement.play();
      }
    }

    pauseAudio() {
      if (this.audioElement) {
        this.audioElement.pause();
      }
    }

    stopAudio() {
      if (this.audioElement && this.audioElement.stop) {
        this.audioElement.stop();
      }
      this.isPlaying = false;
    }

    toggleAudio() {
      if (this.audioElement) {
        if (this.audioElement.playing()) {
          this.pauseAudio();
        } else {
          this.playAudio();
        }
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      Howler.mute(this.isMuted);
      this.updateIcon();
      if (this.isMuted) {
        $("video").prop("muted", true);
      } else {
        $("video").prop("muted", false);
      }
    }

    updateIcon() {
      if (this.isMuted) {
        this.audioIcon.className = "fa-duotone fa-solid fa-volume-slash";
      } else {
        this.audioIcon.className = "fa-duotone fa-solid fa-volume";
      }
    }

    updateUI() {
      if (!this.audioElement || !this.audioElement.playing()) {
        this.audioIcon.className = "fa-duotone fa-solid fa-play";
      } else {
        this.audioIcon.className = "fa-duotone fa-solid fa-pause";
      }
    }

    setAudioUrl(audioUrl) {
      this.loadAudio(audioUrl);
    }

    setAudio(audioElement) {
      if (audioElement instanceof ExtendedHowl) {
        if (this.audioElement) {
          this.audioElement.stop();
        }
        this.audioElement = audioElement;
        this.audioElement.on("end", this.onEnd.bind(this));
        this.audioElement.on("play", this.onPlay.bind(this));
        this.audioElement.on("pause", this.onPause.bind(this));
        this.audioElement.on("stop", this.onStop.bind(this));
        this.audioElement.on("mute", this.onMute.bind(this));
        this.audioElement.onTimeUpdate(this.updateProgressCircle.bind(this));
      } else {
        console.info("audioElement debe ser una instancia de ExtendedHowl");
      }
    }

    onPlay() {
      this.isPlaying = true;
      this.audioProgress.style.display = "block";
      this.updateProgressCircle();
    }

    onPause() {
      this.updateUI();
      this.isPlaying = false;
    }

    onStop() {
      this.isPlaying = false;
      this.audioProgress.style.display = "none";
      this.updateProgressCircle();
    }

    onEnd() {
      this.audioProgress.style.display = "none";
      this.updateProgressCircle();
      this.isPlaying = false;
    }

    onMute() {
      this.toggleMute();
    }

    stopAllSoundsAndPlay(audioElement) {
      if (Array.isArray(Howler._howls)) {
        Howler._howls.forEach((sound) => {
          sound.stop();
        });
      }
      if (DEBUG) console.info("Audio src:" + audioElement._src);
      this.setAudio(audioElement);
      this.playAudio();
    }

    updateProgressCircle(currentTime) {
      if (!this.audioElement) return;

      const radius = this.progressCircle.getAttribute("r");
      const circleLength = 2 * Math.PI * radius;
      const duration = this.audioElement.duration();
      const progress = (currentTime / duration) * circleLength;
      this.progressCircle.setAttribute("stroke-dashoffset", circleLength - progress);
    }
  }
  // Asignación de valores por defecto si no están definidos en config
  const COURSE_CONFIG_URL = COURSE_CONFIG.COURSE_CONFIG_URL || "config.json";
  const DEBUG = COURSE_CONFIG.DEBUG !== undefined ? COURSE_CONFIG.DEBUG : false;
  /**
   * Declaracion de variables
   */
  const audioController = new AudioController();
  let sessionStartTime;
  let scormAPIUnloaded = false;
  let swiper;
  let courseData = { contentArray: [], maximumAdvance: 0 };
  let courseStructure = null;
  let currentIndex = 0;
  let sidebarOpen = false;
  let contentArray = [];
  const click_sound = new Audio("audio/click.mp3");
  // Configuraciones de Pipwerks
  pipwerks.SCORM.version = "1.2";
  pipwerks.debug.isActive = DEBUG;
  pipwerks.SCORM.handleExitMode = false;
  /**
   * Crea una instancia de ExtendedHowl con una URL de audio.
   * @param {string} audioUrl - La URL del archivo de audio.
   * @returns {ExtendedHowl} - La instancia de ExtendedHowl creada.
   */
  function createSound(audioUrl) {
    return new ExtendedHowl({
      src: [audioUrl],
    });
  }

  /**
   * Inicializa la conexión con SCORM.
   * @param {function} callback - La función de callback a ejecutar después de la inicialización.
   */
  function initializeScorm(callback) {
    let scorm = pipwerks.SCORM;
    let connected = scorm.init();
    if (connected) {
      let completionStatus = scorm.get("cmi.core.lesson_status");
      if (completionStatus === "not attempted") {
        scorm.set("cmi.core.lesson_status", "incomplete");
        scorm.save();
      }
      sessionStartTime = new Date();
    } else {
      console.warn("No se encontró la API SCORM. Se está utilizando sessionStorage para realizar el seguimiento.");
    }
    callback(connected);
  }

  /**
   * Guarda el progreso del usuario en SCORM o sessionStorage.
   * @param {Object} progress - El objeto de progreso a guardar.
   */
  function setProgress(progress) {
    const progressData = JSON.stringify(progress);
    if (pipwerks.SCORM.connection.isActive) {
      let scorm = pipwerks.SCORM;
      scorm.set("cmi.suspend_data", progressData);
      scorm.save();
    } else {
      sessionStorage.setItem("courseProgress", progressData);
    }
  }

  /**
   * Obtiene el progreso del usuario desde SCORM o sessionStorage.
   * @returns {Object} - El objeto de progreso del usuario.
   */
  function getProgress() {
    let progressData, parsedData;
    const scorm = pipwerks.SCORM;
    if (scorm.connection.isActive) {
      let suspendData = scorm.get("cmi.suspend_data");
      progressData = suspendData ? suspendData : false;
    } else {
      progressData = sessionStorage.getItem("courseProgress") ? sessionStorage.getItem("courseProgress") : false;
    }
    try {
      if (progressData === false) {
        parsedData = { contentArray: [], maximumAdvance: 0 };
      } else {
        parsedData = JSON.parse(progressData);
      }

      if (DEBUG) console.log("Parsed Data:", parsedData); // Debug
      return parsedData;
    } catch (e) {
      console.error("Error parsing progress data:", e);
      return { contentArray: [], maximumAdvance: 0 };
    }
  }

  /**
   * Finaliza y guarda el progreso del curso en SCORM.
   */
  function finishScorm() {
    if (pipwerks.SCORM.connection.isActive && !scormAPIUnloaded) {
      const sessionEndTime = new Date();
      const sessionDuration = (sessionEndTime - sessionStartTime) / 1000;
      const formattedSessionTime = formatTime(sessionDuration);
      pipwerks.SCORM.set("cmi.core.session_time", formattedSessionTime);
      pipwerks.SCORM.save();
      pipwerks.SCORM.quit();
      scormAPIUnloaded = true;
    }
  }

  /**
   * Carga la configuración del curso desde un archivo JSON.
   */
  function loadConfig() {
    fetch(COURSE_CONFIG_URL)
      .then((response) => response.json())
      .then((data) => {
        courseStructure = data;
        buildContentArray(courseStructure.modules);
        courseData = getProgress();
        if (!verifyContentArray(courseData.contentArray, contentArray)) {
          if (DEBUG) console.log("Contenido actualizado. Restableciendo datos del curso.");
          courseData = { contentArray, maximumAdvance: 0 };
          setProgress(courseData);
        } else {
          contentArray = courseData.contentArray;
        }
        initFullPageNavigator();
        if (courseData.maximumAdvance > 0) {
          showStartOptions();
        } else {
          initializeCourse();
        }
      })
      .catch((error) => console.info("Error al cargar la configuración del curso:", error));
  }

  /**
   * Inicializa el curso, configurando el título y el menú.
   */
  function initializeCourse() {
    const elements = document.getElementsByClassName("course-title");
    for (let i = 0; i < elements.length; i++) {
      elements[i].innerText = courseStructure.title;
    }
    document.title = courseStructure.title;
    buildMenu();
    hideDuplicateLinks();
    setupNavigation();
    loadContent();
  }

  /**
   * Construye el array de contenido del curso.
   * @param {Array} modules - Los módulos del curso.
   */
  function buildContentArray(modules) {
    let indexModule = -1;
    modules.forEach((module, indexM) => {
      indexModule = indexM;
      addContentItem(module.title, module.content, module.audio, indexModule);
      if (module.topics) {
        buildContentArrayRecursive(module.topics, indexModule);
      }
    });
    if (DEBUG) console.log("Content Array:", contentArray);
  }

  /**
   * Construye el array de contenido del curso de forma recursiva.
   * @param {Array} topics - Los temas del módulo.
   */
  function buildContentArrayRecursive(topics, indexModule) {
    topics.forEach((topic) => {
      addContentItem(topic.title, topic.content, topic.audio, indexModule);
      if (topic.topics) {
        buildContentArrayRecursive(topic.topics, indexModule);
      }
    });
  }

  /**
   * Añade un ítem al array de contenido del curso.
   * @param {string} title - El título del ítem.
   * @param {string} content - La URL del contenido del ítem.
   * @param {string} audio - La URL del audio del ítem.
   */
  function addContentItem(title, content, audio, indexModule) {
    if (content) {
      contentArray.push({
        title,
        content,
        audio,
        visited: false,
        indexModule: indexModule,
        index: contentArray.length,
      });
    }
  }

  /**
   * Crea un ítem de menú.
   * @param {Object} item - El ítem del contenido.
   * @param {number} index - El índice del ítem.
   * @returns {HTMLElement} - El elemento `li` del menú creado.
   */
  function createMenuItem(item, index) {
    let li = document.createElement("li");
    li.classList.add("menu-item");
    const itemIndex = courseData.contentArray.find((arrayItem) => arrayItem.content === item.content && arrayItem.title === item.title) || { index: -1 };
    let wdiv = document.createElement("div");
    wdiv.classList.add("witem");
    let link = document.createElement("a");
    link.dataset.index = itemIndex.index;
    link.textContent = item.title;
    link.dataset.visited = itemIndex.visited;
    link.classList.add("nav-link", "nav-e360-menu");
    link.addEventListener("click", function () {
      click_sound.play();
      if (itemIndex.index > -1) {
        if (DEBUG || link.dataset.visited === "true") {
          currentIndex = itemIndex.index;
          closeSidebar();
          loadContent();
        } else {
          closeSidebar();
          Swal.fire({
            text: "El tema está bloqueado",
            icon: "error",
          });
        }
      } else {
        // Busca el elemento span con la clase toggle-icon en el elemento padre fa-square-chevron-down
        const toggleIcon = link.closest(".witem").querySelector(".toggle-icon");
        if (toggleIcon) {
          toggleIcon.click(); // Simula el clic en el toggle-icon
        }
      }
    });
    wdiv.appendChild(link);
    li.appendChild(wdiv);

    if (item.topics && item.topics.length > 0) {
      let toggleIcon = document.createElement("span");
      toggleIcon.classList.add("toggle-icon", "btn", "btn-sm");
      toggleIcon.innerHTML = '<i class="fa-duotone fa-solid fa-square-chevron-right"></i>';
      toggleIcon.addEventListener("click", function () {
        click_sound.play();
        const icon = this.querySelector("i");
        const ul = this.closest("li").querySelector("ul");
        $(ul).collapse("toggle");
        $(ul).on("shown.bs.collapse", function () {
          icon.classList.remove("fa-square-chevron-right");
          icon.classList.add("fa-square-chevron-down");
        });
        $(ul).on("hidden.bs.collapse", function () {
          icon.classList.remove("fa-square-chevron-down");
          icon.classList.add("fa-square-chevron-right");
        });
      });
      wdiv.appendChild(toggleIcon);

      let ul = document.createElement("ul");
      ul.classList.add("collapse", "list-unstyled", "sub-ul");
      item.topics.forEach((topic, idx) => {
        ul.appendChild(createMenuItem(topic, idx));
      });
      li.appendChild(ul);
    }

    return li;
  }

  /**
   * Construye el menú de navegación del curso.
   */
  function buildMenu() {
    let menu = document.getElementById("menu");
    menu.innerHTML = ""; // Limpiar el menú actual
    if (courseStructure.modules && courseStructure.modules.length > 0) {
      courseStructure.modules.forEach((module, i) => {
        let moduleUl = document.createElement("ul");
        moduleUl.id = `module${i}`;
        moduleUl.classList.add("list-unstyled");
        moduleUl.appendChild(createMenuItem(module, i));
        menu.appendChild(moduleUl);
      });
    }
  }

  function hideDuplicateLinks() {
    // Seleccionar todos los módulos
    const modules = document.querySelectorAll("#menu > ul");

    // Iterar sobre cada módulo
    modules.forEach((module) => {
      const links = module.querySelectorAll(".nav-e360-menu");
      const linkTextsByLevel = {};

      links.forEach((link) => {
        // Obtener el nivel del enlace en la jerarquía del DOM
        const level = getLevel(link);

        // Inicializar el Set para el nivel si no existe
        if (!linkTextsByLevel[level]) {
          linkTextsByLevel[level] = new Set();
        }

        // Comprobar y ocultar duplicados
        if (linkTextsByLevel[level].has(link.textContent.trim())) {
          link.style.display = "none";
          link.closest(".menu-item").style.display = "none";
        } else {
          linkTextsByLevel[level].add(link.textContent.trim());
        }
      });
    });
  }

  // Función para obtener el nivel de un enlace en la jerarquía del DOM
  function getLevel(element) {
    let level = 0;
    while (element.parentElement) {
      element = element.parentElement;
      if (element.classList.contains("list-unstyled")) {
        level++;
      }
    }
    return level;
  }

  /**
   * Carga el contenido del módulo o tema actual.
   *
   * Esta función se encarga de mostrar un cargador mientras se carga el contenido del tema actual
   * desde una URL específica. También maneja el audio asociado al contenido y actualiza el progreso
   * del curso.
   */
  function loadContent() {
    // Muestra el cargador
    document.getElementById("loader-course360").style.display = "block";

    // Obtiene el elemento de contenido actual desde `courseData`
    const contentItem = courseData.contentArray[currentIndex];

    // Verifica si el elemento de contenido no existe
    if (!contentItem) {
      if (DEBUG) console.info("Contenido no encontrado:", currentIndex);
      return;
    }

    // Obtiene las URLs de contenido y audio del elemento actual
    const contentUrl = contentItem.content;
    const audioUrl = contentItem.audio;

    // Verifica si la URL del contenido no existe
    if (!contentUrl) {
      if (DEBUG) console.info("URL del contenido no encontrada:", contentUrl);
      return;
    }
    if (DEBUG) console.info("URL del contenido:", contentUrl);
    if (DEBUG) console.info("Contenido encontrado:", currentIndex);
    // Detiene y desactiva todos los sonidos de Howler.js si existen
    if (Array.isArray(Howler._howls)) {
      $.each(Howler._howls, function (index, sound) {
        sound.stop();
        sound.off();
      });
    }

    // Eliminar cualquier animacion si es que existen
    if (typeof gsap !== "undefined" && gsap !== null) {
      gsap.globalTimeline.clear();
    }

    if (audioController && audioController.audioElement) audioController.stop();
    if (DEBUG) console.log("Loading content:", contentUrl);
    if (Swal.isVisible()) {
      Swal.close();
      // Seleccionar todos los elementos con las clases swal2-shown y swal2-height-auto
      var elements = document.querySelectorAll(".swal2-shown, .swal2-height-auto");

      // Recorrer todos los elementos seleccionados y quitar las clases
      elements.forEach(function (element) {
        element.classList.remove("swal2-shown", "swal2-height-auto");
      });
      // Seleccionar todos los elementos con el atributo aria-hidden="true"
      var elements = document.querySelectorAll('[aria-hidden="true"]');

      // Recorrer todos los elementos seleccionados y quitar el atributo
      elements.forEach(function (element) {
        element.removeAttribute("aria-hidden");
      });
    }

    const nextButton = document.getElementById("next-btn");
    nextButton.classList.remove("look_at_me");

    // Realiza una solicitud AJAX para cargar el contenido
    $.ajax({
      url: contentUrl,
      dataType: "html",
      success: function (html) {
        // Muestra el icono de cargador en todas las diapositivas del SCO
        $(".sco").each(function () {
          $(this).html(
            '<div class="d-flex justify-content-center align-items-center h-100"><i class="fa-duotone fa-solid fa-spinner-third fa-spin fa-2xl"></i></div>'
          );
        });

        // Inserta el contenido HTML cargado en la diapositiva actual
        $("#content-area").find(".swiper-slide").eq(currentIndex).html(html);
        // Ajusta la altura del contenido principal
        adjustMainContentHeight();
      },
      error: function (error) {
        console.info("Error loading content:", error);
        // Muestra el mensaje de error en el área de contenido
        $("#content-area").find(".swiper-slide").eq(currentIndex).html(error.responseText);
      },
      complete: function () {
        // Configura el audio si hay una URL de audio
        if (audioUrl) audioController.setAudioUrl(audioUrl);

        // Marca el contenido como visitado y actualiza el progreso máximo si está en modo DEBUG
        if (DEBUG) courseData.contentArray[currentIndex].visited = true;
        courseData.maximumAdvance = Math.max(courseData.maximumAdvance, currentIndex);

        // Guarda el progreso del curso
        setProgress(courseData);

        // Actualiza la barra de progreso y los botones de navegación
        updateProgressBar();
        setActiveMenuItem();
        updateNavigationButtons();

        // Oculta el cargador
        document.getElementById("loader-course360").style.display = "none";

        // Actualiza el swiper y navega a la diapositiva actual
        swiper.update();
        swiper.slideTo(currentIndex);
        // lanzar el evento
        triggerSlideChange(currentIndex, courseData.contentArray.length, courseData.contentArray[currentIndex]);
      },
    });
  }

  /**
   * Configura los botones de navegación (anterior y siguiente).
   */
  function setupNavigation() {
    document.getElementById("prev-btn").addEventListener("click", function () {
      click_sound.play();
      navigate(-1);
    });
    document.getElementById("next-btn").addEventListener("click", function () {
      click_sound.play();
      navigate(1);
    });
  }

  /**
   * Navega al módulo o tema anterior o siguiente.
   * @param {number} direction - La dirección de la navegación (-1 para anterior, 1 para siguiente).
   */
  function navigate(direction) {
    const targetIndex = currentIndex + direction;

    // No navegar fuera de los límites
    if (targetIndex < 0 || targetIndex >= courseData.contentArray.length) {
      return;
    }

    // Permitir siempre navegar hacia atrás
    if (direction === -1 || courseData.contentArray[currentIndex].visited || DEBUG) {
      currentIndex = targetIndex;
      loadContent();
    } else {
      Swal.fire({
        text: "Debes completar el contenido actual antes de avanzar.",
        icon: "warning",
      });
    }

    updateNavigationButtons(); // Actualiza los botones de navegación
  }

  /**
   * Actualiza la barra de progreso del curso.
   */
  function updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    const totalVisited = courseData.contentArray.filter((item) => item.visited).length;
    const progress = (totalVisited / courseData.contentArray.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.innerHTML = `${progress.toFixed(2)}%`;
    progressBar.setAttribute("aria-valuenow", progress.toFixed(2));
  }

  /**
   * Establece el ítem activo del menú basado en el módulo o tema actual.
   */
  function setActiveMenuItem() {
    const menuItems = document.querySelectorAll("#menu .nav-link");

    // Elimina la clase "active" de todos los elementos del menú
    menuItems.forEach((item) => item.classList.remove("active"));

    // Intenta seleccionar el ítem activo usando el currentIndex
    const activeItem = document.querySelector(`[data-index="${currentIndex}"]`);

    // Verifica si el elemento existe antes de agregar la clase "active"
    if (activeItem) {
      // Agrega la clase "active" al ítem activo
      activeItem.classList.add("active");

      // Si el ítem activo está oculto, busca el elemento correspondiente en el menú
      if (activeItem.style.display === "none") {
        menuItems.forEach((item) => {
          // Si el texto del ítem coincide, se agrega la clase "active"
          if (item.textContent.trim() === activeItem.textContent.trim()) {
            item.classList.add("active");
          }
        });
      }
    }
  }

  /**
   * Actualiza los botones de navegación (anterior y siguiente).
   */
  function updateNavigationButtons() {
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");

    // Deshabilitar botón "anterior" solo si estamos en la primera diapositiva
    if (currentIndex === 0) {
      prevButton.classList.add("disabled");
    } else {
      prevButton.classList.remove("disabled");
    }

    // Deshabilitar botón "siguiente" si no podemos avanzar y no estamos en modo DEBUG
    if (currentIndex >= courseData.contentArray.length - 1 || (!courseData.contentArray[currentIndex].visited && !DEBUG)) {
      nextButton.classList.add("disabled");
    } else {
      nextButton.classList.remove("disabled");
    }
  }

  /**
   * Abre el menú lateral de navegación.
   */
  function openSidebar() {
    click_sound.play();
    document.getElementById("sidebar").classList.add("active");
    document.querySelector("main").classList.add("sidebar-open");
    document.querySelector("nav").classList.add("sidebar-open");
    document.querySelector("footer").classList.add("sidebar-open");
    sidebarOpen = true;
  }

  /**
   * Cierra el menú lateral de navegación.
   */
  function closeSidebar() {
    click_sound.play();
    document.getElementById("sidebar").classList.remove("active");
    document.querySelector("main").classList.remove("sidebar-open");
    document.querySelector("nav").classList.remove("sidebar-open");
    document.querySelector("footer").classList.remove("sidebar-open");
    sidebarOpen = false;
  }

  document.getElementById("menu-toggle").addEventListener("click", function () {
    if (sidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  document.getElementById("btn-close-menu-sm").addEventListener("click", function () {
    closeSidebar();
  });

  /**
   * Muestra las opciones de inicio al usuario.
   */
  function showStartOptions() {
    Swal.fire({
      title: "¿Dónde quieres empezar?",
      text: "Puedes retomar tu progreso o comenzar desde el principio.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Retomar",
      cancelButtonText: "Comenzar de nuevo",
    }).then((result) => {
      if (result.isConfirmed) {
        currentIndex = courseData.maximumAdvance;
      } else {
        currentIndex = 0;
      }
      initializeCourse();
    });
  }

  /**
   * Verifica y actualiza el array de contenido guardado.
   * @param {Array} savedContentArray - El array de contenido guardado.
   * @param {Array} newContentArray - El nuevo array de contenido.
   * @returns {boolean} - true si el contenido es válido y actualizado, false en caso contrario.
   */
  function verifyContentArray(savedContentArray, newContentArray) {
    if (savedContentArray.length !== newContentArray.length) {
      return false;
    }
    for (let i = 0; i < savedContentArray.length; i++) {
      if (savedContentArray[i].title !== newContentArray[i].title || savedContentArray[i].content !== newContentArray[i].content) {
        savedContentArray[i].title = newContentArray[i].title;
        savedContentArray[i].content = newContentArray[i].content;
        savedContentArray[i].audio = newContentArray[i].audio;
      }
    }
    return true;
  }

  /**
   * Inicializa la navegación de pantalla completa utilizando Swiper.js.
   *
   * Esta función se encarga de configurar un contenedor de diapositivas (slides)
   * utilizando la biblioteca Swiper para una navegación vertical. Añade elementos
   * de contenido dinámicamente según el arreglo `courseData.contentArray` y
   * configura las opciones de Swiper para desactivar el movimiento táctil y la paginación.
   */
  function initFullPageNavigator() {
    // Itera sobre cada contenido en el arreglo `contentArray` de `courseData`
    courseData.contentArray.forEach((content) => {
      // Añade un elemento de diapositiva al área de contenido
      $("#content-area").append(
        '<div class="swiper-slide sco"><div class="d-flex justify-content-center align-items-center h-100"><i class="fa-duotone fa-solid fa-spinner-third fa-spin fa-2xl"></i></div></div>'
      );
    });

    // Inicializa Swiper con configuración específica
    swiper = new Swiper(".swiper", {
      direction: "vertical", // Dirección de desplazamiento vertical
      allowTouchMove: false, // Desactiva el movimiento táctil
      pagination: {
        el: ".swiper-pagination", // Elemento de paginación
        clickable: false, // Desactiva la paginación clicable
        enabled: false, // Desactiva la paginación
      },
      on: {
        slideChange: adjustMainContentHeight, // Evento en cambio de diapositiva
        slideNextTransitionStart: function () {}, // Evento al iniciar la transición a la siguiente diapositiva
        slidePrevTransitionStart: function () {}, // Evento al iniciar la transición a la diapositiva anterior
        resize: adjustMainContentHeight, // Evento en el redimensionamiento del contenedor
      },
    });
  }

  /**
   * Ajusta la altura del contenido principal para que ocupe toda la altura disponible de la ventana.
   *
   * Esta función calcula la altura combinada del elemento de navegación y del pie de página,
   * y ajusta la altura del contenido principal para que llene el espacio restante de la ventana.
   * Se asegura de que el contenido principal no se superponga con la navegación y el pie de página.
   */
  function adjustMainContentHeight() {
    // Obtiene el elemento del contenido principal
    const mainContent = document.getElementById("main-content");
    // Obtiene el elemento de navegación del curso
    const navCourse360 = document.getElementById("nav-course360");
    // Obtiene el elemento del pie de página del curso
    const footer360 = document.getElementById("footer-360");

    // Calcula la altura del elemento de navegación, si existe
    let navHeight = navCourse360 ? navCourse360.offsetHeight : 0;
    // Calcula la altura del pie de página, si existe
    let footerHeight = footer360 ? footer360.offsetHeight : 0;

    // Ajusta la altura del contenido principal restando las alturas de navegación y pie de página
    mainContent.style.height = `calc(100vh - ${navHeight + footerHeight}px)`;
  }

  /**
   * Obtiene el nombre del estudiante desde SCORM o sessionStorage.
   * @returns {string} - El nombre del estudiante.
   */
  function getStudentName() {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get("cmi.core.student_name");
    } else {
      return sessionStorage.getItem("cmi.core.student_name");
    }
  }

  /**
   * Obtiene la ubicación de la lección desde SCORM o sessionStorage.
   * @returns {string} - La ubicación de la lección.
   */
  function getLessonLocation() {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get("cmi.core.lesson_location");
    } else {
      return sessionStorage.getItem("cmi.core.lesson_location");
    }
  }

  /**
   * Establece la ubicación de la lección en SCORM o sessionStorage.
   * @param {string} location - La ubicación de la lección.
   * @returns {boolean} - true si se estableció correctamente, false en caso contrario.
   */
  function setLessonLocation(location) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.set("cmi.core.lesson_location", location);
    } else {
      sessionStorage.setItem("cmi.core.lesson_location", location);
      return true;
    }
  }

  /**
   * Obtiene el estado de la lección desde SCORM o sessionStorage.
   * @returns {string} - El estado de la lección.
   */
  function getLessonStatus() {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get("cmi.core.lesson_status");
    } else {
      return sessionStorage.getItem("cmi.core.lesson_status");
    }
  }

  /**
   * Establece el estado de la lección en SCORM o sessionStorage.
   * @param {string} status - El estado de la lección.
   * @returns {boolean} - true si se estableció correctamente, false en caso contrario.
   */
  function setLessonStatus(status) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.set("cmi.core.lesson_status", status);
    } else {
      sessionStorage.setItem("cmi.core.lesson_status", status);
      return true;
    }
  }

  /**
   * Obtiene la puntuación desde SCORM o sessionStorage.
   * @returns {string} - La puntuación.
   */
  function getScore() {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get("cmi.core.score.raw");
    } else {
      return sessionStorage.getItem("cmi.core.score.raw");
    }
  }

  /**
   * Establece la puntuación en SCORM o sessionStorage.
   * @param {number} score - La puntuación.
   * @returns {boolean} - true si se estableció correctamente, false en caso contrario.
   */
  function setScore(score) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.set("cmi.core.score.raw", score);
    } else {
      sessionStorage.setItem("cmi.core.score.raw", score);
      return true;
    }
  }

  /**
   * Obtiene los datos suspendidos desde SCORM o sessionStorage.
   * @returns {string} - Los datos suspendidos.
   */
  function getSuspendData() {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get("cmi.suspend_data");
    } else {
      return sessionStorage.getItem("cmi.suspend_data");
    }
  }

  /**
   * Establece los datos suspendidos en SCORM o sessionStorage.
   * @param {string} data - Los datos suspendidos.
   * @returns {boolean} - true si se estableció correctamente, false en caso contrario.
   */
  function setSuspendData(data) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.set("cmi.suspend_data", data);
    } else {
      sessionStorage.setItem("cmi.suspend_data", data);
      return true;
    }
  }

  /**
   * Formatea el tiempo en segundos a HH:MM:SS.
   * @param {number} timeInSeconds - El tiempo en segundos.
   * @returns {string} - El tiempo formateado.
   */
  function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toFixed(2).toString().padStart(5, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Marca la diapositiva actual como visitada y actualiza la interfaz de usuario.
   *
   * Esta función actualiza el estado `visited` de la diapositiva actual en el arreglo `contentArray` de `courseData`
   * y en el atributo `data-visited` del elemento HTML correspondiente. También actualiza la barra de progreso
   * y los botones de navegación.
   *
   * @param {boolean} [state=true] - El estado de visitado a establecer para la diapositiva actual. Por defecto es `true`.
   */
  function setSlideVisited(state = true) {
    try {
      // Si el estado actual es false y NO es la última pantalla, entonces agregar animacion a boton de avance
      if (!courseData.contentArray[currentIndex].visited && currentIndex < courseData.contentArray.length - 1) {
        const nextButton = document.getElementById("next-btn");
        nextButton.classList.add("look_at_me");
      }
      // Actualiza el estado 'visited' de la diapositiva actual en el arreglo 'contentArray'
      courseData.contentArray[currentIndex].visited = state;
      // Actualiza el atributo 'data-visited' del elemento HTML correspondiente
      document.querySelector(`[data-index="${currentIndex}"]`).dataset.visited = state;
      // Actualiza la barra de progreso del curso
      updateProgressBar();
      // Actualiza los botones de navegación (anterior y siguiente)
      updateNavigationButtons();
      // Intenta guardar
      save();
      // lanzamos el evento de que el proceso de guardado fue completado
      triggerSlideCompleted(currentIndex, courseData.contentArray.length, courseData.contentArray[currentIndex]);
    } catch (error) {
      console.info("Error slide visited:", error);
    }
  }

  /**
   * Marca como visitadas las diapositivas según los índices proporcionados.
   *
   * Esta función ordena el arreglo de índices en orden descendente y marca cada
   * diapositiva correspondiente como visitada.
   *
   * @param {Array<number>} indices - Arreglo de índices de las diapositivas a marcar como visitadas.
   */
  function markSlidesAsVisited(indices) {
    // Ordena el arreglo de índices de mayor a menor
    const sortedIndices = indices.sort((a, b) => b - a);

    // Itera sobre los índices ordenados y marca cada diapositiva como visitada
    sortedIndices.forEach((index) => {
      try {
        // Establece el índice actual como el índice proporcionado
        currentIndex = index;
        // Marca la diapositiva como visitada
        setSlideVisited(true);
      } catch (error) {
        console.info(`Error al marcar la diapositiva en el índice ${index}:`, error);
      }
    });
  }

  /* The above code is a JavaScript snippet that is using the `DOMContentLoaded` event listener to
    initialize the Waves library and then it is calling a function `initializeScorm` with a callback
    function. */
  document.addEventListener("DOMContentLoaded", function () {
    initializeScorm((connected) => {
      if (DEBUG) {
        loadConfig();
      } else if (!connected) {
        const error = pipwerks.SCORM.debug.getInfo(pipwerks.SCORM.debug.getCode());
        Swal.fire({
          icon: "error",
          text: "No se encontró la API SCORM, si estas en un LMS puede ser que no se guarde los datos del curso. " + error,
          didClose: () => {
            loadConfig();
          },
        });
      } else {
        loadConfig();
      }
    });
  });
  /**
   * The function `soundClick` plays a sound when called.
   */
  function soundClick() {
    click_sound.play();
  }

  /**
   * The function `isVisited` checks if the current course content has been visited.
   * @returns The function `isVisited()` is returning the `visited` property of the element in the
   * `contentArray` at the `currentIndex` position in the `courseData` object.
   */
  function isVisited() {
    return courseData.contentArray[currentIndex].visited;
  }

  /**
   * The function `nextSlide` increments the `currentIndex` variable and then calls the `loadContent`
   * function.
   */
  function nextSlide() {
    currentIndex++;
    loadContent();
  }

  function prevSlide() {
    currentIndex--;
    loadContent();
  }

  /**
   * The function `save` checks if the SCORM connection is active and saves data if it is, otherwise it
   * returns true.
   * @returns If the SCORM connection is not active, the function `save()` will return `true`.
   */
  function save() {
    if (pipwerks.SCORM.connection.isActive) {
      pipwerks.SCORM.save();
    } else {
      setProgress(courseData);
      return true;
    }
  }

  /**
   * The function `triggerSlideChange` creates a custom event named 'slideChange' with details about the
   * slide index, total slides, and the slide object, and dispatches it on the body element.
   * @param index - The `index` parameter represents the index of the current slide that has changed.
   * @param total - The `total` parameter in the `triggerSlideChange` function represents the total
   * number of slides in a slideshow or presentation. It is used to provide information about the total
   * number of slides to the event listener when the `slideChange` event is triggered.
   * @param objectSlide - The `objectSlide` parameter in the `triggerSlideChange` function likely
   * represents the current slide object that is being passed as an argument. This object may contain
   * information about the content of the slide, such as text, images, or any other relevant data
   * related to the slide being displayed.
   */
  function triggerSlideChange(index, total, objectSlide) {
    const event = new CustomEvent("slideChange", {
      detail: { message: "Slide changed!", slideIndex: index, totalSlides: total, slide: objectSlide },
    });
    // Disparar el evento 'slideChange' en el body
    document.body.dispatchEvent(event);
  }

  /**
   * The function `triggerSlideCompleted` dispatches a custom event named "slideCompleted" with details
   * about the completed slide.
   * @param index - The `index` parameter in the `triggerSlideCompleted` function represents the index of
   * the current slide that has been completed.
   * @param total - The `total` parameter in the `triggerSlideCompleted` function represents the total
   * number of slides in a presentation or slideshow. It is used to indicate the total number of slides
   * in the presentation when a slide is completed.
   * @param objectSlide - The `objectSlide` parameter in the `triggerSlideCompleted` function is an
   * object that represents the current slide being completed. It may contain various properties related
   * to the slide content, such as title, description, image, etc. This object is included in the
   * `detail` property of the CustomEvent
   */
  function triggerSlideCompleted(index, total, objectSlide) {
    const event = new CustomEvent("slideCompleted", {
      detail: { message: "Slide Completed!", slideIndex: index, totalSlides: total, slide: objectSlide },
    });
    // Disparar el evento 'slideChange' en el body
    document.body.dispatchEvent(event);
  }

  /**
   * The `reload` function calls the `loadContent` function to reload content.
   */
  function reload() {
    loadContent();
  }

  /**
   * Cambia la diapositiva actual a la especificada por el índice slideIndex,
   * si es un número válido y existe en courseData.contentArray.
   *
   * @param {number} slideIndex - El índice de la diapositiva a la que se quiere ir.
   * Debe ser un número. Si es un número decimal, se redondea hacia abajo.
   */
  function gotoSlide(slideIndex) {
    // Verifica si slideIndex es un número y no es NaN (Not-a-Number)
    if (!isNaN(slideIndex) && typeof slideIndex === "number") {
      // Redondea hacia abajo para asegurarse de que sea un entero
      const validIndex = Math.floor(slideIndex);

      // Verifica si el índice existe en courseData.contentArray
      if (validIndex >= 0 && validIndex < courseData.contentArray.length) {
        // Si el índice es válido, actualiza currentIndex y carga el contenido
        currentIndex = validIndex;
        loadContent();
      } else {
        // Si el índice no es válido, muestra un mensaje de error
        console.error("Error: El índice de la diapositiva está fuera de los límites.");
      }
    } else {
      // Si slideIndex no es un número, muestra un mensaje de error en la consola
      console.error("Error: slideIndex debe ser un número.");
    }
  }

  /**
   * Verifica si una diapositiva especificada por el índice slideIndex ha sido visitada.
   *
   * @param {number} slideIndex - El índice de la diapositiva a verificar. Debe ser un número.
   * @returns {boolean|undefined} - Retorna true si la diapositiva ha sido visitada,
   *                                false si no ha sido visitada,
   *                                y undefined si el índice es inválido o fuera de los límites.
   */
  function isCompletedSlideIndex(slideIndex) {
    // Verifica si slideIndex es un número y no es NaN (Not-a-Number)
    if (!isNaN(slideIndex) && typeof slideIndex === "number") {
      // Redondea hacia abajo para asegurarse de que sea un entero
      const validIndex = Math.floor(slideIndex);

      // Verifica si el índice existe en courseData.contentArray
      if (validIndex >= 0 && validIndex < courseData.contentArray.length) {
        // Retorna el estado de 'visited' de la diapositiva en el índice validIndex
        return courseData.contentArray[validIndex].visited;
      } else {
        // Si el índice no es válido, muestra un mensaje de error
        console.error("Error: El índice de la diapositiva está fuera de los límites.");
        return undefined; // Retorna undefined si el índice está fuera de los límites
      }
    } else {
      // Si slideIndex no es un número, muestra un mensaje de error en la consola
      console.error("Error: slideIndex debe ser un número.");
      return undefined; // Retorna undefined si slideIndex no es un número
    }
  }
  /**
   * Obtiene la diapositiva actual basada en el índice currentIndex de courseData.
   *
   * @returns {object|undefined} - Retorna el objeto de la diapositiva actual si existe,
   *                               o undefined si el índice actual es inválido o fuera de los límites.
   */
  function getCurrentSlide() {
    // Verifica si currentIndex es un número válido y está dentro de los límites de courseData.contentArray
    if (typeof currentIndex === "number" && !isNaN(currentIndex) && currentIndex >= 0 && currentIndex < courseData.contentArray.length) {
      // Retorna el objeto de la diapositiva actual
      return courseData.contentArray[currentIndex];
    } else {
      // Si currentIndex es inválido, muestra un mensaje de error y retorna undefined
      console.error("Error: currentIndex no es válido o está fuera de los límites.");
      return undefined; // Retorna undefined si el índice actual es inválido
    }
  }

  /**
   * The `resetCourse` function resets course data, progress, and status, and rebuilds the course menu
   * and content.
   */
  function resetCourse() {
    courseData.contentArray.forEach((item) => (item.visited = false));
    courseData.maximumAdvance = 0;
    currentIndex = 0;
    if (pipwerks.SCORM.connection.isActive) {
      // Limpiar los datos en SCORM
      pipwerks.SCORM.set("cmi.core.lesson_location", 0);
      pipwerks.SCORM.set("cmi.core.score.raw", 0);
      pipwerks.SCORM.save();
    } else {
      // Limpiar los datos en sessionStorage
      sessionStorage.removeItem("cmi.core.lesson_location");
      sessionStorage.removeItem("cmi.core.score.raw");
      sessionStorage.removeItem("cmi.core.lesson_status");
    }
    // Reconstruir
    setProgress(courseData);
    buildMenu();
    hideDuplicateLinks();
    loadContent();
  }

  /**
   * Obtiene un valor desde SCORM usando LMSGetValue.
   * @param {string} key - Clave SCORM a obtener.
   * @returns {string} - Valor obtenido de SCORM.
   */
  function scormGetValue(key) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.get(key);
    }
    console.warn(`SCORM no activo, no se puede obtener el valor de '${key}'.`);
    return null;
  }

  /**
   * Establece un valor en SCORM usando LMSSetValue.
   * @param {string} key - Clave SCORM a establecer.
   * @param {string} value - Valor a establecer.
   * @returns {boolean} - Indica si la operación fue exitosa.
   */
  function scormSetValue(key, value) {
    if (pipwerks.SCORM.connection.isActive) {
      return pipwerks.SCORM.set(key, value);
    }
    console.warn(`SCORM no activo, no se puede establecer '${key}' con valor '${value}'.`);
    return false;
  }

  // Ajustar la altura al cargar la página
  window.addEventListener("load", adjustMainContentHeight);
  // Ajustar la altura al redimensionar la ventana
  window.addEventListener("resize", adjustMainContentHeight);
  // Finalizar conexion antes de cerrar la ventana
  window.addEventListener("beforeunload", finishScorm);

  return {
    audioController: new AudioController(),
    getStudentName: getStudentName,
    getLessonLocation: getLessonLocation,
    setLessonLocation: setLessonLocation,
    getLessonStatus: getLessonStatus,
    setLessonStatus: setLessonStatus,
    getScore: getScore,
    setScore: setScore,
    getSuspendData: getSuspendData,
    setSuspendData: setSuspendData,
    createSound: createSound,
    setSlideVisited: setSlideVisited,
    soundClick: soundClick,
    isVisited: isVisited,
    isDebug: DEBUG,
    nextSlide: nextSlide,
    save: save,
    openSidebar: openSidebar,
    closeSidebar: closeSidebar,
    reload: reload,
    gotoSlide: gotoSlide,
    isCompletedSlideIndex: isCompletedSlideIndex,
    getCurrentSlide: getCurrentSlide,
    prevSlide: prevSlide,
    resetCourse: resetCourse,
    adjustMainContentHeight: adjustMainContentHeight,
    markSlidesAsVisited: markSlidesAsVisited,
    scormGetValue: scormGetValue,
    scormSetValue: scormSetValue,
  };
})(COURSE_CONFIG);
