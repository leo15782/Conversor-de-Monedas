/**
 * Conversor de Monedas y Criptomonedas
 * Aplicación web para conversión en tiempo real entre monedas fiduciarias y criptomonedas
 * con gráficos de tendencias y autocompletado inteligente.
 */
class CurrencyConverter {
  constructor() {
    // Configuración de APIs
    this.exchangeRateAPI = "https://api.exchangerate-api.com/v4/latest/";
    this.coinGeckoAPI = "https://api.coingecko.com/api/v3/simple/price";

    // Almacenamiento de datos dinámicos
    this.allCurrencies = [];
    this.cryptoIdMap = new Map(); // Renombrado para mayor claridad
    this.priceChart = null; // Instancia del gráfico Chart.js

    // Datos estáticos cargados desde archivos JSON externos
    this.currencyNames = {};
    this.popularCurrencyCodes = []; // Renombrado para mayor claridad
    this.fallbackCryptoCurrencies = []; // Renombrado para mayor claridad

    this.init();
  }

  /**
   * Inicializa la aplicación configurando eventos y cargando datos
   */
  init() {
    this.setupEventListeners();
    this.loadStaticData().then(() => {
      this.showWelcomeMessage();
    });
  }

  /**
   * Carga de forma asíncrona todos los datos estáticos desde archivos JSON
   * Utiliza Promise.all para carga concurrente optimizada
   */
  async loadStaticData() {
    try {
      // Cargar todos los datos estáticos en paralelo para mejor rendimiento
      const [currencyNamesData, popularCurrenciesData, fallbackCryptosData] =
        await Promise.all([
          fetch("./data/currency-names.json").then((response) =>
            response.json()
          ),
          fetch("./data/popular-currencies.json").then((response) =>
            response.json()
          ),
          fetch("./data/fallback-cryptos.json").then((response) =>
            response.json()
          ),
        ]);

      // Asignar datos cargados a las propiedades de la instancia
      this.currencyNames = currencyNamesData;
      this.popularCurrencyCodes = popularCurrenciesData.popularCodes;
      this.fallbackCryptoCurrencies = fallbackCryptosData.fallbackCryptos;
    } catch (error) {
      console.error("Error cargando datos estáticos:", error);
      // Activar sistema de respaldo con datos mínimos
      this.initializeFallbackData();
    }
  }

  /**
   * Inicializa datos básicos de respaldo en caso de falla en la carga de archivos JSON
   * Garantiza funcionalidad mínima de la aplicación
   */
  initializeFallbackData() {
    // Conjunto mínimo de monedas para funcionalidad básica
    this.currencyNames = {
      USD: "Dólar Estadounidense",
      EUR: "Euro",
      GBP: "Libra Esterlina",
      ARS: "Peso Argentino",
    };
    this.popularCurrencyCodes = ["USD", "EUR", "GBP", "ARS", "BTC", "ETH"];
    this.fallbackCryptoCurrencies = [
      { code: "BTC", name: "Bitcoin", type: "crypto", id: "bitcoin" },
      { code: "ETH", name: "Ethereum", type: "crypto", id: "ethereum" },
    ];
  }

  showWelcomeMessage() {
    // Mostrar mensaje de bienvenida si SweetAlert2 está disponible
    if (typeof Swal !== "undefined") {
      // Usar setTimeout para asegurar que el DOM esté completamente listo
      setTimeout(() => {
        Swal.fire({
          icon: "info",
          title: "¡Bienvenido al Conversor de Monedas! 💱",
          html: `
            <div style="text-align: left; line-height: 1.6;">
              <p><strong>🌍 Funcionalidades principales:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>💰 Conversión de monedas fiduciarias (USD, EUR, ARS, etc.)</li>
                <li>₿ Conversión de criptomonedas (Bitcoin, Ethereum, etc.)</li>
                <li>📈 Gráficos de tendencias de precios (30 días)</li>
                <li>🔍 Autocompletado inteligente</li>
                <li>📊 Datos en tiempo real</li>
              </ul>
              <p><strong>🚀 ¡Comienza convirtiendo tus monedas ahora!</strong></p>
            </div>
          `,
          confirmButtonText: "Continuar",
          confirmButtonColor: "#667eea",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCloseButton: false,
          focusConfirm: true,
          backdrop: true,
          heightAuto: false,
          customClass: {
            popup: "swal-custom welcome-popup",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Cargar monedas solo después de que el usuario confirme
            this.loadCurrencies();
          }
        });
      }, 500);
    } else {
      // Si SweetAlert2 no está disponible, cargar monedas directamente
      this.loadCurrencies();
    }
  }

