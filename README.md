# TimeLeftCalendar

## Español

Una aplicación de calendario que visualiza el tiempo restante para fechas límite, eventos y metas.

![image](https://github.com/user-attachments/assets/46552c0f-4198-40d1-8d9b-28e373fdf61b)

### Descripción General

TimeLeftCalendar es una herramienta de gestión del tiempo que muestra visualmente cuánto tiempo queda hasta fechas importantes. La aplicación presenta el tiempo restante en diferentes formatos visuales para ayudar en la planificación y seguimiento de plazos.

### Características

- **Representación Visual del Tiempo**: Visualiza tu tiempo restante en formatos intuitivos
- **Múltiples Escalas de Tiempo**: Visualiza el tiempo restante en días, semanas, meses o años
- **Eventos Personalizados**: Añade fechas límite personales, metas e hitos
- **Sistema de Recordatorios**: Recibe notificaciones cuando se acerquen las fechas límite
- **Seguimiento de Progreso**: Monitorea el porcentaje de finalización de proyectos en curso
- **Vistas Personalizables**: Personaliza la forma en que se muestra tu tiempo
- **Exportación de Datos**: Exporta los datos de tu calendario en varios formatos
- **Multiplataforma**: Accede a tu calendario desde cualquier dispositivo

### Instalación

#### Requisitos Previos

- Node.js (v16.0 o superior)
- Gestor de paquetes npm o yarn

#### Configuración

```bash
# Clonar el repositorio
git clone https://github.com/Sergio-D-Vico-Pineda/TimeLeftCalendar.git

# Navegar al directorio del proyecto
cd TimeLeftCalendar

# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
```

### Uso

1. **Añadir Eventos**: Haz clic en el botón "+" para añadir nuevas fechas límite o hitos
2. **Configurar Visualización**: Elige cómo quieres visualizar el tiempo (bloques, barras de progreso, etc.)
3. **Establecer Recordatorios**: Configura cuándo y cómo quieres ser notificado
4. **Seguir Progreso**: Actualiza el estado de finalización para tus proyectos en curso

### Configuración

TimeLeftCalendar puede configurarse a través del archivo `config.json` o mediante el panel de Configuración en la aplicación:

```json
{
  "defaultView": "month",
  "reminderTiming": [1, 7, 30],
  "colorScheme": "default",
  "startOfWeek": "monday",
  "showCompleted": true
}
```

### Personalización

La aplicación admite varios temas y estilos de visualización:

- **Temas**: Claro, Oscuro, Modo Enfoque
- **Visualizaciones**: Bloque, Barra de Progreso, Cuenta Regresiva, Línea de Tiempo

### Contribuir

¡Las contribuciones son bienvenidas! No dudes en enviar una Pull Request.

1. Haz un fork del repositorio
2. Crea tu rama de funcionalidad (`git checkout -b feature/funcion-increible`)
3. Haz commit de tus cambios (`git commit -m 'Añadir alguna función increíble'`)
4. Haz push a la rama (`git push origin feature/funcion-increible`)
5. Abre una Pull Request

### Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

### Agradecimientos

- Inspirado en conceptos de metodologías de gestión del tiempo
- Iconos proporcionados por [FontAwesome](https://fontawesome.com/)
- Un agradecimiento especial a todos los contribuidores

---

## English

A calendar application that visualizes the time remaining until deadlines, events, and goals.

![image](https://github.com/user-attachments/assets/46552c0f-4198-40d1-8d9b-28e373fdf61b)

### Overview

TimeLeftCalendar is a time management tool that visually displays how much time remains until important dates. The application presents remaining time in different visual formats to assist with planning and deadline tracking.

### Features

- **Visual Time Representation**: See your remaining time displayed in intuitive visual formats
- **Multiple Time Scales**: View time left in days, weeks, months, or years
- **Custom Events**: Add personal deadlines, goals, and milestones
- **Reminder System**: Get notifications as deadlines approach
- **Progress Tracking**: Monitor completion percentage of ongoing projects
- **Customizable Views**: Personalize how your time is displayed
- **Data Export**: Export your calendar data in various formats
- **Cross-Platform**: Access your calendar from any device

### Installation

#### Prerequisites

- Node.js (v16.0 or higher)
- npm or yarn package manager

#### Setup

```bash
# Clone the repository
git clone https://github.com/Sergio-D-Vico-Pineda/TimeLeftCalendar.git

# Navigate to the project directory
cd TimeLeftCalendar

# Install dependencies
npm install

# Start the application
npm start
```

### Usage

1. **Add Events**: Click the "+" button to add new deadlines or milestones
2. **Configure Visualization**: Choose how you want to visualize time (blocks, progress bars, etc.)
3. **Set Reminders**: Configure when and how you want to be notified
4. **Track Progress**: Update completion status for your ongoing projects

### Configuration

TimeLeftCalendar can be configured through the `config.json` file or through the Settings panel in the application:

```json
{
  "defaultView": "month",
  "reminderTiming": [1, 7, 30],
  "colorScheme": "default",
  "startOfWeek": "monday",
  "showCompleted": true
}
```

### Customization

The application supports various themes and visualization styles:

- **Themes**: Light, Dark, Focus Mode
- **Visualizations**: Block, Progress Bar, Countdown, Timeline

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgements

- Inspired by concepts from time management methodologies
- Icons provided by [FontAwesome](https://fontawesome.com/)
- Special thanks to all contributors

---

Created by [Sergio D. Vico Pineda](https://github.com/Sergio-D-Vico-Pineda)
