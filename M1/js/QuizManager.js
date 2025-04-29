(function (global) {
  "use strict";

  /**
   * QuizManager: Clase principal para gestionar cuestionarios basados en un archivo Excel.
   */
  class QuizManager {
    /**
     * @constructor
     * @param {Object} config - Configuración del cuestionario.
     * @param {string} config.excelFileUrl - URL del archivo Excel que contiene las preguntas.
     * @param {Object} [config.mandatoryFields] - Campos obligatorios en el archivo Excel para el cuestionario.
     * @param {string} [config.mandatoryFields.question="pregunta"] - Nombre de la columna para el texto de la pregunta.
     * @param {string} [config.mandatoryFields.correctOption="opcion_c"] - Nombre de la columna que identifica la respuesta correcta.
     * @param {string} [config.mandatoryFields.correctFeedback="retroalimentacion_correcta"] - Nombre de la columna para la retroalimentación en respuestas correctas.
     * @param {string} [config.mandatoryFields.incorrectFeedback="retroalimentacion_incorrecta"] - Nombre de la columna para la retroalimentación en respuestas incorrectas.
     * @param {string} [config.optionPrefix="opcion"] - Prefijo utilizado para identificar las columnas de las opciones de respuesta.
     * @param {boolean} [config.randomizeQuestions=false] - Indica si las preguntas deben presentarse en orden aleatorio.
     * @param {boolean} [config.randomizeOptions=false] - Indica si las opciones dentro de una pregunta deben ordenarse aleatoriamente.
     * @param {number} [config.passingScore=80] - Puntaje mínimo necesario para aprobar el cuestionario, expresado en porcentaje.
     * @param {number} [config.defaultWeight=1] - Ponderación por defecto asignada a cada pregunta, si no se especifica en el archivo Excel.
     * @param {number} [config.maxQuestions=Infinity] - Número máximo de preguntas a incluir en el cuestionario. Si no se especifica, se incluyen todas las preguntas.
     * @param {number} [config.maxAttempts=Infinity] - Número máximo de intentos permitidos para completar el cuestionario. Por defecto, es infinito.
     * @license Licencia Comercial Propietaria
     * @version 1.0.0
     * @author Salvador Martínez
     * @copyright Este software está protegido por derechos de autor y es propiedad de E360 Digital Solutions S.A. de C.V.
     * El uso está restringido a los términos y condiciones establecidos en el contrato de licencia.
     * Para obtener una licencia y acceder a las características completas y soporte, contáctenos en licencias@espacio360.com.mx
     */
    constructor(config) {
      this.config = {
        excelFileUrl: config.excelFileUrl,
        mandatoryFields: config.mandatoryFields || {
          question: "pregunta",
          correctOption: "opcion_c",
          correctFeedback: "retroalimentacion_correcta",
          incorrectFeedback: "retroalimentacion_incorrecta",
        },
        optionPrefix: config.optionPrefix || "opcion",
        randomizeQuestions: config.randomizeQuestions || false,
        randomizeOptions: config.randomizeOptions || false,
        passingScore: config.passingScore || 80,
        defaultWeight: config.defaultWeight || 1,
        maxAttempts: config.maxAttempts || Infinity,
        maxQuestions: config.maxQuestions || Infinity,
      };
      this.questions = []; // Contendrá las preguntas seleccionadas para el cuestionario.
      this.currentQuestionIndex = 0; // Índice de la pregunta actual en el cuestionario.
      this.correctAnswersCount = 0; // Contador de respuestas correctas.
      this.incorrectAnswersCount = 0; // Contador de respuestas incorrectas.
      this.totalScore = 0; // Puntaje acumulado del cuestionario.
      this.attempts = 0; // Contador de intentos realizados.
    }

    /**
     * Carga las preguntas desde el archivo Excel especificado en la configuración.
     * @async
     * @returns {Promise<void>}
     */
    async loadQuestionsFromExcel() {
      const rawData = await QuizManager.readExcelFile(this.config.excelFileUrl);

      const sheetName = Object.keys(rawData)[0];
      const sheetData = rawData[sheetName];

      if (!Array.isArray(sheetData)) {
        console.error("The selected sheet does not contain an array of data.");
        return;
      }

      let questions = QuizManager.processQuestions(sheetData, this.config);

      if (this.config.randomizeQuestions) {
        questions = QuizManager.shuffle(questions);
      }

      // Validar maxQuestions solo si fue definido explícitamente
      const totalQuestions = questions.length;
      if (this.config.maxQuestions !== Infinity && this.config.maxQuestions > totalQuestions) {
        throw new Error(`El número máximo de preguntas especificado (${this.config.maxQuestions}) excede el total disponible (${totalQuestions}).`);
      }

      // Seleccionar las preguntas según maxQuestions
      this.questions = this.config.maxQuestions === Infinity ? questions : questions.slice(0, this.config.maxQuestions);
    }

    /**
     * Lee un archivo Excel y lo convierte a un objeto JSON.
     * @static
     * @async
     * @param {string} url - URL del archivo Excel.
     * @returns {Promise<Object>} Objeto donde las hojas del Excel son claves y sus datos son arrays de objetos.
     */
    static async readExcelFile(url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const result = {};
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          result[sheetName] = XLSX.utils.sheet_to_json(sheet);
        });
        return result;
      } catch (error) {
        console.error("Error reading Excel file:", error);
        throw error;
      }
    }

    /**
     * Procesa los datos de una hoja del Excel para generar las preguntas.
     * @static
     * @param {Array} rawData - Datos de una hoja en formato JSON.
     * @param {Object} config - Configuración para procesar preguntas.
     * @returns {Array} Array de preguntas procesadas.
     */
    static processQuestions(rawData, config) {
      return rawData
        .map((row) => {
          const fields = config.mandatoryFields;

          if (!row[fields.question] || !row[fields.correctOption]) {
            console.error(`Missing mandatory fields: '${fields.question}' or '${fields.correctOption}'`);
            return null;
          }

          let options = Object.keys(row)
            .filter((key) => key.startsWith(config.optionPrefix))
            .map((key) => ({
              id: key,
              text: row[key]?.trim(),
              isCorrect: key === fields.correctOption,
            }));

          const specialOptionsTexts = config.specialOptions || [];
          let specialOptions = [];
          let regularOptions = [];

          options.forEach((option) => {
            if (specialOptionsTexts.some((text) => option.text.toLowerCase().includes(text.toLowerCase()))) {
              specialOptions.push(option);
            } else {
              regularOptions.push(option);
            }
          });

          if (config.randomizeOptions) {
            regularOptions = QuizManager.shuffle(regularOptions);
          }

          options = [...regularOptions, ...specialOptions];

          const additionalInfo = Object.keys(row)
            .filter((key) => !Object.values(fields).includes(key) && !key.startsWith(config.optionPrefix))
            .reduce((info, key) => {
              // Convertir a cadena antes de aplicar .trim() y manejar valores nulos/indefinidos
              const value = row[key] !== null && row[key] !== undefined ? String(row[key]).trim() : "";
              info[key] = value;
              return info;
            }, {});

          const weight = parseFloat(row["ponderacion"]) || config.defaultWeight;

          return {
            question: row[fields.question].trim(),
            options,
            correctFeedback: row[fields.correctFeedback]?.trim() || "",
            incorrectFeedback: row[fields.incorrectFeedback]?.trim() || "",
            additionalInfo,
            weight,
          };
        })
        .filter(Boolean);
    }

    /**
     * Baraja un array usando el algoritmo Fisher-Yates.
     * @static
     * @param {Array} array - Array a barajar.
     * @returns {Array} Array barajado.
     */
    static shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    /**
     * Obtiene la pregunta actual.
     * @returns {Object} La pregunta actual.
     */
    getCurrentQuestion() {
      return this.questions[this.currentQuestionIndex];
    }

    /**
     * Avanza a la siguiente pregunta y la retorna.
     * @returns {Object|null} La siguiente pregunta o `null` si no hay más.
     */
    getNextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        return this.questions[this.currentQuestionIndex];
      }
      return null;
    }
    /**
     * Registra la respuesta del usuario a una pregunta específica por su ID.
     * @param {number} questionId - El ID de la pregunta a responder.
     * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
     */
    answerQuestionById(questionId, isCorrect) {
      if (questionId < 0 || questionId >= this.questions.length) {
        console.error(`Invalid question ID: ${questionId}`);
        return;
      }

      const question = this.questions[questionId];

      if (!question.answered) {
        question.answered = true; // Marcar la pregunta como respondida
        question.isAnswerCorrect = isCorrect; //Guarda el resultado de la respuesta
        if (isCorrect) {
          this.correctAnswersCount++;
          this.totalScore += question.weight;
        } else {
          this.incorrectAnswersCount++;
        }
      } else {
        console.warn(`Question ID ${questionId} has already been answered.`);
      }
    }

    /**
     * Registra la respuesta del usuario a la pregunta actual.
     * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
     */
    answerCurrentQuestion(isCorrect) {
      this.answerQuestionById(this.currentQuestionIndex, isCorrect);
    }

    /**
     * Registra la respuesta del usuario a la pregunta por su indice.
     * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
     */
    answerCurrentQuestionById(index, isCorrect) {
      this.answerQuestionById(index, isCorrect);
    }

    /**
     * Verifica si hay más preguntas disponibles.
     * @returns {boolean} `true` si hay más preguntas, `false` de lo contrario.
     */
    hasMoreQuestions() {
      // Contamos cuántas preguntas han sido respondidas
      const answeredQuestions = this.questions.filter((q) => q.answered).length;

      // Si el número de preguntas respondidas es menor que el total, hay más preguntas
      return answeredQuestions < this.questions.length;
    }

    /**
     * Genera un resumen del estado actual del cuestionario.
     * @returns {Object} Resumen del cuestionario.
     */
    getSummary() {
      const totalQuestions = this.questions.length;
      const maxScore = this.questions.reduce((sum, q) => sum + q.weight, 0);
      const scorePercentage = Math.round((this.totalScore * 100) / maxScore);
      const passed = scorePercentage >= this.config.passingScore;

      return {
        correct: this.correctAnswersCount,
        incorrect: this.incorrectAnswersCount,
        total: totalQuestions,
        score: scorePercentage,
        maxScore,
        passed,
        attempts: this.attempts,
        maxAttempts: this.config.maxAttempts,
      };
    }

    /**
     * Genera un resumen del estado de un conjunto de preguntas.
     * @param {Set} questionSet - Conjunto de preguntas del cuestionario.
     * @returns {Object} Resumen del cuestionario.
     */
    generateSummaryFromSet(questionSet) {
      // Convertir el Set a un Array para procesarlo
      const questions = Array.from(questionSet);
      // Variables para calcular el resumen
      const totalQuestions = questions.length;
      const maxScore = questions.reduce((sum, q) => sum + (q.weight || 1), 0);
      const correctAnswersCount = questions.filter((q) => q.isAnswerCorrect).length;
      const incorrectAnswersCount = totalQuestions - correctAnswersCount;
      const totalScore = questions.reduce((sum, q) => (q.isAnswerCorrect ? sum + (q.weight || 1) : sum), 0);
      const scorePercentage = maxScore > 0 ? Math.round((totalScore * 100) / maxScore) : 0;
      const passed = scorePercentage >= this.config.passingScore;
      // Generar el resumen
      return {
        correct: correctAnswersCount,
        incorrect: incorrectAnswersCount,
        total: totalQuestions,
        score: scorePercentage,
        maxScore,
        passed,
        attempts: this.attempts,
        maxAttempts: this.config.maxAttempts,
      };
    }
    /**
     * Devuelve los datos necesarios para renderizar la pregunta actual.
     * @returns {Object|null} Datos de la pregunta actual o `null` si no existe.
     */
    getRenderData() {
      const currentQuestion = this.getCurrentQuestion();
      if (!currentQuestion) return null;

      return {
        text: currentQuestion.question,
        options: currentQuestion.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
        correctFeedback: currentQuestion.correctFeedback,
        incorrectFeedback: currentQuestion.incorrectFeedback,
        additionalInfo: currentQuestion.additionalInfo,
      };
    }

    /**
     * Obtiene una pregunta específica por ID.
     * @param {number} id - Índice de la pregunta.
     * @returns {Object|null} Pregunta correspondiente o `null` si el índice no es válido.
     */
    getQuestionById(id) {
      if (id < 0 || id >= this.questions.length) {
        console.error(`Invalid question ID: ${id}`);
        return null;
      }
      return this.questions[id];
    }

    /**
     * Genera los datos necesarios para renderizar una pregunta específica por ID.
     * @param {number} id - Índice de la pregunta.
     * @returns {Object|null} Datos de renderizado o `null` si el ID no es válido.
     */
    getRenderDataById(id) {
      const question = this.getQuestionById(id);
      if (!question) return null;

      return {
        text: question.question,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
        correctFeedback: question.correctFeedback,
        incorrectFeedback: question.incorrectFeedback,
        additionalInfo: question.additionalInfo,
      };
    }

    /**
     * Devuelve los datos necesarios para renderizar todas las preguntas.
     * @returns {Array} Array de objetos con los datos de todas las preguntas.
     */
    getAllRenderData() {
      return this.questions.map((question) => ({
        text: question.question,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
        correctFeedback: question.correctFeedback,
        incorrectFeedback: question.incorrectFeedback,
        additionalInfo: question.additionalInfo,
      }));
    }
    /**
     * Incrementa el número de intentos del cuestionario.
     */
    incrementAttempts() {
      this.attempts++;
    }

    /**
     * Obtiene el número de intentos actuales.
     * @returns {number} Número de intentos.
     */
    getAttempts() {
      return this.attempts;
    }
    /**
     * Establece el número de intentos desde una fuente externa (LMS, etc.).
     * @param {number} attempts - Número inicial de intentos.
     */
    setAttempts(attempts) {
      if (isNaN(attempts) || attempts < 0) {
        console.error("El valor de intentos no es válido.");
        return;
      }
      this.attempts = attempts;
    }

    /**
     * Verifica si el número máximo de intentos se ha alcanzado.
     * @returns {boolean} `true` si se alcanzó el máximo de intentos, `false` de lo contrario.
     */
    hasReachedMaxAttempts() {
      return this.attempts >= this.config.maxAttempts;
    }
  }

  // Exponer la clase al ámbito global
  global.QuizManager = QuizManager;
})(window);
