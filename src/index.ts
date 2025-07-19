const app = document.querySelector('div#app') as HTMLDivElement;

if (!app) {
    throw new Error('App element not found');
}

class Calendar {
    private currentDate: Date;
    private calendarElement: HTMLDivElement;
    private selectedDate: Date | null = null;
    private inputs: Inputs | null = null;
    private customizationPanel: HTMLDivElement;
    private customDays: Map<string, { excluded?: boolean; customHours?: number }> = new Map();

    constructor(container: HTMLElement) {
        this.currentDate = new Date();
        this.calendarElement = document.createElement('div');
        this.calendarElement.className = 'calendar';
        container.appendChild(this.calendarElement);

        this.customizationPanel = document.createElement('div');
        this.customizationPanel.className = 'day-customization-panel';
        container.appendChild(this.customizationPanel);

        this.render();
    }

    public setInputs(inputs: Inputs): void {
        this.inputs = inputs;

        this.customDays = inputs.getCustomDays();
        this.render();
    }

    public refresh(): void {
        this.render();
    }

    private render(): void {
        this.calendarElement.innerHTML = '';

        this.createHoursDisplay();

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

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        this.addDaysToGrid(grid);

        const info = document.createElement('div');
        info.className = 'calendar-info';

        if (this.selectedDate) {
            const dateText = document.createElement('span');
            dateText.textContent = this.selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

            const unselectButton = document.createElement('button');
            unselectButton.className = 'unselect-button-info';
            unselectButton.textContent = '✕';
            unselectButton.title = 'Deseleccionar día';
            unselectButton.addEventListener('click', this.unselectDate.bind(this));

            info.appendChild(dateText);
            info.appendChild(unselectButton);
        } else {
            info.textContent = 'Selecciona un día para ver la fecha';
        }

        this.calendarElement.appendChild(header);
        this.calendarElement.appendChild(grid);
        this.calendarElement.appendChild(info);

        this.updateCustomizationPanel();
    }

