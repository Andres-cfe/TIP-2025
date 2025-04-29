$(function () {
    "use strict";

    // Inicializa el entorno con una clase en el body para definir estilos específicos.
    $("body").addClass("fakeBody");

    const intentosMaximos = Infinity;
    const maxScore = 80;
    const question = 5;
    let intento = course360.getLessonLocation();
    if (Number.isNaN(Number(intento))) {
        // Manejar el caso en que intento no es un número
        console.error("El valor de intento no es un número válido.");
        intento = 0; // Establecer un valor predeterminado, si es necesario
    } else {
        // Convertir intento a número
        intento = Number(intento);
        if (intento > intentosMaximos) {
            intento = 0;
            course360.setLessonLocation(intento);
        }
        console.log("El valor de intento es un número válido:", intento);
    }

    // Carga y crea los sonidos utilizados en el juego.
    const audio_instrucciones = course360.createSound("audio/audio_h31.mp3");
    const audio_inicio = course360.createSound("audio/audio_h30.mp3");
    const bad = course360.createSound("audio/feedback-incorrect.mp3");
    const good = course360.createSound("audio/feedback-correct.mp3");
    const slidesound = course360.createSound('audio/slide.mp3');
    // Al terminar el audio, habilita el botón de comenzar.
    audio_inicio.on("end", function () {
        $('.ins0').show();
        $(".btn-comenzar").addClass("animate__animated animate__pulse animate__infinite waves-effect").removeClass("disabled");
    });

    audio_instrucciones.on("end", function () {
        $("#paso1").removeClass("disabled");
        //$("#parrafo_instrucciones").hide();
        //renderQuestion(); // Muestra la primera pregunta.
        $(".object_handler").removeClass('disabled');
        clickHandlerQuestion();// Activar la selección de objetos para mostar preguntas
        if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // $('#parrafo_instrucciones').hide();
        }
    });
    if (intento >= intentosMaximos) {
        Swal.fire({
            icon: "error",
            title: "¡Límite de intentos alcanzado!",
            html: `
                  <p>Has alcanzado el límite de intentos.</p>
                  <p><strong>Intentos realizados:</strong> ${intento}</p>
                  <p><strong>Intentos permitidos:</strong> ${intentosMaximos}</p>
                `,
            confirmButtonText: "Aceptar",
        }).then(() => {
            course360.resetCourse();
        });
    } else {
        // Reproduce el sonido inicial al cargar la página.
        course360.audioController.stopAllSoundsAndPlay(audio_inicio);
    }


    // Evento al hacer clic en el botón de comenzar.
    $(".btn-comenzar").click(function () {
        intento++; //Sumar el número de intento actual
        course360.setLessonLocation(intento); //Guardar el intento actual
        $("#inicio").hide(); // Oculta la pantalla de inicio.
        $("#desarrollo").show(); // Muestra la pantalla de desarrollo.
        $("body").addClass("fakeBodyDesarrollo"); // Cambia la clase del body para nuevos estilos.
        course360.audioController.stopAllSoundsAndPlay(audio_instrucciones); // Reproduce el sonido asociado.
    });

    /**
     * Lee un archivo Excel desde una URL y procesa el contenido mediante un callback.
     * @param {string} url - La URL del archivo Excel.
     * @param {function} callback - La función callback que procesará los datos.
     */
    function readExcelFile(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";

        xhr.onload = function (e) {
            var arrayBuffer = xhr.response;
            var data = new Uint8Array(arrayBuffer);
            var workbook = XLSX.read(data, { type: "array" });

            var result = {};
            workbook.SheetNames.forEach((sheetName) => {
                var sheet = workbook.Sheets[sheetName];
                result[sheetName] = XLSX.utils.sheet_to_json(sheet);
            });

            callback(result); // Llama al callback con el resultado.
        };

        xhr.send();
    }

    /**
     * Procesa las preguntas obtenidas desde un archivo Excel y las organiza en un formato específico.
     * @param {Array} data - Datos en formato JSON del archivo Excel.
     * @returns {Array} - Un array de preguntas procesadas.
     */
    function procesarPreguntas(data) {
        const preguntas = data.map((fila) => {
            const opciones = [];
            Object.keys(fila).forEach((key) => {
                if (key.startsWith("opcion")) {
                    opciones.push({
                        text: fila[key].trim(), // Normaliza y limpia cada opción.
                        correct: key === "opcion_c", // Determina si es la opción correcta.
                    });
                }
            });
            return {
                pregunta: fila.pregunta.trim(), // Limpia el texto de la pregunta.
                opciones: shuffleArray(opciones),
                retroalimentacion_correcta: fila.retro_bien.trim(), // Limpia la retroalimentación correcta.
                retroalimentacion_incorrecta: fila.retro_mal.trim(), // Limpia la retroalimentación incorrecta.
            };
        });

        return preguntas; // Retorna las preguntas procesadas.
    }

    /**
     * Mezcla aleatoriamente los elementos de un array.
     * @param {Array} array - El array a mezclar.
     * @returns {Array} - El array mezclado.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    let questions, preguntas; // Variables globales para almacenar preguntas.
    let currentQuestionIndex = 0; // Índice de la pregunta actual.
    let currentQuestion; // Pregunta actual.
    let correctAnswer; // Respuesta correcta de la pregunta actual.
    let counterCorrectQuestions = 0;
    function renderQuestion() {
        $('#pregunta').html("");
        // Referencias a elementos HTML.
        const preguntaElem = document.getElementById("pregunta");
        preguntaElem.innerHTML = `<div class="wtext py-md-4 py-2 fw-bold animate__animated animate__flipInX text-primary">${currentQuestion.pregunta}</div>
        <div class="w-100 text-center">
          <div class="options justify-content-center animate__animated animate__flipInX"></div>
        </div>`;
        $('.option').html("");
        $('.options').html("");
        renderOptions(currentQuestion);
        handlerOptionClick();
        course360.audioController.stopAllSoundsAndPlay(slidesound);
    }

    /**
     * The function `renderOptions` generates HTML options for a given question and inserts them into a
     * specified container on a webpage.
     * @param currentQuestion - The `currentQuestion` parameter seems to be an object that contains
     * information about a question, specifically the options for that question. The `renderOptions`
     * function takes this `currentQuestion` object and generates HTML markup for the options of that
     * question using template literals. Each option is represented as a `div
     */
    function renderOptions(currentQuestion) {
        const optionsContainer = document.querySelector('.options');
        // Genera el HTML de las opciones utilizando template literals
        const optionsHTML = currentQuestion.opciones.map((opcion, index) => {

            //Opciones con inciso
            return `
                    <div class="option" data-correct="${opcion.correct}">
                        <div class="letter bree fw-bold text-white">${String.fromCharCode(97 + index)}</div><div class="option-text">${opcion.text.trim()}</div>
                    </div>
                `;

            //Opcion Falso - verdadero
            /*
            return `
                <div class="option" data-correct="${opcion.correct}">
                    <div class="option-text">${opcion.text.trim()}</div>
                </div>
            `;
            */

        }).join(''); // Unimos todos los elementos en un solo string

        // Inserta el HTML generado en el contenedor de opciones
        optionsContainer.innerHTML = optionsHTML;

        Pop();
    }

    /**
     * The function `handlerOptionActions` handles user interactions with options and verification
     * buttons in a quiz-like interface, providing feedback based on the selected option.
     */
    function handlerOptionClick() {
        currentQuestionIndex++;
        $(".options")
            .find(".option")
            .on("click", function () {
                course360.soundClick();
                $(".options").addClass("disabled");

                if ($(this).data('correct') === true) {
                    course360.audioController.stopAllSoundsAndPlay(good);
                    const icon = 'correcto';
                    const html = `
                        <div class="text-center">
                            <h1 class="text-primary text-center fw-bold">¡Correcto!</h1>
                            <p class="mt-3">${currentQuestion.retroalimentacion_correcta}</p>
                        </div>`;
                    counterCorrectQuestions++;
                    updateBackgrpund(true);
                    Swal.fire({
                        html: html,
                        customClass: icon,
                        showConfirmButton: false,
                        showCloseButton: true,
                        didClose: () => { /*nextQuestion(300)*/ },
                        backdrop: `rgba(0, 0, 0, 0.9)`,
                        didDestroy: () => {
                            IsComplete();
                        },
                    });
                } else {
                    course360.audioController.stopAllSoundsAndPlay(bad);
                    updateBackgrpund(false);
                    const icon = 'incorrecto';
                    const html = `
                        <div class="text-center">
                            <h1 class="text-primary text-center fw-bold">¡Incorrecto!</h1>
                            <p class="mt-3">${currentQuestion.retroalimentacion_incorrecta}</p>
                        </div>`;
                    Swal.fire({
                        html: html,
                        customClass: icon,
                        showConfirmButton: false,
                        showCloseButton: true,
                        didClose: () => { /*nextQuestion(300)*/ },
                        backdrop: `rgba(0, 0, 0, 0.9)`,
                        didDestroy: () => {
                            IsComplete();
                        },
                    });
                }
            });
    }


    /**
     * Pasa a la siguiente pregunta o muestra la pantalla final si no hay más preguntas.
     */
    function nextQuestion(seconds) {
        $('.option').removeClass('disabled');
        if (currentQuestionIndex >= questions.length) {
            setTimeout(showFinal, 500);
        } else {
            currentQuestion = questions[currentQuestionIndex];
            correctAnswer = currentQuestion.opciones[0].text.toUpperCase();
            setTimeout(renderQuestion, seconds);
        }
    }

    // Lee y procesa las preguntas desde el archivo Excel.
    readExcelFile("preguntas_actividad_m1_Manejo_a_la_defensiva.xlsx", function (data) {
        const hojaDatos = data["quiz"]; // Nombre de la hoja del Excel.
        preguntas = procesarPreguntas(hojaDatos); // Procesa las preguntas.
        questions = shuffleArray(preguntas); // Mezcla las preguntas aleatoriamente.
        currentQuestion = questions[currentQuestionIndex];
        correctAnswer = currentQuestion.opciones[0].text.toUpperCase();
    });

    // Cargar el SVG usando SVG.js
    // const draw = SVG("#tablero"); // Donde cargaremos el SVG
    // $.get(
    //     "img/activity/tablero.svg", // Ruta al SVG
    //     function (svgDocument) {
    //         // Extraemos el nodo SVG del documento cargado
    //         const svgElement = $(svgDocument).find("svg")[0]; // Acceder al nodo DOM

    //         // Convertimos este nodo en un objeto SVG.js y lo añadimos al contenedor
    //         const svg = SVG(svgElement);
    //         draw.add(svg);

    //         //$('[id*="fle"]').hide();
    //         $('[id*="fle"]').addClass('object_handler disabled animate__animated animate__pulse animate__infinite');
    //         $('[id*="med"]').addClass('medalla').hide();


    //         $('.object_handler').each(function (index, element) {
    //             $(this).attr('data-indice', index);
    //         });

    //     },
    //     "xml"
    // );

    $(".paso").click(function () {
        $('.card-form').hide();
        $(this).removeClass("animate__animated animate__pulse animate__infinite").addClass("visited");
        const sound = eval($(this).data("audio"));
        // let content = $(this).data('slideid');
        const pasoIndex = parseInt($(this).data("paso"));
        $(this).css('opacity', 0);
        $(".personaje").removeClass("active animate__animated animate__slideInLeft");
        $(".personaje").eq(pasoIndex).addClass("active animate__animated animate__slideInLeft").one("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function () {
            nextQuestion();
            // course360.audioController.stopAllSoundsAndPlay(sound);
            // $('.card-form').show();
            // // Animación de HeartBeat
            // gsap.to('.card-form', {
            //     scale: 1.3,    // Escala inicial (latido)
            //     duration: 0.2, // Duración del primer golpe
            //     repeat: 2,     // Número de repeticiones (dos golpes para un latido completo)
            //     yoyo: true,    // Revertir la escala después de cada golpe
            //     ease: "power1.inOut", // Suaviza la animación
            //     onComplete: () => {
            //         // Restaura el tamaño original después de la animación
            //         gsap.to('.card-form', { scale: 1, duration: 0.2 });
            //     }
            // });
            // $('.content').hide();
            // $(content).show();
            // scoIsComplete();
            // sound.on("end", function () {
            //     scoIsComplete();
            // });
        });
    });

    function IsComplete() {
        // course360.audioController.stopAudio();
        $(".personaje").removeClass("animate__animated animate__slideInLeft");

        if ($(".paso").length === $(".paso.visited").length) {
            setTimeout(showFinal, 500);
        } else {
            $(".paso.visited").next().removeClass("disabled");
        }
    }

    let correctBackgroundIndex = 1; // Índice para fondos correctos
    let incorrectBackgroundIndex = 1; // Índice para fondos incorrectos

    function updateBackgrpund(isCorrect) {
        const body = document.querySelector("body");

        // Elimina todas las clases de fondo anteriores
        body.classList.remove(
            "background-correct-1", "background-correct-2", "background-correct-3",
            "background-correct-4", "background-correct-5",
            "background-incorrect-1", "background-incorrect-2", "background-incorrect-3",
            "background-incorrect-4", "background-incorrect-5"
        );

        // Agrega la clase correspondiente según la respuesta
        if (isCorrect) {
            body.classList.add(`background-correct-${correctBackgroundIndex}`);
            correctBackgroundIndex = (correctBackgroundIndex % 5) + 1; // Incrementa y reinicia el índice
        } else {
            body.classList.add(`background-incorrect-${incorrectBackgroundIndex}`);
            incorrectBackgroundIndex = (incorrectBackgroundIndex % 5) + 1; // Incrementa y reinicia el índice
        }

    }