  /**
   * Configura todos los event listeners de la interfaz de usuario
   * Maneja eventos de conversión, navegación por teclado y autocompletado
   */
  setupEventListeners() {
    const convertButton = document.getElementById("convert-btn");
    const amountInput = document.getElementById("amount");
    const fromCurrencyInput = document.getElementById("from-currency");
    const toCurrencyInput = document.getElementById("to-currency");

    // Validar que todos los elementos DOM necesarios estén presentes
    if (
      !convertButton ||
      !amountInput ||
      !fromCurrencyInput ||
      !toCurrencyInput
    ) {
      console.error("No se pudieron encontrar todos los elementos necesarios");
      return;
    }

    // Evento principal de conversión
    convertButton.addEventListener("click", () => this.convertCurrency());

    // Permitir conversión con tecla Enter en el campo de monto
    amountInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.convertCurrency();
      }
    });

    // Configurar sistema de autocompletado para ambos campos de moneda
    this.setupAutocomplete(fromCurrencyInput, "from-currency-list");
    this.setupAutocomplete(toCurrencyInput, "to-currency-list");

    // Cerrar listas de autocompletado al hacer clic fuera del contenedor
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".autocomplete-container")) {
        this.hideAllAutocompleteLists();
      }
    });
  }

  async loadCurrencies() {
    try {
      // Mostrar mensaje de carga
      this.showCurrencyLoading();

      // Cargar monedas fiduciarias desde ExchangeRate-API
      const fiatCurrencies = await this.loadFiatCurrencies();

      // Cargar las principales criptomonedas desde CoinGecko
      const cryptoCurrencies = await this.loadCryptoCurrencies();

      // Combinar todas las monedas
      this.allCurrencies = [...fiatCurrencies, ...cryptoCurrencies];

      // Poblar los selects
      this.populateSelects(this.allCurrencies);

      // Notificación de éxito sutil si SweetAlert2 está disponible
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "success",
          title: "Monedas cargadas",
          text: `${this.allCurrencies.length} monedas disponibles para conversión`,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (error) {
      console.error("Error cargando monedas:", error);
      this.showError("Error al cargar las monedas disponibles");
    }
  }

  async loadFiatCurrencies() {
    try {
      const response = await fetch(`${this.exchangeRateAPI}USD`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Error al cargar monedas fiduciarias");
      }

      const fiatCurrencies = Object.keys(data.rates).map((code) => ({
        code: code,
        name: this.currencyNames[code] || code,
        type: "fiat",
      }));

      // Agregar USD que no está en rates
      fiatCurrencies.unshift({
        code: "USD",
        name: this.currencyNames["USD"] || "Dólar Estadounidense",
        type: "fiat",
      });

      // Ordenar alfabéticamente
      return fiatCurrencies.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error("Error cargando monedas fiduciarias:", error);
      // Fallback con monedas principales
      return [
        { code: "USD", name: "Dólar Estadounidense", type: "fiat" },
        { code: "EUR", name: "Euro", type: "fiat" },
        { code: "GBP", name: "Libra Esterlina", type: "fiat" },
        { code: "JPY", name: "Yen Japonés", type: "fiat" },
        { code: "ARS", name: "Peso Argentino", type: "fiat" },
        { code: "BRL", name: "Real Brasileño", type: "fiat" },
      ];
    }
  }

  async loadCryptoCurrencies() {
    try {
      // Cargar las top 100 criptomonedas por capitalización de mercado
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Error al cargar criptomonedas");
      }

      const cryptoCurrencies = data.map((cryptoData) => {
        // Guardar mapeo de símbolo a ID para conversiones posteriores
        this.cryptoIdMap.set(cryptoData.symbol.toUpperCase(), cryptoData.id);

        return {
          code: cryptoData.symbol.toUpperCase(),
          name: cryptoData.name,
          type: "crypto",
          id: cryptoData.id,
        };
      });

      return cryptoCurrencies;
    } catch (error) {
      console.error("Error cargando criptomonedas:", error);
      // Usar datos de respaldo cargados desde archivo JSON
      this.fallbackCryptoCurrencies.forEach((cryptoCurrency) => {
        this.cryptoIdMap.set(cryptoCurrency.code, cryptoCurrency.id);
      });

      return this.fallbackCryptoCurrencies;
    }
  }

  showCurrencyLoading() {
    const fromInput = document.getElementById("from-currency");
    const toInput = document.getElementById("to-currency");

    fromInput.placeholder = "Cargando monedas...";
    toInput.placeholder = "Cargando monedas...";
    fromInput.disabled = true;
    toInput.disabled = true;
  }

  populateSelects(currencies) {
    // Ahora configuramos los inputs de autocompletado en lugar de selects
    const fromInput = document.getElementById("from-currency");
    const toInput = document.getElementById("to-currency");

    if (!fromInput || !toInput) {
      console.error("No se encontraron los inputs de moneda");
      return;
    }

    // Habilitar los inputs
    fromInput.disabled = false;
    toInput.disabled = false;

    // Actualizar placeholders
    fromInput.placeholder = "Escribe para buscar moneda...";
    toInput.placeholder = "Escribe para buscar moneda...";

    // Las monedas ya están disponibles en this.allCurrencies para el autocompletado
  }

  setupAutocomplete(input, listId) {
    const list = document.getElementById(listId);
    if (!list) {
      console.error("No se encontró la lista:", listId);
      return;
    }

    let selectedIndex = -1;

    input.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      // Si el usuario está escribiendo, limpiar la selección anterior
      if (input.dataset.selectedCode) {
        const selectedText = input.value;
        const expectedText = `${input.dataset.selectedCode} - `;

        // Si no coincide con el formato esperado, limpiar selección
        if (
          !selectedText.startsWith(
            expectedText.substring(0, selectedText.length)
          )
        ) {
          this.clearSelection(input);
        }
      }

      this.showAutocompleteResults(query, list, input);
      selectedIndex = -1;
    });

    input.addEventListener("focus", (e) => {
      const query = e.target.value.toLowerCase().trim();

      // Si ya hay una moneda seleccionada (tiene selectedCode), mostrar populares
      if (input.dataset.selectedCode) {
        this.showPopularCurrencies(list, input);
      } else if (query.length === 0) {
        this.showPopularCurrencies(list, input);
      } else {
        // Solo buscar si no parece ser una selección completa de moneda
        const seemsLikeSelectedCurrency =
          query.includes(" - ") && query.length > 10;
        if (seemsLikeSelectedCurrency) {
          this.showPopularCurrencies(list, input);
        } else {
          this.showAutocompleteResults(query, list, input);
        }
      }
    });

    input.addEventListener("keydown", (e) => {
      const items = list.querySelectorAll(".autocomplete-item");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        this.updateSelection(items, selectedIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        this.updateSelection(items, selectedIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          this.selectCurrency(items[selectedIndex], input, list);
        }
      } else if (e.key === "Escape") {
        list.classList.remove("show");
        selectedIndex = -1;
      }
    });

    // Detectar cuando el usuario selecciona todo para cambiar la moneda
    input.addEventListener("select", (e) => {
      const selectedText = input.value.substring(
        input.selectionStart,
        input.selectionEnd
      );
      const fullText = input.value;

      // Si seleccionó todo el texto y hay una moneda seleccionada, preparar para cambio
      if (
        selectedText === fullText &&
        input.dataset.selectedCode &&
        fullText.length > 0
      ) {
        setTimeout(() => {
          if (input === document.activeElement) {
            this.showPopularCurrencies(list, input);
          }
        }, 10);
      }
    });
  }

  showAutocompleteResults(query, list, input) {
    list.innerHTML = "";

    if (query.length === 0) {
      // No mostrar resultados cuando está vacío, solo al hacer focus
      list.classList.remove("show");
      return;
    }

    // Verificar que tenemos monedas cargadas
    if (!this.allCurrencies || this.allCurrencies.length === 0) {
      console.warn("No hay monedas cargadas aún");
      list.classList.remove("show");
      return;
    }

    // Filtrar monedas según la búsqueda - solo si el query tiene al menos 1 carácter
    if (query.length >= 1) {
      const filtered = this.allCurrencies.filter(
        (currency) =>
          currency.code.toLowerCase().includes(query.toLowerCase()) ||
          currency.name.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length > 0) {
        this.renderCurrencyGroups(list, filtered, input);
        list.classList.add("show");
      } else {
        // Solo mostrar "no encontrado" si se buscó algo específico (al menos 2 caracteres)
        if (query.length >= 2) {
          const noResults = document.createElement("div");
          noResults.className = "no-results";
          noResults.textContent = `No se encontraron monedas que contengan "${query}"`;
          list.appendChild(noResults);
          list.classList.add("show");
        } else {
          list.classList.remove("show");
        }
      }
    } else {
      list.classList.remove("show");
    }
  }

  showPopularCurrencies(list, input) {
    list.innerHTML = "";

    // Verificar que tenemos monedas cargadas
    if (!this.allCurrencies || this.allCurrencies.length === 0) {
      console.warn("Monedas aún no cargadas, no se pueden mostrar populares");
      list.classList.remove("show");
      return;
    }

    const popularCurrencies = this.popularCurrencyCodes
      .map((code) =>
        this.allCurrencies.find((currency) => currency.code === code)
      )
      .filter((currency) => currency); // Filtrar monedas no encontradas

    if (popularCurrencies.length > 0) {
      const header = document.createElement("div");
      header.className = "autocomplete-group-header";
      header.textContent = "💫 Monedas Populares";
      list.appendChild(header);

      popularCurrencies.forEach((currency) => {
        const item = this.createAutocompleteItem(currency, input, list);
        list.appendChild(item);
      });

      list.classList.add("show");
    } else {
      list.classList.remove("show");
    }
  }

  renderCurrencyGroups(list, currencies, input) {
    const fiatCurrencies = currencies.filter((c) => c.type === "fiat");
    const cryptoCurrencies = currencies.filter((c) => c.type === "crypto");

    let totalShown = 0;
    const maxTotal = 30; // Máximo total de resultados

    // Agregar monedas fiduciarias
    if (fiatCurrencies.length > 0 && totalShown < maxTotal) {
      const fiatHeader = document.createElement("div");
      fiatHeader.className = "autocomplete-group-header";
      fiatHeader.textContent = "💰 Monedas Fiduciarias";
      list.appendChild(fiatHeader);

      const fiatToShow = Math.min(
        fiatCurrencies.length,
        maxTotal - totalShown,
        15
      );
      fiatCurrencies.slice(0, fiatToShow).forEach((currency) => {
        const item = this.createAutocompleteItem(currency, input, list);
        list.appendChild(item);
        totalShown++;
      });
    }

    // Agregar criptomonedas
    if (cryptoCurrencies.length > 0 && totalShown < maxTotal) {
      const cryptoHeader = document.createElement("div");
      cryptoHeader.className = "autocomplete-group-header";
      cryptoHeader.textContent = "₿ Criptomonedas";
      list.appendChild(cryptoHeader);

      const cryptoToShow = Math.min(
        cryptoCurrencies.length,
        maxTotal - totalShown
      );
      cryptoCurrencies.slice(0, cryptoToShow).forEach((currency) => {
        const item = this.createAutocompleteItem(currency, input, list);
        list.appendChild(item);
        totalShown++;
      });
    }
  }

  createAutocompleteItem(currency, input, list) {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.dataset.code = currency.code;
    item.dataset.type = currency.type;
    if (currency.id) item.dataset.id = currency.id;

    item.innerHTML = `
      <span class="currency-code">${currency.code}</span>
      <span class="currency-name">${currency.name}</span>
    `;

    item.addEventListener("click", () => {
      this.selectCurrency(item, input, list);
    });

    return item;
  }

  selectCurrency(item, input, list) {
    const code = item.dataset.code;
    const name = item.querySelector(".currency-name").textContent;

    input.value = `${code} - ${name}`;
    input.dataset.selectedCode = code;
    input.dataset.selectedType = item.dataset.type;
    if (item.dataset.id) input.dataset.selectedId = item.dataset.id;

    list.classList.remove("show");
  }

  clearSelection(input) {
    delete input.dataset.selectedCode;
    delete input.dataset.selectedType;
    delete input.dataset.selectedId;
  }

  updateSelection(items, selectedIndex) {
    items.forEach((item, index) => {
      item.classList.toggle("active", index === selectedIndex);
    });

    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }

  hideAllAutocompleteLists() {
    document.querySelectorAll(".autocomplete-list").forEach((list) => {
      list.classList.remove("show");
    });
  }

  /**
   * Realiza la conversión entre las monedas seleccionadas
   * Valida datos de entrada y maneja diferentes tipos de conversión
   */
  async convertCurrency() {
    const fromCurrencyInput = document.getElementById("from-currency");
    const toCurrencyInput = document.getElementById("to-currency");
    const amount = parseFloat(document.getElementById("amount").value);

    // Obtener códigos de las monedas seleccionadas desde los atributos data
    const fromCurrencyCode = fromCurrencyInput.dataset.selectedCode;
    const toCurrencyCode = toCurrencyInput.dataset.selectedCode;

    // Validaciones de entrada
    if (!fromCurrencyCode || !toCurrencyCode) {
      this.showError("Por favor selecciona ambas monedas de la lista");
      return;
    }

    if (!amount || amount <= 0) {
      this.showError("Por favor ingresa un monto válido");
      return;
    }

    // Prevenir conversión de una moneda a sí misma
    if (fromCurrencyCode === toCurrencyCode) {
      this.showError(
        "⚠️ No puedes convertir una moneda a sí misma. Por favor selecciona monedas diferentes."
      );
      return;
    }

    try {
      this.showLoadingIndicator();

      const fromCurrencyType = fromCurrencyInput.dataset.selectedType;
      const toCurrencyType = toCurrencyInput.dataset.selectedType;

      let exchangeRate;

      // Determinar tipo de conversión y obtener tasa de cambio apropiada
      if (fromCurrencyType === "fiat" && toCurrencyType === "fiat") {
        exchangeRate = await this.getFiatToFiatExchangeRate(
          fromCurrencyCode,
          toCurrencyCode
        );
      } else if (fromCurrencyType === "crypto" && toCurrencyType === "crypto") {
        exchangeRate = await this.getCryptoToCryptoExchangeRate(
          fromCurrencyCode,
          toCurrencyCode
        );
      } else if (fromCurrencyType === "fiat" && toCurrencyType === "crypto") {
        exchangeRate = await this.getFiatToCryptoExchangeRate(
          fromCurrencyCode,
          toCurrencyCode
        );
      } else {
        exchangeRate = await this.getCryptoToFiatExchangeRate(
          fromCurrencyCode,
          toCurrencyCode
        );
      }

      const convertedAmount = amount * exchangeRate;
      this.displayConversionResult(
        amount,
        fromCurrencyCode,
        convertedAmount,
        toCurrencyCode,
        exchangeRate
      );
    } catch (error) {
      // Cerrar indicador de carga antes de mostrar error
      if (typeof Swal !== "undefined") {
        Swal.close();
      }
      console.error("Error en conversión:", error);
      this.showError("Error al obtener la cotización. Intenta nuevamente.");
    }
  }

  /**
   * Obtiene la tasa de cambio entre dos monedas fiduciarias
   * @param {string} fromCurrency - Código de moneda origen
   * @param {string} toCurrency - Código de moneda destino
   * @returns {Promise<number>} Tasa de cambio
   */
  async getFiatToFiatExchangeRate(fromCurrency, toCurrency) {
    const response = await fetch(`${this.exchangeRateAPI}${fromCurrency}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Error al obtener cotización de monedas");
    }

    return data.rates[toCurrency];
  }

  /**
   * Obtiene la tasa de cambio entre dos criptomonedas
   * @param {string} fromCrypto - Código de criptomoneda origen
   * @param {string} toCrypto - Código de criptomoneda destino
   * @returns {Promise<number>} Tasa de cambio
   */
  async getCryptoToCryptoExchangeRate(fromCrypto, toCrypto) {
    const fromCurrencyInput = document.getElementById("from-currency");
    const toCurrencyInput = document.getElementById("to-currency");

    const fromCryptoId =
      fromCurrencyInput.dataset.selectedId || this.getCryptoId(fromCrypto);
    const toCryptoId =
      toCurrencyInput.dataset.selectedId || this.getCryptoId(toCrypto);

    const response = await fetch(
      `${this.coinGeckoAPI}?ids=${fromCryptoId},${toCryptoId}&vs_currencies=usd`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Error al obtener cotización de criptomonedas");
    }

    const fromPriceInUsd = data[fromCryptoId].usd;
    const toPriceInUsd = data[toCryptoId].usd;

    return fromPriceInUsd / toPriceInUsd;
  }

  /**
   * Obtiene la tasa de cambio de moneda fiduciaria a criptomoneda
   * @param {string} fromFiat - Código de moneda fiduciaria
   * @param {string} toCrypto - Código de criptomoneda
   * @returns {Promise<number>} Tasa de cambio
   */
  async getFiatToCryptoExchangeRate(fromFiat, toCrypto) {
    const toCurrencyInput = document.getElementById("to-currency");
    const cryptoId =
      toCurrencyInput.dataset.selectedId || this.getCryptoId(toCrypto);

    // Obtener precio de la criptomoneda en USD
    const cryptoResponse = await fetch(
      `${this.coinGeckoAPI}?ids=${cryptoId}&vs_currencies=usd`
    );
    const cryptoData = await cryptoResponse.json();

    if (fromFiat === "USD") {
      return 1 / cryptoData[cryptoId].usd;
    }

    // Obtener tasa de cambio de la moneda fiduciaria a USD
    const fiatResponse = await fetch(`${this.exchangeRateAPI}${fromFiat}`);
    const fiatData = await fiatResponse.json();

    const usdExchangeRate = fiatData.rates.USD;
    const cryptoPriceInUsd = cryptoData[cryptoId].usd;

    return usdExchangeRate / cryptoPriceInUsd;
  }

  /**
   * Obtiene la tasa de cambio de criptomoneda a moneda fiduciaria
   * @param {string} fromCrypto - Código de criptomoneda
   * @param {string} toFiat - Código de moneda fiduciaria
   * @returns {Promise<number>} Tasa de cambio
   */
  async getCryptoToFiatExchangeRate(fromCrypto, toFiat) {
    const fromCurrencyInput = document.getElementById("from-currency");
    const cryptoId =
      fromCurrencyInput.dataset.selectedId || this.getCryptoId(fromCrypto);

    // Obtener precio de la criptomoneda en USD
    const cryptoResponse = await fetch(
      `${this.coinGeckoAPI}?ids=${cryptoId}&vs_currencies=usd`
    );
    const cryptoData = await cryptoResponse.json();

    const cryptoPriceInUsd = cryptoData[cryptoId].usd;

    if (toFiat === "USD") {
      return cryptoPriceInUsd;
    }

    // Obtener tasa de cambio de USD a la moneda fiduciaria destino
    const fiatResponse = await fetch(`${this.exchangeRateAPI}USD`);
    const fiatData = await fiatResponse.json();

    return cryptoPriceInUsd * fiatData.rates[toFiat];
  }

  /**
   * Muestra indicador de carga durante la conversión
   */
  showLoadingIndicator() {
    const convertButton = document.getElementById("convert-btn");
    convertButton.disabled = true;

    // Usar SweetAlert2 si está disponible para una mejor experiencia
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Obteniendo cotización...",
        text: "Por favor espera un momento",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      // Sistema de respaldo si SweetAlert2 no está disponible
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML =
        '<div class="loading-spinner"></div>Obteniendo cotización...';
      resultDiv.className = "result-section loading";
    }
  }

  /**
   * Muestra el resultado de la conversión con información detallada
   * @param {number} originalAmount - Cantidad original
   * @param {string} fromCurrency - Moneda origen
   * @param {number} convertedAmount - Cantidad convertida
   * @param {string} toCurrency - Moneda destino
   * @param {number} exchangeRate - Tasa de cambio utilizada
   */
  displayConversionResult(
    originalAmount,
    fromCurrency,
    convertedAmount,
    toCurrency,
    exchangeRate
  ) {
    // Cerrar indicador de carga
    if (typeof Swal !== "undefined") {
      Swal.close();
    }

    const resultDiv = document.getElementById("result");
    const convertButton = document.getElementById("convert-btn");

    const formattedOriginalAmount = this.formatNumber(originalAmount);
    const formattedConvertedAmount = this.formatNumber(convertedAmount);
    const formattedExchangeRate = this.formatNumber(exchangeRate, 6);

    // Determinar las fuentes de datos utilizadas
    const dataSources = this.getDataSourcesDescription(
      fromCurrency,
      toCurrency
    );

    resultDiv.innerHTML = `
            <div class="conversion-result">
                <div class="main-result">
                    <strong>${formattedOriginalAmount} ${fromCurrency} = ${formattedConvertedAmount} ${toCurrency}</strong>
                </div>
                <div class="exchange-rate">
                    1 ${fromCurrency} = ${formattedExchangeRate} ${toCurrency}
                </div>
                <div class="data-sources">
                    <small>📊 ${dataSources}</small>
                </div>
            </div>
        `;

    resultDiv.className = "result-section show-result";
    convertButton.disabled = false;

    // Mostrar notificación de éxito discreta
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Conversión realizada con éxito",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        customClass: {
          popup: "swal-custom",
        },
      });
    }

    // Mostrar gráfico de tendencias de precios
    this.displayPriceChart(fromCurrency, toCurrency);

    // Scroll suave hacia el resultado para mejor UX
    setTimeout(() => {
      resultDiv.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);
  }

  /**
   * Genera descripción de las fuentes de datos utilizadas en la conversión
   * @param {string} fromCurrency - Moneda origen
   * @param {string} toCurrency - Moneda destino
   * @returns {string} Descripción formateada de las fuentes
   */
  getDataSourcesDescription(fromCurrency, toCurrency) {
    // Obtener tipos de moneda desde los elementos DOM
    const fromCurrencyInput = document.getElementById("from-currency");
    const toCurrencyInput = document.getElementById("to-currency");

    const fromCurrencyType = fromCurrencyInput.dataset.selectedType || "fiat";
    const toCurrencyType = toCurrencyInput.dataset.selectedType || "fiat";

    let apiSources = [];

    // Determinar qué APIs fueron utilizadas
    if (fromCurrencyType === "crypto" || toCurrencyType === "crypto") {
      apiSources.push(
        '<a href="https://www.coingecko.com" target="_blank" rel="noopener">CoinGecko API</a>'
      );
    }

    if (fromCurrencyType === "fiat" || toCurrencyType === "fiat") {
      apiSources.push(
        '<a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>'
      );
    }

    // Formatear descripción según el número de fuentes
    if (apiSources.length === 1) {
      return `Datos proporcionados por ${apiSources[0]}`;
    } else if (apiSources.length === 2) {
      return `Datos proporcionados por ${apiSources[0]} y ${apiSources[1]}`;
    } else {
      return "Datos de fuentes financieras confiables";
    }
  }

  showError(message) {
    const convertBtn = document.getElementById("convert-btn");
    convertBtn.disabled = false;

    // Usar SweetAlert2 si está disponible, sino usar método original
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#667eea",
        customClass: {
          popup: "swal-custom",
        },
      });
    } else {
      // Fallback al método original si SweetAlert2 no está disponible
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = `<span style="color: #dc3545;">❌ ${message}</span>`;
      resultDiv.className = "result-section";
    }
  }

  formatNumber(num, decimals = 2) {
    if (num >= 1) {
      return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } else {
      // Para números muy pequeños, mostrar más decimales
      return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(num);
    }
  }

  /**
   * Muestra gráfico de tendencias de precios para el par de monedas
   * @param {string} fromCurrency - Moneda origen
   * @param {string} toCurrency - Moneda destino
   */
  async displayPriceChart(fromCurrency, toCurrency) {
    const chartContainer = document.getElementById("chart-container");
    const chartCanvas = document.getElementById("price-chart");

    try {
      // Mostrar contenedor de gráfico
      chartContainer.style.display = "block";

      // Mostrar indicador de carga
      this.showChartLoadingIndicator();

      // Obtener tipos de moneda desde elementos DOM
      const fromCurrencyInput = document.getElementById("from-currency");
      const toCurrencyInput = document.getElementById("to-currency");

      const fromCurrencyType = fromCurrencyInput.dataset.selectedType || "fiat";
      const toCurrencyType = toCurrencyInput.dataset.selectedType || "fiat";

      let historicalData;
      let chartTitle = `${fromCurrency} → ${toCurrency}`;

      // Obtener datos históricos según el tipo de monedas
      if (fromCurrencyType === "crypto") {
        historicalData = await this.getCryptocurrencyHistoricalData(
          fromCurrency,
          toCurrency
        );
      } else if (toCurrencyType === "crypto") {
        historicalData = await this.getCryptocurrencyHistoricalData(
          toCurrency,
          fromCurrency,
          true
        );
      } else {
        historicalData = await this.getFiatCurrencyHistoricalData(
          fromCurrency,
          toCurrency
        );
      }

      // Actualizar título del gráfico
      const titleElement = chartContainer.querySelector("h3");
      titleElement.textContent = `📈 Tendencia: ${chartTitle} (últimos 30 días)`;

      // Ocultar indicador de carga y mostrar gráfico
      this.hideChartLoadingIndicator();

      // Crear o actualizar instancia del gráfico
      this.createPriceChart(chartCanvas, historicalData, chartTitle);
    } catch (error) {
      console.error("Error al cargar gráfico:", error);
      this.hideChartLoadingIndicator();
      this.showChartError("No se pudieron cargar los datos históricos");
    }
  }

  /**
   * Obtiene datos históricos de criptomonedas desde CoinGecko
   * @param {string} cryptoCurrency - Código de la criptomoneda
   * @param {string} targetCurrency - Moneda de referencia
   * @param {boolean} isInverse - Si debe invertir los precios
   * @returns {Promise<Object>} Datos formateados para el gráfico
   */
  async getCryptocurrencyHistoricalData(
    cryptoCurrency,
    targetCurrency,
    isInverse = false
  ) {
    try {
      const cryptoId = this.getCryptoId(cryptoCurrency);

      if (!cryptoId) {
        throw new Error(
          `ID de criptomoneda no encontrado para ${cryptoCurrency}`
        );
      }

      // Obtener datos históricos de los últimos 30 días
      const apiUrl = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=30&interval=daily`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status} al obtener datos históricos`
        );
      }

      const historicalData = await response.json();

      if (!historicalData.prices || !Array.isArray(historicalData.prices)) {
        throw new Error("Formato de datos inválido de CoinGecko");
      }

      const priceData = historicalData.prices;

      // Aplicar inversión si es necesario
      let processedPrices = priceData;
      if (isInverse) {
        processedPrices = priceData.map((pricePoint) => [
          pricePoint[0],
          1 / pricePoint[1],
        ]);
      }

      return {
        labels: processedPrices.map((pricePoint) => {
          const date = new Date(pricePoint[0]);
          return date.toLocaleDateString("es-ES", {
            month: "short",
            day: "numeric",
          });
        }),
        data: processedPrices.map((pricePoint) => pricePoint[1]),
      };
    } catch (error) {
      console.error("Error en getCryptocurrencyHistoricalData:", error);
      throw error;
    }
  }

  /**
   * Obtiene datos históricos simulados para monedas fiduciarias
   * @param {string} fromCurrency - Moneda origen
   * @param {string} toCurrency - Moneda destino
   * @returns {Promise<Object>} Datos simulados para el gráfico
   */
  async getFiatCurrencyHistoricalData(fromCurrency, toCurrency) {
    try {
      // Obtener tasa actual como base para simulación
      const currentExchangeRate = await this.getFiatToFiatExchangeRate(
        fromCurrency,
        toCurrency
      );

      // Generar datos simulados con variaciones realistas (±2%)
      const chartData = [];
      const dateLabels = [];

      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        dateLabels.push(
          date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
        );

        // Aplicar variación aleatoria pequeña para simular fluctuaciones
        const randomVariation = (Math.random() - 0.5) * 0.04; // ±2%
        chartData.push(currentExchangeRate * (1 + randomVariation));
      }

      return { labels: dateLabels, data: chartData };
    } catch (error) {
      console.error("Error en getFiatCurrencyHistoricalData:", error);
      // Datos de respaldo en caso de error
      return this.generateFallbackChartData();
    }
  }

  /**
   * Genera datos de respaldo para el gráfico en caso de error
   * @returns {Object} Datos básicos para mantener funcionalidad del gráfico
   */
  generateFallbackChartData() {
    const dateLabels = [];
    const priceData = [];

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      dateLabels.push(
        date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
      );
      priceData.push(1 + (Math.random() - 0.5) * 0.02); // Variación mínima del ±1%
    }

    return { labels: dateLabels, data: priceData };
  }

  /**
   * Crea o actualiza la instancia del gráfico de precios
   * @param {HTMLCanvasElement} canvasElement - Elemento canvas del gráfico
   * @param {Object} chartData - Datos para mostrar en el gráfico
   * @param {string} chartTitle - Título del gráfico
   */
  createPriceChart(canvasElement, chartData, chartTitle) {
    const chartContext = canvasElement.getContext("2d");

    // Destruir gráfico anterior si existe para evitar conflictos
    if (this.priceChart) {
      this.priceChart.destroy();
    }

    this.priceChart = new Chart(chartContext, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Precio",
            data: chartData.data,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#667eea",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function (tooltipContext) {
                return tooltipContext[0].label;
              },
              label: function (tooltipContext) {
                return `Precio: ${tooltipContext.parsed.y.toFixed(6)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              color: "#6c757d",
              font: {
                size: 11,
              },
            },
          },
          y: {
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              color: "#6c757d",
              font: {
                size: 11,
              },
              callback: function (value) {
                return value.toFixed(6);
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });
  }

  /**
   * Muestra indicador de carga para el gráfico
   */
  showChartLoadingIndicator() {
    const chartContainer = document.getElementById("chart-container");
    const chartCanvas = document.getElementById("price-chart");
    chartCanvas.style.display = "none";

    let loadingElement = chartContainer.querySelector(".chart-loading");
    if (!loadingElement) {
      loadingElement = document.createElement("div");
      loadingElement.className = "chart-loading";
      chartContainer.appendChild(loadingElement);
    }

    loadingElement.innerHTML = "📊 Cargando datos históricos...";
    loadingElement.style.display = "block";
  }

  /**
   * Oculta indicador de carga y muestra el gráfico
   */
  hideChartLoadingIndicator() {
    const chartContainer = document.getElementById("chart-container");
    const chartCanvas = document.getElementById("price-chart");
    const loadingElement = chartContainer.querySelector(".chart-loading");

    if (loadingElement) {
      loadingElement.style.display = "none";
    }
    chartCanvas.style.display = "block";
  }

  /**
   * Muestra mensaje de error en el gráfico
   * @param {string} errorMessage - Mensaje de error a mostrar
   */
  showChartError(errorMessage) {
    const chartContainer = document.getElementById("chart-container");
    const chartCanvas = document.getElementById("price-chart");
    const loadingElement = chartContainer.querySelector(".chart-loading");

    chartCanvas.style.display = "none";
    if (loadingElement) loadingElement.style.display = "none";

    let errorElement = chartContainer.querySelector(".chart-error");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "chart-error";
      chartContainer.appendChild(errorElement);
    }

    errorElement.innerHTML = `❌ ${errorMessage}`;
    errorElement.style.display = "block";
  }

  /**
   * Obtiene el ID de CoinGecko para una criptomoneda específica
   * @param {string} currencyCode - Código de la criptomoneda (ej: BTC, ETH)
   * @returns {string|undefined} ID de CoinGecko o undefined si no se encuentra
   */
  getCryptoId(currencyCode) {
    return this.cryptoIdMap.get(currencyCode.toUpperCase());
  }
}

/**
 * Inicialización de la aplicación
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener("DOMContentLoaded", () => {
  new CurrencyConverter();
});