    private updateCustomizationPanel(): void {
        if (!this.selectedDate) {
            this.customizationPanel.classList.remove('visible');
            return;
        }

        this.customizationPanel.classList.add('visible');
        const dateKey = this.formatDateKey(this.selectedDate);
        const customData = this.customDays.get(dateKey) || {};

        const dayOfWeek = this.selectedDate.getDay();
        const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();
        const isGloballyExcluded = excludedWeekdays.has(dayOfWeek);

        this.customizationPanel.innerHTML = '';

        const header = document.createElement('h4');
        header.textContent = `Personalizar ${this.selectedDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}`;
        this.customizationPanel.appendChild(header);

        const excludeRow = document.createElement('div');
        excludeRow.className = 'customization-row';
        const excludeLabel = document.createElement('label');
        const excludeCheckboxHtml = document.createElement('input');
        excludeCheckboxHtml.type = 'checkbox';
        excludeCheckboxHtml.id = 'exclude-day';
        if (customData.excluded) {
            excludeCheckboxHtml.checked = true;
        }
        excludeLabel.appendChild(excludeCheckboxHtml);
        excludeLabel.appendChild(document.createTextNode(' Excluir este día específico'));
        excludeRow.appendChild(excludeLabel);
        this.customizationPanel.appendChild(excludeRow);

        const includeRow = document.createElement('div');
        includeRow.className = 'customization-row';
        const includeLabel = document.createElement('label');
        includeLabel.htmlFor = 'include-day';
        const includeCheckboxHtml = document.createElement('input');
        includeCheckboxHtml.type = 'checkbox';
        includeCheckboxHtml.id = 'include-day';
        if (customData.excluded === false) {
            includeCheckboxHtml.checked = true;
        }
        if (customData.excluded === true || !isGloballyExcluded) {
            includeCheckboxHtml.disabled = true;
        }
        includeLabel.appendChild(includeCheckboxHtml);
        includeLabel.appendChild(document.createTextNode('Incluir este día (anular exclusión global)'));
        includeRow.appendChild(includeLabel);
        this.customizationPanel.appendChild(includeRow);

        const hoursRow = document.createElement('div');
        hoursRow.className = 'customization-row';
        const hoursLabel = document.createElement('label');
        hoursLabel.htmlFor = 'custom-hours';
        hoursLabel.textContent = 'Horas personalizadas:';
        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.id = 'custom-hours';
        hoursInput.min = '0';
        hoursInput.max = '24';
        hoursInput.step = '0.25';
        hoursInput.placeholder = (this.inputs?.getHoursPerDay() || 8).toString();
        if (customData.excluded) {
            hoursInput.disabled = true;
        }
        if (customData.customHours !== undefined) {
            hoursInput.value = customData.customHours.toString();
        } else {
            hoursInput.value = (this.inputs?.getHoursPerDay() || 8).toString();
        }
        hoursRow.appendChild(hoursLabel);
        hoursRow.appendChild(hoursInput);
        this.customizationPanel.appendChild(hoursRow);

        const resetRow = document.createElement('div');
        resetRow.className = 'customization-row';
        const resetButtonHtml = document.createElement('button');
        resetButtonHtml.className = 'reset-button';
        resetButtonHtml.id = 'reset-day';
        resetButtonHtml.textContent = 'Restablecer a valores por defecto';
        if (!customData.excluded && customData.customHours === undefined && customData.excluded !== false) {
            resetButtonHtml.disabled = true;
        }
        resetRow.appendChild(resetButtonHtml);
        this.customizationPanel.appendChild(resetRow);

        const excludeCheckbox = this.customizationPanel.querySelector('#exclude-day') as HTMLInputElement;
        const includeCheckbox = this.customizationPanel.querySelector('#include-day') as HTMLInputElement;
        const customHoursInput = this.customizationPanel.querySelector('#custom-hours') as HTMLInputElement;
        const resetButton = this.customizationPanel.querySelector('#reset-day') as HTMLButtonElement;

        excludeCheckbox.addEventListener('change', () => {
            this.updateCustomDay(dateKey, { excluded: excludeCheckbox.checked });
            customHoursInput.disabled = excludeCheckbox.checked;
            if (excludeCheckbox.checked) {
                customHoursInput.value = '';
                includeCheckbox.checked = false;
                includeCheckbox.disabled = true;
            } else {
                customHoursInput.value = (this.inputs?.getHoursPerDay() || 8).toString();
                const dayOfWeek = this.selectedDate!.getDay();
                const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();
                includeCheckbox.disabled = !excludedWeekdays.has(dayOfWeek);
            }
            this.updateResetButton(resetButton, dateKey);
        });

        includeCheckbox.addEventListener('change', () => {
            if (includeCheckbox.checked) {
                this.updateCustomDay(dateKey, { excluded: false });
                customHoursInput.disabled = false;
                customHoursInput.value = (this.inputs?.getHoursPerDay() || 8).toString();
            } else {
                const date = new Date(dateKey + 'T00:00:00');
                const dayOfWeek = date.getDay();
                const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();

                if (excludedWeekdays.has(dayOfWeek)) {
                    this.customDays.delete(dateKey);
                    customHoursInput.disabled = true;
                    customHoursInput.value = '';
                } else {
                    const existing = this.customDays.get(dateKey) || {};
                    delete existing.excluded;
                    if (Object.keys(existing).length === 0) {
                        this.customDays.delete(dateKey);
                    } else {
                        this.customDays.set(dateKey, existing);
                    }
                }
                this.saveCustomDays();
                this.render();
            }
            this.updateResetButton(resetButton, dateKey);
        });

        customHoursInput.addEventListener('input', () => {
            const value = parseFloat(customHoursInput.value);
            if (!isNaN(value) && value >= 0 && value <= 24) {
                this.updateCustomDay(dateKey, { customHours: value });
            }
            this.updateResetButton(resetButton, dateKey);
        });

        resetButton.addEventListener('click', () => {
            this.customDays.delete(dateKey);
            this.saveCustomDays();
            this.render();
        });
    }

