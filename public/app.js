// Analizador de texto del cliente en Español
document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const textInput = document.getElementById('textInput');
  const wordCountEl = document.getElementById('wordCount');
  const charCountEl = document.getElementById('charCount');
  const charNoSpacesCountEl = document.getElementById('charNoSpacesCount');
  const sentenceCountEl = document.getElementById('sentenceCount');
  const paragraphCountEl = document.getElementById('paragraphCount');
  const avgWordLengthEl = document.getElementById('avgWordLength');
  const readingLevelBadgeEl = document.getElementById('readingLevelBadge');
  const readingTimeEl = document.getElementById('readingTime');
  const speakingTimeEl = document.getElementById('speakingTime');
  const fleschScoreLabelEl = document.getElementById('fleschScoreLabel');
  const readabilityProgressEl = document.getElementById('readabilityProgress');
  const readabilityDescriptionEl = document.getElementById('readabilityDescription');
  const keywordsContainerEl = document.getElementById('keywordsContainer');
  const toastEl = document.getElementById('toast');

  // Botones de la barra de herramientas
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const cleanSpacesBtn = document.getElementById('cleanSpacesBtn');
  const caseDropdownBtn = document.getElementById('caseDropdownBtn');
  const caseMenu = document.getElementById('caseMenu');
  const caseItems = document.querySelectorAll('.dropdown-item');

  // Claves de Almacenamiento Local
  const STORAGE_KEY_TEXT = 'contador_palabras_texto';
  const STORAGE_KEY_THEME = 'contador_palabras_tema';

  // Palabras vacías en Español (Stopwords) para densidad de palabras clave
  const stopWordsEs = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su',
    'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'son', 'entre', 'está',
    'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo',
    'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí',
    'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes',
    'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú',
    'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo',
    'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro',
    'vuestra', 'vuestros', 'vuestras', 'es', 'era', 'eras', 'éramos', 'eran', 'fui', 'fue', 'fuiste', 'fuimos', 'fueron',
    'he', 'has', 'ha', 'hemos', 'habéis', 'han', 'haya', 'hayan', 'había', 'habían', 'hacer', 'hace', 'hacen', 'hizo'
  ]);

  // Contador aproximado de sílabas en español
  function countSyllablesSpanish(word) {
    word = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
    if (!word) return 0;
    if (word.length <= 2) return 1;
    
    // Grupos vocálicos en español
    const vowels = word.match(/[aáeéoóuúüií]/gi);
    if (!vowels) return 1;
    
    // Estimación simplificada considerando diptongos comunes
    let count = vowels.length;
    const diphthongs = word.match(/[aeoáéó][iu]|i[aeouáéóú]|[iu][iu]/gi);
    if (diphthongs) {
      count -= diphthongs.length;
    }
    return Math.max(1, count);
  }

  // Formato de duración en español
  function formatDuration(totalSec) {
    if (totalSec === 0) return '0 seg';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} seg`;
    if (secs === 0) return `${mins} min`;
    return `${mins}m ${secs}s`;
  }

  // Notificación flotante (Toast)
  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  // Análisis de texto en tiempo real
  function analyzeText(text) {
    const rawChars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;

    // Conteo de palabras con soporte para caracteres y tildes en español
    const wordsArray = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
    const words = wordsArray.length;

    // Conteo de oraciones
    const sentencesArray = text.trim() ? (text.match(/[^.!?¡¿]+[.!?¡¿]+(\s|$)|[^.!?¡¿]+$/g) || []).filter(s => s.trim().length > 0) : [];
    const sentences = sentencesArray.length;

    // Conteo de párrafos
    const paragraphsArray = text.split(/\n+/).filter(p => p.trim().length > 0);
    const paragraphs = paragraphsArray.length;

    // Tiempo de lectura (225 palabras por minuto) y discurso (130 ppm)
    const readingSecs = Math.ceil((words / 225) * 60);
    const speakingSecs = Math.ceil((words / 130) * 60);

    // Longitud promedio de palabra
    const totalWordChars = wordsArray.reduce((acc, w) => acc + w.length, 0);
    const avgWordLen = words > 0 ? (totalWordChars / words).toFixed(1) : '0.0';

    // Cálculo de Legibilidad Gutiérrez de Polini / Flesch adaptado a Español
    let totalSyllables = 0;
    for (const w of wordsArray) {
      totalSyllables += countSyllablesSpanish(w);
    }

    let fleschScore = 100;
    let readingLevel = 'Muy Fácil';
    let readingDesc = 'El texto es muy fácil de leer, apto para todo tipo de lectores.';

    if (words > 0 && sentences > 0) {
      // Fórmula de Flesch-Szigriszt para español: 206.84 - (62.3 * silabas/palabras) - (palabras/oraciones)
      const rawScore = 206.84 - (62.3 * (totalSyllables / words)) - (words / sentences);
      fleschScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      if (fleschScore >= 85) {
        readingLevel = 'Muy Fácil';
        readingDesc = 'Lectura muy sencilla. Estilo conversacional y accesible a todo público.';
      } else if (fleschScore >= 75) {
        readingLevel = 'Fácil';
        readingDesc = 'Lectura fluida y amena. Ideal para artículos web y blogs de divulgación.';
      } else if (fleschScore >= 65) {
        readingLevel = 'Normal';
        readingDesc = 'Nivel estándar de comprensión para prensa diaria y redacción general.';
      } else if (fleschScore >= 50) {
        readingLevel = 'Algo Difícil';
        readingDesc = 'Requiere atención. Adecuado para publicaciones profesionales o técnicas.';
      } else if (fleschScore >= 35) {
        readingLevel = 'Difícil';
        readingDesc = 'Complejo. Propio de ensayos académicos o literatura especializada.';
      } else {
        readingLevel = 'Muy Difícil';
        readingDesc = 'Muy complejo. Vocabulario técnico y oraciones de estructura densa.';
      }
    }

    // Densidad de palabras clave en español
    const freqMap = {};
    for (const w of wordsArray) {
      const clean = w.toLowerCase();
      if (clean.length > 2 && !stopWordsEs.has(clean)) {
        freqMap[clean] = (freqMap[clean] || 0) + 1;
      }
    }

    const keywords = Object.entries(freqMap)
      .map(([word, count]) => ({
        word,
        count,
        percentage: ((count / (words || 1)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Actualización de la interfaz
    wordCountEl.textContent = words.toLocaleString('es-ES');
    charCountEl.textContent = rawChars.toLocaleString('es-ES');
    charNoSpacesCountEl.textContent = charsNoSpaces.toLocaleString('es-ES');
    sentenceCountEl.textContent = sentences.toLocaleString('es-ES');
    paragraphCountEl.textContent = paragraphs.toLocaleString('es-ES');
    avgWordLengthEl.textContent = avgWordLen;
    readingLevelBadgeEl.textContent = readingLevel;

    readingTimeEl.textContent = formatDuration(readingSecs);
    speakingTimeEl.textContent = formatDuration(speakingSecs);

    fleschScoreLabelEl.textContent = `Puntaje ${fleschScore}/100`;
    readabilityProgressEl.style.width = `${fleschScore}%`;
    readabilityDescriptionEl.textContent = readingDesc;

    // Renderizar chips de palabras clave
    if (keywords.length === 0) {
      keywordsContainerEl.innerHTML = '<p class="empty-keywords">Escribe texto para ver las palabras más repetidas y su densidad.</p>';
    } else {
      keywordsContainerEl.innerHTML = keywords.map(k => `
        <div class="keyword-chip">
          <span>${k.word}</span>
          <span class="keyword-count">${k.count} (${k.percentage}%)</span>
        </div>
      `).join('');
    }
  }

  // Entrada de texto con persistencia
  textInput.addEventListener('input', () => {
    const content = textInput.value;
    analyzeText(content);
    localStorage.setItem(STORAGE_KEY_TEXT, content);
  });

  // Restaurar texto guardado
  const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
  if (savedText) {
    textInput.value = savedText;
  }
  analyzeText(textInput.value);

  // Gestión de temas (Claro / Oscuro)
  function initTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    });
  }

  initTheme();

  // Inicialización del editor (solo en páginas con textInput)
  if (textInput) {
    // Entrada de texto con persistencia
    textInput.addEventListener('input', () => {
      const content = textInput.value;
      analyzeText(content);
      localStorage.setItem(STORAGE_KEY_TEXT, content);
    });

    // Restaurar texto guardado
    const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
    if (savedText) {
      textInput.value = savedText;
    }
    analyzeText(textInput.value);

    // Acción Copiar
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!textInput.value) {
          showToast('¡No hay texto para copiar!');
          return;
        }
        try {
          await navigator.clipboard.writeText(textInput.value);
          showToast('¡Copiado al portapapeles!');
        } catch (err) {
          textInput.select();
          document.execCommand('copy');
          showToast('¡Copiado al portapapeles!');
        }
      });
    }

    // Acción Descargar (.txt)
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const content = textInput.value;
        if (!content) {
          showToast('¡No hay texto para guardar!');
          return;
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conteo-palabras-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('¡Archivo guardado con éxito!');
      });
    }

    // Acción Borrar
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!textInput.value) return;
        if (confirm('¿Estás seguro de que deseas borrar todo el texto?')) {
          textInput.value = '';
          analyzeText('');
          localStorage.removeItem(STORAGE_KEY_TEXT);
          textInput.focus();
          showToast('Texto borrado');
        }
      });
    }

    // Limpiar espacios y saltos innecesarios
    if (cleanSpacesBtn) {
      cleanSpacesBtn.addEventListener('click', () => {
        if (!textInput.value) return;
        const cleaned = textInput.value
          .split('\n')
          .map(line => line.replace(/[ \t]+/g, ' ').trim())
          .filter(line => line.length > 0)
          .join('\n\n');

        textInput.value = cleaned;
        analyzeText(cleaned);
        localStorage.setItem(STORAGE_KEY_TEXT, cleaned);
        showToast('¡Espacios innecesarios eliminados!');
      });
    }

    // Menú desplegable de mayúsculas / minúsculas
    if (caseDropdownBtn && caseMenu) {
      caseDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        caseMenu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        caseMenu.classList.remove('show');
      });
    }

    // Transformaciones de tipo de letra
    caseItems.forEach(item => {
      item.addEventListener('click', () => {
        const mode = item.getAttribute('data-case');
        const val = textInput.value;
        if (!val) return;

        let transformed = val;
        if (mode === 'uppercase') {
          transformed = val.toUpperCase();
        } else if (mode === 'lowercase') {
          transformed = val.toLowerCase();
        } else if (mode === 'titlecase') {
          transformed = val.toLowerCase().replace(/\b[\p{L}\p{N}]+/gu, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substring(1);
          });
        } else if (mode === 'sentencecase') {
          transformed = val.toLowerCase().replace(/(^\s*[\p{L}\p{N}]|[.!?¡¿]\s*[\p{L}\p{N}])/gu, (c) => c.toUpperCase());
        }

        textInput.value = transformed;
        analyzeText(transformed);
        localStorage.setItem(STORAGE_KEY_TEXT, transformed);
        if (caseMenu) caseMenu.classList.remove('show');
        showToast(`Convertido a ${item.textContent}`);
      });
    });
  }

  // Ocultar Skeleton Loader suavemente
  const skeletonLoader = document.getElementById('skeletonLoader');
  if (skeletonLoader) {
    setTimeout(() => {
      skeletonLoader.classList.add('loaded');
      setTimeout(() => skeletonLoader.remove(), 400);
    }, 150);
  }
});
