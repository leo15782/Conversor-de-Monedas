# 💱 Conversor de Monedas y Criptomonedas

Una aplicación web moderna y elegante para la conversión en tiempo real entre monedas fiduciarias y criptomonedas, con gráficos interactivos y autocompletado inteligente.

![Currency Converter](https://img.shields.io/badge/Currency-Converter-blue?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-Modern-blue?style=for-the-badge&logo=css3)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-orange?style=for-the-badge&logo=html5)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-green?style=for-the-badge&logo=github)

## 🌟 Características Principales

- 💰 **Conversión de Monedas Fiduciarias**: Soporte para más de 160 monedas mundiales
- ₿ **Conversión de Criptomonedas**: Top 100 criptomonedas por capitalización de mercado
- 📈 **Gráficos Interactivos**: Tendencias de precios de los últimos 30 días
- 🔍 **Autocompletado Inteligente**: Búsqueda rápida con sugerencias populares
- 📊 **Datos en Tiempo Real**: APIs actualizadas de ExchangeRate-API y CoinGecko
- 🎨 **Diseño Moderno**: Interfaz elegante con efectos glassmorphism
- 📱 **Totalmente Responsivo**: Optimizado para todos los dispositivos
- ⚡ **Rendimiento Optimizado**: Carga asíncrona y sin código innecesario

## 🚀 Demo en Vivo

🔗 **[Ver Aplicación](https://leo15782.github.io/Conversor-de-Monedas)**

## 📸 Capturas de Pantalla

### Interfaz Principal

![Main Interface](docs/images/main-interface.png)

### Autocompletado

![Autocomplete](docs/images/autocomplete.png)

### Gráficos de Tendencias

![Charts](docs/images/price-charts.png)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Librerías**:
  - [Chart.js](https://www.chartjs.org/) - Gráficos interactivos
  - [SweetAlert2](https://sweetalert2.github.io/) - Modales elegantes
- **APIs**:
  - [ExchangeRate-API](https://www.exchangerate-api.com/) - Monedas fiduciarias
  - [CoinGecko API](https://www.coingecko.com/api) - Criptomonedas
- **Diseño**: CSS Grid, Flexbox, Glassmorphism
- **Arquitectura**: Modular, Orientada a Objetos

## ⚡ Instalación y Uso

### Opción 1: Clonar Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/leo15782/Conversor-de-Monedas.git

# Navegar al directorio
cd conversor-monedas

# Abrir con un servidor local
python -m http.server 3000
# O usar Live Server en VS Code
```

### Opción 2: Descargar ZIP

1. Descargar el archivo ZIP del repositorio
2. Extraer en tu directorio preferido
3. Abrir `index.html` en tu navegador

## 📁 Estructura del Proyecto

```
conversor-monedas/
├── index.html              # Página principal
├── script.js               # Lógica de la aplicación
├── style.css               # Estilos y animaciones
├── data/                   # Datos estáticos
│   ├── currency-names.json     # Nombres de monedas
│   ├── popular-currencies.json # Monedas populares
│   └── fallback-cryptos.json   # Criptomonedas de respaldo
├── docs/                   # Documentación
│   └── images/             # Capturas de pantalla
├── README.md               # Este archivo
└── LICENSE                 # Licencia MIT
```

## 🔧 Funcionalidades Técnicas

### Conversión de Monedas

- **Fiat a Fiat**: USD, EUR, ARS, y más de 160 monedas
- **Crypto a Crypto**: Bitcoin, Ethereum, y top 100 criptomonedas
- **Fiat a Crypto**: Conversión cruzada entre tipos
- **Crypto a Fiat**: Valores en tiempo real

### Sistema de Autocompletado

- Búsqueda inteligente por código o nombre
- Sugerencias de monedas populares
- Navegación por teclado (flechas, Enter, Escape)
- Agrupación por tipo de moneda

### Gráficos de Tendencias

- Datos históricos de 30 días
- Gráficos interactivos con Chart.js
- Soporte para criptomonedas (datos reales)
- Simulación para monedas fiduciarias

## 🎨 Características de Diseño

- **Glassmorphism**: Efectos de vidrio modernos
- **Gradientes**: Colores vibrantes y suaves
- **Animaciones**: Transiciones fluidas
- **Tipografía**: Segoe UI para máxima legibilidad
- **Responsivo**: Mobile-first approach

## 📊 APIs Utilizadas

### ExchangeRate-API

- **URL**: `https://api.exchangerate-api.com/v4/latest/`
- **Uso**: Tasas de cambio de monedas fiduciarias
- **Gratuita**: Sin API key requerida
- **Límite**: 1500 requests/mes

### CoinGecko API

- **URL**: `https://api.coingecko.com/api/v3/`
- **Uso**: Precios y datos de criptomonedas
- **Gratuita**: Sin API key requerida
- **Límite**: 10-50 calls/minute

## 🔒 Seguridad y Privacidad

- ✅ **Sin API Keys**: No requiere claves de API
- ✅ **Sin Backend**: Funciona completamente en el cliente
- ✅ **HTTPS Ready**: Compatible con sitios seguros
- ✅ **Sin Datos Personales**: No recopila información del usuario

## 🚀 Optimizaciones de Rendimiento

- **Carga Asíncrona**: Datos estáticos desde JSON
- **Lazy Loading**: Gráficos solo cuando se necesitan
- **Caching**: Mapeo de IDs de criptomonedas
- **Debouncing**: Búsqueda optimizada
- **Tree Shaking**: Código sin elementos no utilizados

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📋 Roadmap

- [ ] 🌍 Soporte multiidioma (i18n)
- [ ] 📱 Aplicación PWA
- [ ] 🔔 Notificaciones de alertas de precio
- [ ] 📈 Más tipos de gráficos (velas, barras)
- [ ] 💾 Historial de conversiones
- [ ] ⭐ Monedas favoritas
- [ ] 🎯 Calculadora de inversiones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Leonardo Espinel**

- 🌐 **Empresa**: LE Desarrollo y Soluciones
- 📧 **Email**: [tu-email@example.com](mailto:tu-email@example.com)
- 💼 **LinkedIn**: [tu-linkedin](https://linkedin.com/in/tu-perfil)
- 🐙 **GitHub**: [tu-github](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [ExchangeRate-API](https://www.exchangerate-api.com/) por proporcionar datos gratuitos de monedas
- [CoinGecko](https://www.coingecko.com/) por la API de criptomonedas
- [Chart.js](https://www.chartjs.org/) por los gráficos interactivos
- [SweetAlert2](https://sweetalert2.github.io/) por los modales elegantes

---

⭐ Si este proyecto te fue útil, ¡no olvides darle una estrella!

![GitHub stars](https://img.shields.io/github/stars/leo15782/Conversor-de-Monedas?style=social)
![GitHub forks](https://img.shields.io/github/forks/leo15782/Conversor-de-Monedas?style=social)