    private updateCustomDay(dateKey: string, updates: { excluded?: boolean; customHours?: number }): void {
        const existing = this.customDays.get(dateKey) || {};
        if (updates.excluded !== undefined) {
            if (updates.excluded === true) {
                existing.excluded = true;
                delete existing.customHours;
            } else if (updates.excluded === false) {
                existing.excluded = false;
            } else {
                delete existing.excluded;
            }
        }

        if (updates.customHours !== undefined && !existing.excluded) {
            if (updates.customHours === (this.inputs?.getHoursPerDay() || 8)) {
                delete existing.customHours;
            } else {
                existing.customHours = updates.customHours;
            }
        }

        if (Object.keys(existing).length === 0) {
            this.customDays.delete(dateKey);
        } else {
            this.customDays.set(dateKey, existing);
        }

        this.saveCustomDays();
        this.render();
    }

    private updateResetButton(button: HTMLButtonElement, dateKey: string): void {
        const customData = this.customDays.get(dateKey);
        button.disabled = !customData || (Object.keys(customData).length === 0);
    }

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        return key;
    }

    private saveCustomDays(): void {
        if (this.inputs) {
            this.inputs.setCustomDays(this.customDays);
        }
    }

    private addDaysToGrid(grid: HTMLDivElement): void {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);

        const startDate = new Date(firstDay);

        let dayOffset = firstDay.getDay() - 1;
        if (dayOffset < 0) dayOffset = 6;
        startDate.setDate(startDate.getDate() - dayOffset);

        const today = new Date();
        const initialDate = this.inputs?.getInitialDate();
        const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();

        const expectedEndDate = this.calculateExpectedEndDate();

        for (let i = 0; i < 42; i++) {

            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = date.getDate().toString();

            if (date.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }

            const dateKey = this.formatDateKey(date);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = date.getDay();

            let appliedClass = '';

            const isCustomIncluded = customData?.excluded === false;
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;

            if (initialDate && date >= initialDate && date <= today &&
                !isGloballyExcluded && !isCustomExcluded) {


                if (expectedEndDate && date > expectedEndDate) {
                    appliedClass = 'passed-day-after-expected';
                } else {
                    appliedClass = 'passed-day';
                }
            }

            if (isGloballyExcluded || isCustomExcluded) {
                appliedClass = 'excluded-day';
            }

            if (customData?.customHours !== undefined && !isCustomExcluded && !isGloballyExcluded) {
                if (customData.customHours === 0) {
                    appliedClass = 'zero-hours';
                } else {
                    appliedClass = 'custom-hours';
                }

                dayElement.title = `${customData.customHours}h`;
            }
            if (expectedEndDate && this.isSameDay(date, expectedEndDate)) {
                appliedClass = 'expected-end';
            }

            if (initialDate && this.isSameDay(date, initialDate)) {
                appliedClass = 'initial-date';
            }

            if (this.isSameDay(date, today)) {
                appliedClass = 'today';
            }

            if (appliedClass) {
                dayElement.classList.add(appliedClass);
            }

            if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
                dayElement.classList.add('selected');
            }

            dayElement.addEventListener('click', () => {
                const clickedDate = new Date(date.getTime());
                this.selectDate(clickedDate);
            });

            grid.appendChild(dayElement);
        }
    }

    private selectDate(date: Date): void {
        if (date.getMonth() === this.currentDate.getMonth()) {
            const datea = new Date(date);
            datea.setHours(11, 59, 59, 59);
            this.selectedDate = datea;
            this.render();
        }
    }

    private unselectDate(): void {
        this.selectedDate = null;
        this.render();
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    private getMonthYearString(): string {
        return this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    }

    private previousMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.selectedDate = null;
        this.render();
    }

    private nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDate = null;
        this.render();
    }

    public goToDate(date: Date): void {
        this.currentDate = new Date(date);
        this.render();
    }

    private createHoursDisplay(): void {
        const hoursDisplay = document.createElement('div');
        hoursDisplay.className = 'hours-display';

        if (!this.inputs) {
            hoursDisplay.textContent = 'Configurando...';
            this.calendarElement.appendChild(hoursDisplay);
            return;
        }

        const initialDate = this.inputs.getInitialDate();
        const totalHours = this.inputs.getTotalHours();

        if (!initialDate) {
            hoursDisplay.className = 'hours-display error';
            hoursDisplay.textContent = 'Debes establecer una fecha inicial';
            this.calendarElement.appendChild(hoursDisplay);
            return;
        }

        if (totalHours <= 0) {
            hoursDisplay.className = 'hours-display error';
            hoursDisplay.textContent = 'Debes establecer el total de horas';
            this.calendarElement.appendChild(hoursDisplay);
            return;
        }

        const endDate = this.selectedDate || new Date();
        const passedHours = this.calculatePassedHours(initialDate, endDate);
        const remainingHours = Math.max(0, totalHours - passedHours);

        if (passedHours >= totalHours) {
            hoursDisplay.textContent = `¡Horas completadas! ${passedHours} / ${totalHours}`;
            hoursDisplay.className = 'hours-display complete';
        } else {
            hoursDisplay.textContent = `Horas transcurridas: ${passedHours} / ${totalHours} (${remainingHours} restantes)`;
        }

        this.calendarElement.appendChild(hoursDisplay);
    }

    private calculatePassedHours(initialDate: Date, endDate: Date): number {
        if (!this.inputs) return 0;

        const excludedWeekdays = this.inputs.getExcludedWeekdays();
        const defaultHoursPerDay = this.inputs.getHoursPerDay();

        let totalHours = 0;
        const currentDate = new Date(initialDate);

        while (currentDate <= endDate) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();
            const isCustomIncluded = customData?.excluded === false;

            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                const hoursForDay = customData?.customHours !== undefined
                    ? customData.customHours
                    : defaultHoursPerDay;

                totalHours += hoursForDay;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return totalHours;
    }

    private calculateExpectedEndDate(): Date | null {
        if (!this.inputs) return null;

        const initialDate = this.inputs.getInitialDate();
        const totalHours = this.inputs.getTotalHours();

        if (!initialDate || totalHours <= 0) return null;

        const excludedWeekdays = this.inputs.getExcludedWeekdays();
        const defaultHoursPerDay = this.inputs.getHoursPerDay();

        let accumulatedHours = 0;
        const currentDate = new Date(initialDate);

        while (accumulatedHours < totalHours) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();

            const isCustomIncluded = customData?.excluded === false;

            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                const hoursForDay = customData?.customHours !== undefined
                    ? customData.customHours
                    : defaultHoursPerDay;

                accumulatedHours += hoursForDay;
            }

            if (accumulatedHours >= totalHours) {
                break;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        while (true) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();

            const isCustomIncluded = customData?.excluded === false;
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                break;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return new Date(currentDate);
    }
}