// Función para mover/ocultar el objeto
// function hideObject() {
//     $('.selected_object').removeClass('selected_object animate__pulse animate__infinite').addClass('disabled visited');
//     $('.card-question').hide();
//     //AnimationLibrary.slideInFromRight('#fle'+currentQuestionIndex);
//     if (currentQuestionIndex >= questions.length) {
//         setTimeout(showFinal, 500);
//     }
// }

// Función para mover/mostrar el objeto
// function showObject() {
//     let id = $('.selected_object').data('indice');
//     $('.selected_object').removeClass('selected_object animate__pulse animate__infinite').addClass('disabled visited correct');
//     $('#med' + id).show();
//     $('.card-question').hide();
//     //AnimationLibrary.slideInFromRight('#fle'+currentQuestionIndex);
//     if (currentQuestionIndex >= questions.length) {
//         setTimeout(showFinal, 500);
//     }
// }

//Funcionalidad para dispositivos moviles para mostrar preguntas
function Pop() {
    Swal.fire({
        html: $('#pregunta').html(),
        target: 'body',
        customClass: "question-class-pop",
        showConfirmButton: false,     // Oculta el botón de confirmación
        showCancelButton: false,      // Oculta el botón de cancelación
        allowOutsideClick: false,     // Deshabilita el cierre al hacer clic fuera
        allowEscapeKey: false,        // Deshabilita el cierre con la tecla "Esc"
        allowEnterKey: false,          // Deshabilita el cierre con la tecla "Enter"
        didOpen: () => { },
        willClose: () => { course360.audioController.stopAudio(); }
    });
}

