# FinCity

Una aplicación web de productividad inspirada en Forest, pero con temática financiera. Completa sesiones de trabajo tipo Pomodoro para construir tu propio skyline de rascacielos ASCII que generan rentas en tiempo real.

## Concepto

FinCity gamifica la productividad convirtiendo el tiempo de trabajo en una ciudad virtual. Cada sesión completada genera un edificio cuyo tamaño depende de la duración:

| Duración | Tamaño | Renta base |
|----------|--------|------------|
| 15-24 min | S | $0.10/s |
| 25-44 min | M | $0.30/s |
| 45-74 min | L | $0.70/s |
| 75+ min | XL | $1.50/s |

### Tres tipos de trabajo

- **OSIX** - Multiplicador fijo x2.0. Edificios blancos.
- **SHEARN** - Multiplicador creciente (x0.8 → x4.0 en 25 días). Edificios verdes.
- **ESTUDIO** - No genera renta, pero evita el "impuesto académico" (-40% global si no estudias en 48h).

### Sistema de penalizaciones

- **Ciudad dormida**: -90% a todas las rentas si no completas ninguna sesión en 45 minutos. La ciudad entra en modo nocturno con estrellas brillantes, luna ASCII y "zzZ" flotantes sobre los edificios.
- **Impuesto de estudio**: -40% a todas las rentas si no completas una sesión de ESTUDIO en 48 horas.
- **Degradación diaria**: Los edificios se degradan si no cumples el mínimo de trabajo diario.
- **Edificios abandonados**: Dejan de generar renta completamente.

> Las penalizaciones son acumulativas: si la ciudad está dormida Y tienes deuda académica, tu renta efectiva será 25% × 60% = 15% del total.

### Modo Overtime

Al completar el tiempo objetivo, el timer continúa contando tiempo extra con bonus:
- +2% de renta por cada minuto extra (máximo +50%)
- Auto-stop a las 2 horas de overtime
- Opción de guardar solo el tiempo original

## Despliegue

### Requisitos
- Node.js 18+
- npm 9+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/mateobodenlle/FinCity.git
cd FinCity

# Instalar dependencias
npm install

# Desarrollo (cliente + servidor)
npm run dev
```

El cliente estará en `http://localhost:5173` y el servidor en `http://localhost:3001`.

### Producción

```bash
# Build del cliente
npm run build

# Iniciar servidor
npm start
```

## Stack Técnico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.3.1 | UI components |
| TypeScript | 5.6.2 | Type safety |
| Vite | 6.0.5 | Build tool & dev server |
| Zustand | 5.0.2 | State management |
| Axios | 1.7.9 | HTTP client |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Express | 4.21.2 | HTTP server |
| better-sqlite3 | 11.7.0 | SQLite database (sync) |
| TypeScript | 5.6.2 | Type safety |
| tsx | 4.19.2 | TS execution |

### Arquitectura

```
fincity/
├── client/          # React SPA
│   └── src/
│       ├── components/   # Timer, Skyline, Stats, StatusBar
│       ├── stores/       # Zustand stores (game, timer)
│       ├── core/         # Economy logic, types
│       └── ascii/        # Building ASCII art
│
├── server/          # Express API
│   └── src/
│       ├── routes/       # sessions, buildings, stats
│       └── db/           # SQLite schema & queries
│
└── package.json     # Workspaces root
```

### Base de datos

SQLite con better-sqlite3 (operaciones síncronas, sin callbacks). Tablas principales:
- `sessions` - Sesiones Pomodoro completadas
- `buildings` - Edificios generados
- `game_state` - Estado global (dinero, multiplicadores)
- `daily_log` - Registro diario para degradación

### Características técnicas

- **Timer persistente**: Usa timestamps en localStorage, sobrevive a recargas del navegador
- **Web Worker**: El timer funciona incluso con la pestaña en segundo plano
- **Notificaciones**: Alerta del sistema cuando el timer completa en background
- **Rentas en tiempo real**: Actualización cada 100ms del dinero acumulado
- **Skyline con profundidad**: 3 capas de edificios con efecto parallax ASCII