class Inputs {
    private calendar: Calendar;
    private initialDate: Date | null = null;
    private hoursPerDay: number = 8;
    private totalHours: number = 0;
    private excludedWeekdays: Set<number> = new Set();
    private customDays: Map<string, { excluded?: boolean; customHours?: number }> = new Map();
    private readonly STORAGE_KEY = 'calendar-config';

    constructor(container: HTMLElement, calendar: Calendar) {
        this.calendar = calendar;

        this.loadFromStorage();

        const inputContainer = document.createElement('div');
        inputContainer.className = 'inputs-container';
        container.appendChild(inputContainer);

        const title = document.createElement('h3');
        title.textContent = 'Configuración';
        title.classList.add('subtitle');
        inputContainer.appendChild(title);

        this.createInitialDateInput(inputContainer);
        this.createHoursPerDayInput(inputContainer);
        this.createTotalHoursInput(inputContainer);
        this.createWeekdayExclusions(inputContainer);
        this.createColorLegend(inputContainer);
        this.createExportButton(inputContainer);
    }

    private loadFromStorage(): void {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const config = JSON.parse(savedData);

                if (config.initialDate) {
                    this.initialDate = new Date(config.initialDate);
                }

                if (config.hoursPerDay !== undefined) {
                    this.hoursPerDay = config.hoursPerDay;
                }

                if (config.totalHours !== undefined) {
                    this.totalHours = config.totalHours;
                }
                if (config.excludedWeekdays && Array.isArray(config.excludedWeekdays)) {
                    this.excludedWeekdays = new Set(config.excludedWeekdays);
                }

                if (config.customDays) {
                    this.customDays = new Map(Object.entries(config.customDays));
                }
            }
        } catch (error) {
            console.warn('Error loading calendar configuration from localStorage:', error);
        }
    }

    private saveToStorage(): void {
        try {
            const config = {
                initialDate: this.initialDate ? this.initialDate.toISOString() : null,
                hoursPerDay: this.hoursPerDay,
                totalHours: this.totalHours,
                excludedWeekdays: Array.from(this.excludedWeekdays),
                customDays: Object.fromEntries(this.customDays)
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.warn('Error saving calendar configuration to localStorage:', error);
        }
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

        const today = new Date();
        dateInput.max = today.toISOString().split('T')[0];

        if (this.initialDate) {
            dateInput.value = this.initialDate.toISOString().split('T')[0];
        }

        dateInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.value) {
                const selectedDate = new Date(target.value);

                if (selectedDate <= today) {
                    this.initialDate = selectedDate;
                    this.saveToStorage();
                    this.calendar.refresh();
                } else {
                    alert('No puedes seleccionar una fecha futura');
                    target.value = '';
                }
            } else {
                this.initialDate = null;
                this.saveToStorage();
                this.calendar.refresh();
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
        hoursInput.value = this.hoursPerDay.toString();

        hoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.hoursPerDay = parseInt(target.value) || 8;
            this.saveToStorage();
            this.calendar.refresh();
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(hoursInput);
        container.appendChild(inputGroup);
    }

    private createTotalHoursInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Total de horas a contar:';
        label.htmlFor = 'total-hours';

        const totalHoursInput = document.createElement('input');
        totalHoursInput.type = 'number';
        totalHoursInput.id = 'total-hours';
        totalHoursInput.min = '0';
        totalHoursInput.step = '0.5';
        totalHoursInput.placeholder = 'Ej: 160';

        if (this.totalHours > 0) {
            totalHoursInput.value = this.totalHours.toString();
        }

        totalHoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.totalHours = parseFloat(target.value) || 0;
            this.saveToStorage();
            this.calendar.refresh();
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(totalHoursInput);
        container.appendChild(inputGroup);
    }

    private createWeekdayExclusions(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const miniTitle = document.createElement('span');
        miniTitle.textContent = 'Días que no cuentan:';

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
            const checkbox = document.createElement('input');
            checkboxContainer.className = 'weekday-checkbox';
            checkbox.type = 'checkbox';
            checkbox.id = `weekday-${weekday.value}`;
            checkbox.value = weekday.value.toString();

            checkbox.checked = this.excludedWeekdays.has(weekday.value);

            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                if (target.checked) {
                    this.excludedWeekdays.add(weekday.value);
                } else {
                    this.excludedWeekdays.delete(weekday.value);
                }
                this.saveToStorage();
                this.calendar.refresh();
            });

            const checkboxLabel = document.createElement('label');
            checkboxLabel.textContent = weekday.name;
            checkboxLabel.htmlFor = `weekday-${weekday.value}`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(checkboxLabel);
            weekdaysContainer.appendChild(checkboxContainer);
        });

        inputGroup.appendChild(miniTitle);
        inputGroup.appendChild(weekdaysContainer);
        container.appendChild(inputGroup);
    }

    private createColorLegend(container: HTMLElement): void {
        const legendGroup = document.createElement('div');
        legendGroup.className = 'legend-group';

        const title = document.createElement('h4');
        title.textContent = 'Leyenda de colores';
        title.classList.add('subtitle');
        legendGroup.appendChild(title);

        const legendContainer = document.createElement('div');
        legendContainer.className = 'legend-container';

        const legendItems = [
            { color: '#2196f3', label: 'Fecha inicial', class: 'legend-initial' },
            { color: '#4caf50', label: 'Días trabajados', class: 'legend-passed' },
            { color: '#2196f3', border: '2px solid gold', label: 'Fecha final esperada', class: 'legend-expected' },
            { color: '#e6ffe6', textColor: '#2e7d32', label: 'Días tras fecha esperada', class: 'legend-after-expected' },
            { color: '#f44336', label: 'Días excluidos', class: 'legend-excluded' },
            { color: '#ff9800', label: 'Horas personalizadas', class: 'legend-custom' },
            { color: '#fdd835', textColor: '#000', label: 'Cero horas', class: 'legend-zero' },
            { color: '#9e9e9e', label: 'Hoy', class: 'legend-today' }
        ];

        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color-box';
            colorBox.style.backgroundColor = item.color;
            if (item.textColor) {
                colorBox.style.color = item.textColor;
            } else {
                colorBox.style.color = 'white';
            }
            if (item.border) {
                colorBox.style.border = item.border;
                colorBox.style.boxShadow = '0 0 3px rgba(255, 215, 0, 0.5)';
            }

            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label;
            labelSpan.className = 'legend-label';

            legendItem.appendChild(colorBox);
            legendItem.appendChild(labelSpan);
            legendContainer.appendChild(legendItem);
        });

        legendGroup.appendChild(legendContainer);
        container.appendChild(legendGroup);
    }

    private createExportButton(container: HTMLElement): void {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        // Excel Export Button
        const exportExcelButton = document.createElement('button');
        exportExcelButton.type = 'button';
        exportExcelButton.textContent = 'Exportar a Excel';
        exportExcelButton.classList.add('export-button', 'export-buttons');
        exportExcelButton.addEventListener('click', () => this.exportToExcel());

        // JSON Export Button
        const exportJsonButton = document.createElement('button');
        exportJsonButton.type = 'button';
        exportJsonButton.textContent = 'Exportar datos';
        exportJsonButton.classList.add('json-export-button', 'export-buttons');
        exportJsonButton.addEventListener('click', () => this.exportToJson());

        // JSON Import Button
        const importJsonButton = document.createElement('button');
        importJsonButton.type = 'button';
        importJsonButton.textContent = 'Importar datos';
        importJsonButton.classList.add('json-import-button', 'export-buttons');
        importJsonButton.addEventListener('click', () => this.triggerJsonImport());

        // Hidden file input for JSON import
        const fileInput = document.createElement('input');
        fileInput.title = 'Importar datos';
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleJsonImport(e));

        buttonGroup.appendChild(exportJsonButton);
        buttonGroup.appendChild(importJsonButton);
        buttonGroup.appendChild(exportExcelButton);
        container.appendChild(buttonGroup);
        container.appendChild(fileInput);
    }

    /**
     * Exports the current calendar configuration to a JSON file
     */
    private exportToJson(): void {
        const config = {
            version: '1.0',
            initialDate: this.initialDate ? this.initialDate.toISOString() : null,
            hoursPerDay: this.hoursPerDay,
            totalHours: this.totalHours,
            excludedWeekdays: Array.from(this.excludedWeekdays),
            customDays: Object.fromEntries(this.customDays),
            exportDate: new Date().toISOString()
        };

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `calendario_config_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    /**
     * Triggers the file picker for JSON import
     */
    private triggerJsonImport(): void {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = ''; // Reset to allow selecting the same file again
            fileInput.click();
        }
    }

    /**
     * Handles the file selection and import of JSON configuration
     */
    private handleJsonImport(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const config = JSON.parse(content);
                this.importFromJson(config);
            } catch (error) {
                alert('Error al importar el archivo. Asegúrate de que es un archivo de configuración válido.');
                console.error('Error importing JSON:', error);
            }
        };

        reader.onerror = () => {
            alert('Error al leer el archivo. Por favor, inténtalo de nuevo.');
        };

        reader.readAsText(file);
    }

    /**
     * Imports configuration from a JSON object
     */
    private importFromJson(config: any): void {
        try {
            // Validate the config structure
            if (typeof config !== 'object' || config === null) {
                throw new Error('Formato de configuración inválido');
            }

            // Apply the configuration
            if (config.initialDate) {
                this.initialDate = new Date(config.initialDate);
                const dateInput = document.getElementById('initial-date') as HTMLInputElement;
                if (dateInput) {
                    dateInput.value = this.initialDate.toISOString().split('T')[0];
                }
            }

            if (typeof config.hoursPerDay === 'number') {
                this.hoursPerDay = config.hoursPerDay;
                const hoursInput = document.getElementById('hours-per-day') as HTMLInputElement;
                if (hoursInput) {
                    hoursInput.value = this.hoursPerDay.toString();
                }
            }

            if (typeof config.totalHours === 'number') {
                this.totalHours = config.totalHours;
                const totalHoursInput = document.getElementById('total-hours') as HTMLInputElement;
                if (totalHoursInput) {
                    totalHoursInput.value = this.totalHours.toString();
                }
            }

            if (Array.isArray(config.excludedWeekdays)) {
                this.excludedWeekdays = new Set(config.excludedWeekdays);
                // Update UI checkboxes
                this.excludedWeekdays.forEach(day => {
                    const checkbox = document.getElementById(`weekday-${day}`) as HTMLInputElement;
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }

            if (config.customDays && typeof config.customDays === 'object') {
                this.customDays = new Map(Object.entries(config.customDays));
            }

            // Save to storage and refresh the calendar
            this.saveToStorage();
            this.calendar.refresh();

            // Show success message
            alert('Configuración importada correctamente');

        } catch (error) {
            console.error('Error importing configuration:', error);
            alert('Error al importar la configuración: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    }

    private exportToExcel(): void {
        const initialDate = this.getInitialDate();
        const hoursPerDay = this.getHoursPerDay();
        const excludedWeekdays = this.getExcludedWeekdays();
        const customDays = this.getCustomDays();

        if (!initialDate) {
            alert('Por favor, establece una fecha inicial antes de exportar');
            return;
        }

        // Create CSV header
        let csvContent = 'Fecha;Día de la semana;Horas;Estado\n';

        // Get today's date
        const today = new Date();

        // Generate data for each day from initial date to today
        const currentDate = new Date(initialDate);
        while (currentDate <= today) {
            const dateKey = this.formatDateKey(currentDate);
            const dayOfWeek = currentDate.getDay();
            const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek];

            // Get custom day data if it exists
            const customData = customDays.get(dateKey);

            // Determine status and hours
            let status = 'Normal';
            let hours = hoursPerDay;

            if (customData?.excluded) {
                status = 'Excluido';
                hours = 0;
            } else if (customData?.customHours !== undefined) {
                status = 'Horas personalizadas';
                hours = customData.customHours;
            } else if (excludedWeekdays.has(dayOfWeek)) {
                status = 'Día excluido';
                hours = 0;
            }

            // Add row to CSV
            const formattedDate = currentDate.toISOString().split('T')[0];
            csvContent += `${formattedDate};${dayName};${hours};${status}\n`;

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create download link
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `calendario_horas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    public getInitialDate(): Date | null {
        return this.initialDate;
    }

    public getHoursPerDay(): number {
        return this.hoursPerDay;
    }

    public getTotalHours(): number {
        return this.totalHours;
    }

    public getExcludedWeekdays(): Set<number> {
        return this.excludedWeekdays;
    }

    public getCustomDays(): Map<string, { excluded?: boolean; customHours?: number }> {
        return this.customDays;
    }

    public setCustomDays(customDays: Map<string, { excluded?: boolean; customHours?: number }>): void {
        this.customDays = customDays;
        this.saveToStorage();
    }
}

const title = document.createElement('h1');
title.textContent = 'Calculadora de días';
title.classList.add('title');
app.appendChild(title);

const calendar = new Calendar(app);
const inputs = new Inputs(app, calendar);
calendar.setInputs(inputs);