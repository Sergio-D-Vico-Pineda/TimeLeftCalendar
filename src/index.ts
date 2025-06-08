const app = document.querySelector('div#app') as HTMLDivElement;

if (!app) {
    throw new Error('App element not found');
}

class Calendar {
    private currentDate: Date;
    private calendarElement: HTMLDivElement;
    private selectedDate: Date | null = null;

    constructor(container: HTMLElement) {
        this.currentDate = new Date();
        this.calendarElement = document.createElement('div');
        this.calendarElement.className = 'calendar';
        container.appendChild(this.calendarElement);
        this.render();
    }

    private render(): void {
        this.calendarElement.innerHTML = '';

        // Create header
        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.className = 'calendar-nav';
        prevButton.textContent = '‹';
        prevButton.addEventListener('click', () => this.previousMonth());

        const nextButton = document.createElement('button');
        nextButton.className = 'calendar-nav';
        nextButton.textContent = '›';
        nextButton.addEventListener('click', () => this.nextMonth());

        const title = document.createElement('div');
        title.className = 'calendar-title';
        title.textContent = this.getMonthYearString();

        header.appendChild(prevButton);
        header.appendChild(title);
        header.appendChild(nextButton);

        // Create calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';        // Add day headers
        const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Add days
        this.addDaysToGrid(grid);

        // Create info section
        const info = document.createElement('div');
        info.className = 'calendar-info';
        info.textContent = this.selectedDate
            ? this.selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Selecciona un día para ver la fecha';

        this.calendarElement.appendChild(header);
        this.calendarElement.appendChild(grid);
        this.calendarElement.appendChild(info);
    }

    private addDaysToGrid(grid: HTMLDivElement): void {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);

        // Adjust for Monday as first day of week (0=Sunday, 1=Monday, etc.)
        let dayOffset = firstDay.getDay() - 1;
        if (dayOffset < 0) dayOffset = 6; // Handle Sunday (0) -> make it 6
        startDate.setDate(startDate.getDate() - dayOffset);

        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = date.getDate().toString();

            // Add classes for styling
            if (date.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }

            if (this.isSameDay(date, today)) {
                dayElement.classList.add('today');
            }

            if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
                dayElement.classList.add('selected');
            }

            // Add click event
            dayElement.addEventListener('click', () => this.selectDate(date));

            grid.appendChild(dayElement);
        }
    }

    private selectDate(date: Date): void {
        if (date.getMonth() === this.currentDate.getMonth()) {
            this.selectedDate = new Date(date);
            this.render();
            console.log('Selected date:', date.toDateString());
        }
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    private getMonthYearString(): string {
        /* const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`; */
        return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    private previousMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    private nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    public goToDate(date: Date): void {
        this.currentDate = new Date(date);
        this.render();
    }

    public getSelectedDate(): Date | null {
        return this.selectedDate;
    }
}

class Inputs {
    private calendar: Calendar;
    private initialDate: Date | null = null;
    private hoursPerDay: number = 8;
    private excludedWeekdays: Set<number> = new Set();

    constructor(container: HTMLElement, calendar: Calendar) {
        this.calendar = calendar;
        const inputContainer = document.createElement('div');
        inputContainer.className = 'inputs-container';
        container.appendChild(inputContainer);

        // Title for the inputs section
        const title = document.createElement('h3');
        title.textContent = 'Configuración';
        title.style.marginBottom = '15px';
        title.style.color = '#333';
        inputContainer.appendChild(title);

        // Create input for initial date
        this.createInitialDateInput(inputContainer);

        // Create input for hours per day
        this.createHoursPerDayInput(inputContainer);

        // Create checkboxes for excluded weekdays
        this.createWeekdayExclusions(inputContainer);

        // Create navigation input
        this.createNavigationInput(inputContainer);
    }

    private createInitialDateInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Fecha inicial:';
        label.htmlFor = 'initial-date';

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'initial-date';
        dateInput.className = 'date-input';
        dateInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.value) {
                this.initialDate = new Date(target.value);
                console.log('Initial date set:', this.initialDate.toDateString());
            }
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(dateInput);
        container.appendChild(inputGroup);
    }

    private createHoursPerDayInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Horas por día:';
        label.htmlFor = 'hours-per-day';

        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.id = 'hours-per-day';
        hoursInput.min = '1';
        hoursInput.max = '24';
        hoursInput.value = '8';
        hoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.hoursPerDay = parseInt(target.value) || 8;
            console.log('Hours per day set:', this.hoursPerDay);
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(hoursInput);
        container.appendChild(inputGroup);
    }

    private createWeekdayExclusions(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Días que no cuentan:';

        const weekdaysContainer = document.createElement('div');
        weekdaysContainer.className = 'weekdays-container';

        const weekdays = [
            { name: 'Lunes', value: 1 },
            { name: 'Martes', value: 2 },
            { name: 'Miércoles', value: 3 },
            { name: 'Jueves', value: 4 },
            { name: 'Viernes', value: 5 },
            { name: 'Sábado', value: 6 },
            { name: 'Domingo', value: 0 }
        ];

        weekdays.forEach(weekday => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'weekday-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `weekday-${weekday.value}`;
            checkbox.value = weekday.value.toString();
            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                if (target.checked) {
                    this.excludedWeekdays.add(weekday.value);
                } else {
                    this.excludedWeekdays.delete(weekday.value);
                }
                console.log('Excluded weekdays:', Array.from(this.excludedWeekdays));
            });

            const checkboxLabel = document.createElement('label');
            checkboxLabel.textContent = weekday.name;
            checkboxLabel.htmlFor = `weekday-${weekday.value}`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(checkboxLabel);
            weekdaysContainer.appendChild(checkboxContainer);
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(weekdaysContainer);
        container.appendChild(inputGroup);
    }

    private createNavigationInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Ir a fecha:';
        label.htmlFor = 'navigation-date';

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'navigation-date';
        dateInput.className = 'date-input';
        dateInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.value) {
                const selectedDate = new Date(target.value);
                this.calendar.goToDate(selectedDate);
            }
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(dateInput);
        container.appendChild(inputGroup);
    }

    public getInitialDate(): Date | null {
        return this.initialDate;
    }

    public getHoursPerDay(): number {
        return this.hoursPerDay;
    }

    public getExcludedWeekdays(): Set<number> {
        return this.excludedWeekdays;
    }
}
// Initialize the calendar
const title = document.createElement('h1');
title.textContent = 'Calculadora de días';
title.style.textAlign = 'center';
title.style.margin = '20px 0';
title.style.color = '#333';
title.style.fontFamily = 'Arial, sans-serif';
app.appendChild(title);

const calendar = new Calendar(app);
const inputs = new Inputs(app, calendar);