function clickHandlerQuestion() {
    $(".object_handler").click(function () {
        $(this).addClass('selected_object');
        $('.card-question').show();
        nextQuestion();
    });
}

// Define los sonidos adicionales para la pantalla final.
const audioExcelente = course360.createSound("audio/audio_h32.mp3");
const audioSorry = course360.createSound("audio/audio_h33.mp3");
const audioIntentos = course360.createSound("audio/audio_h33.mp3");

/**
 * Muestra la pantalla final con los resultados del juego.
 */
function showFinal() {
    $("#desarrollo").hide();
    $("#cierre").show();
    const score = Math.round((counterCorrectQuestions * 100) / question);
    if (score >= maxScore) {
        $("body").addClass("fakeBodyCierreGood");
        $("#retrotxt").html(`<h2 class="fw-bold text-primary text-center"> ¡Excelente trabajo! </h2><p class="text-center">Has demostrado un dominio extraordinario del manejo a la defensiva.</p><p class="fw-bold">¡Tu camino es claro y seguro!</p>`);
        $(".score80mas").show();
        $(".score80menos").hide();
        $(".intentos").hide();
        course360.setSlideVisited();
        course360.audioController.stopAllSoundsAndPlay(audioExcelente);
        course360.setScore(score);
        course360.setLessonStatus('completed');
        course360.save();
        //course360.setLessonStatus('passed');
    } else if (intento >= intentosMaximos) {
        $("#retrotxt").html(`<h1 class="fw-bold text-primary text-center"></h1><p class="text-center">Revisa nuevamente el contenido y responde la evaluación cuando estés preparado.</p>`);
        $(".score80mas").hide();
        $(".score80menos").hide();
        $(".intentos").show();
        course360.setLessonLocation(0);
        course360.audioController.stopAllSoundsAndPlay(audioIntentos);
    } else {
        $("body").addClass("fakeBodyCierreBad");
        $("#retrotxt").html(`<h1 class="fw-bold text-primary text-center">Aún puedes mejorar.</h1><p class="text-center">Algunas decisiones en el camino no fueron las mejores, pero puedes volver a intentarlo.</p><p class="fw-bold">¡Toma el volante otra vez y demuestra lo que sabes!</p>`);
        $(".score80mas").hide();
        $(".score80menos").show();
        $(".intentos").hide();
        course360.audioController.stopAllSoundsAndPlay(audioSorry);
        //course360.setLessonStatus('completed');
        //course360.setSlideVisited();
    }
    // Llamar a la función
    //ratingGraph(score);
    course360.save();
}

// Función para graficar el rating
function ratingGraph(value) {


    // Crear un nuevo objeto de barra de progreso
    const bar = new ProgressBar.Circle("#progress-container", {
        color: "#FFEA82",
        trailColor: "#eee",
        trailWidth: 7,
        duration: 1400,
        easing: "bounce",
        strokeWidth: 14,
        from: { color: "#d33266", a: 0 }, // Color de inicio
        to: { color: "#e2688e", a: 1 }, // Color final
        step: function (state, circle) {
            circle.path.setAttribute("stroke", state.color);
        },
    });
    // Validar el valor para asegurarse de que esté entre 0 y 100
    if (value < 0 || value > 100) {
        console.error("El valor debe estar entre 0 y 100.");
        return;
    }

    // Actualizar la barra de progreso
    bar.animate(value / 100); // Convertir a decimal

    // Actualizar el texto del porcentaje
    const text = document.querySelector(".progress-text") || document.createElement("div");
    text.className = "progress-text";
    text.innerText = value + "%";

    // Asegurarse de que el texto se añada al contenedor
    if (!document.querySelector(".progress-text")) {
        document.getElementById("progress-container").appendChild(text);
    }
}


    });
