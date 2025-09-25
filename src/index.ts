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
        prevButton.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path xmlns="http://www.w3.org/2000/svg" d="M11.7071 5.29289C12.0976 5.68342 12.0976 6.31658 11.7071 6.70711L7.41421 11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H7.41421L11.7071 17.2929C12.0976 17.6834 12.0976 18.3166 11.7071 18.7071C11.3166 19.0976 10.6834 19.0976 10.2929 18.7071L4.29289 12.7071C4.10536 12.5196 4 12.2652 4 12C4 11.7348 4.10536 11.4804 4.29289 11.2929L10.2929 5.29289C10.6834 4.90237 11.3166 4.90237 11.7071 5.29289Z" fill="currentColor""></path></svg>';
        prevButton.addEventListener('click', () => this.previousMonth());

        const nextButton = document.createElement('button');
        nextButton.className = 'calendar-nav';
        nextButton.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path xmlns="http://www.w3.org/2000/svg" d="M12.2929 5.29289C12.6834 4.90237 13.3166 4.90237 13.7071 5.29289L19.7071 11.2929C19.8946 11.4804 20 11.7348 20 12C20 12.2652 19.8946 12.5196 19.7071 12.7071L13.7071 18.7071C13.3166 19.0976 12.6834 19.0976 12.2929 18.7071C11.9024 18.3166 11.9024 17.6834 12.2929 17.2929L16.5858 13L5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11L16.5858 11L12.2929 6.70711C11.9024 6.31658 11.9024 5.68342 12.2929 5.29289Z" fill="currentColor"></path></svg>';
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
            unselectButton.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path xmlns="http://www.w3.org/2000/svg" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="currentColor"></path></svg>';
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

        // Añadir botón para establecer como fecha inicial
        const setAsInitialRow = document.createElement('div');
        setAsInitialRow.className = 'customization-row';
        const setAsInitialButton = document.createElement('button');
        setAsInitialButton.className = 'set-initial-button';
        setAsInitialButton.id = 'set-as-initial';

        const initialDate = this.inputs?.getInitialDate();

        if ((initialDate && this.isSameDay(this.selectedDate, initialDate)) ||
            customData.excluded ||
            isGloballyExcluded ||
            this.selectedDate > new Date()) {
            setAsInitialButton.disabled = true;
        } else {
            setAsInitialButton.textContent = 'Establecer como fecha inicial';
            setAsInitialRow.appendChild(setAsInitialButton);
            this.customizationPanel.appendChild(setAsInitialRow);
        }

        const excludeCheckbox = this.customizationPanel.querySelector('#exclude-day') as HTMLInputElement;
        const includeCheckbox = this.customizationPanel.querySelector('#include-day') as HTMLInputElement;
        const customHoursInput = this.customizationPanel.querySelector('#custom-hours') as HTMLInputElement;
        const resetButton = this.customizationPanel.querySelector('#reset-day') as HTMLButtonElement;
        const setInitialButton = this.customizationPanel.querySelector('#set-as-initial') as HTMLButtonElement;

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

        setInitialButton.addEventListener('click', () => {
            if (this.selectedDate && this.inputs) {
                this.inputs.setInitialDate(this.selectedDate);
            }
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

    public formatDateKey(date: Date): string {
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

        const endDate = this.selectedDate || new Date();
        const passedHours = this.calculatePassedHours(initialDate, endDate);

        if (totalHours === 0) {
            // When totalHours is 0, just show hours passed
            hoursDisplay.textContent = `Horas transcurridas: ${passedHours}`;
            hoursDisplay.className = 'hours-display';
        } else if (totalHours > 0) {
            const remainingHours = Math.max(0, totalHours - passedHours);

            if (passedHours >= totalHours) {
                hoursDisplay.textContent = `¡Horas completadas! ${passedHours} / ${totalHours}`;
                hoursDisplay.className = 'hours-display complete';
            } else {
                hoursDisplay.textContent = `Horas transcurridas: ${passedHours} / ${totalHours} (${remainingHours} restantes)`;
            }
        } else {
            hoursDisplay.className = 'hours-display error';
            hoursDisplay.textContent = 'El total de horas debe ser 0 o un valor positivo';
        }

        this.calendarElement.appendChild(hoursDisplay);
    }

    private calculatePassedHours(initialDate: Date, endDate: Date): number {
        if (!this.inputs) return 0;

        const excludedWeekdays = this.inputs.getExcludedWeekdays();
        const defaultHoursPerDay = this.inputs.getHoursPerDay();

        let totalHours = 0;
        const currentDate = new Date(initialDate);

        // Calcular la diferencia máxima de días entre fechas para evitar bucles infinitos
        // y establecer un límite razonable de iteraciones
        const diffTime = Math.abs(endDate.getTime() - initialDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Establecer un límite máximo de iteraciones (el doble de la diferencia de días como medida de seguridad)
        const maxIterations = Math.min(diffDays * 2, 3650); // Máximo ~10 años
        let iterations = 0;

        while (currentDate <= endDate && iterations < maxIterations) {
            iterations++;

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

            // Si alcanzamos el límite de iteraciones, registramos una advertencia
            if (iterations >= maxIterations) {
                console.warn('Se alcanzó el límite máximo de iteraciones al calcular las horas transcurridas');
                break;
            }
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

        // Establecer un límite máximo de iteraciones para evitar bucles infinitos
        // Calculamos un límite razonable basado en las horas totales y horas por día
        const maxIterations = Math.ceil(totalHours / (defaultHoursPerDay * 0.5)) * 2;
        let iterations = 0;

        while (accumulatedHours < totalHours && iterations < maxIterations) {
            iterations++;

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

        // Si alcanzamos el límite de iteraciones sin completar las horas,
        // devolvemos la fecha actual como mejor estimación
        if (iterations >= maxIterations) {
            console.warn('Se alcanzó el límite máximo de iteraciones al calcular la fecha esperada');
            return new Date();
        }

        // Limitar también el segundo bucle para evitar problemas de memoria
        iterations = 0;
        const maxSecondLoopIterations = 366; // Máximo un año de iteraciones

        while (iterations < maxSecondLoopIterations) {
            iterations++;

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

            // Si llegamos al límite de iteraciones, devolvemos la fecha actual
            if (iterations >= maxSecondLoopIterations) {
                console.warn('Se alcanzó el límite máximo de iteraciones al buscar un día no excluido');
                return new Date();
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
        this.createButtons(inputContainer);
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

    private clearAllData(): void {
        const confirmMessage = '¿Estás seguro de que quieres borrar todos los datos?\n\n' +
            'Esta acción eliminará:\n' +
            '• Fecha inicial\n' +
            '• Horas por día\n' +
            '• Total de horas\n' +
            '• Días excluidos\n' +
            '• Personalizaciones de días\n\n' +
            '⚠️ RECOMENDACIÓN: Exporta tus datos antes de continuar.\n\n' +
            '¿Deseas continuar?';

        if (confirm(confirmMessage)) {
            console.log('Clear all data: User confirmed, proceeding with reset');

            // Reset all data to initial state
            this.initialDate = null;
            this.hoursPerDay = 8;
            this.totalHours = 0;
            this.excludedWeekdays = new Set();
            this.customDays = new Map();

            // Clear localStorage
            try {
                localStorage.removeItem(this.STORAGE_KEY);
                console.log('Clear all data: localStorage cleared');
            } catch (error) {
                console.warn('Clear all data: Error clearing localStorage:', error);
            }

            // Update UI elements
            this.updateInputFields();

            // Force a complete reset of the calendar
            if (this.calendar) {
                // Reset calendar's internal state
                this.calendar['customDays'] = new Map();
                this.calendar['selectedDate'] = null;

                // Force a complete re-render of the calendar
                const currentDate = new Date();
                this.calendar['currentDate'] = currentDate;
                this.calendar.refresh();

                // Clear any selected date in the UI
                this.calendar['updateCustomizationPanel']();
            }

            console.log('Clear all data: Reset completed successfully');
        } else {
            console.log('Clear all data: User cancelled the operation');
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

        // Create error message span
        const errorSpan = document.createElement('span');
        errorSpan.className = 'input-error';
        errorSpan.textContent = 'El valor debe ser positivo (entre 1 y 24)';
        errorSpan.style.display = 'none';
        errorSpan.style.color = 'red';
        errorSpan.style.fontSize = '0.8em';
        errorSpan.style.marginTop = '4px';

        // Store the previous valid value
        let previousValidValue = this.hoursPerDay;

        hoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const value = parseInt(target.value);

            // Check if value is invalid
            if (!value || value <= 0 || value > 24) {
                // Show error message
                errorSpan.style.display = 'block';
                // Keep the previous valid value instead of defaulting to 8
                this.hoursPerDay = previousValidValue;

                // Hide error message after 5 seconds
                setTimeout(() => {
                    errorSpan.style.display = 'none';
                }, 5000);
            } else {
                // Hide error message
                errorSpan.style.display = 'none';
                this.hoursPerDay = value;
                // Update the previous valid value
                previousValidValue = value;
            }

            // Update the input value to reflect the validated value
            target.value = this.hoursPerDay.toString();
            this.saveToStorage();
            this.calendar.refresh();
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(hoursInput);
        inputGroup.appendChild(errorSpan);
        container.appendChild(inputGroup);
    }

    private createTotalHoursInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Total de horas a contar (0 para contar horas):';
        label.htmlFor = 'total-hours';

        const totalHoursInput = document.createElement('input');
        totalHoursInput.type = 'number';
        totalHoursInput.id = 'total-hours';
        totalHoursInput.min = '0';
        totalHoursInput.step = '0.5';
        totalHoursInput.placeholder = '160';

        if (this.totalHours >= 0) {
            totalHoursInput.value = this.totalHours.toString();
        }

        totalHoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            let value = parseFloat(target.value);
            if (value < 0) {
                value = 0;
                target.value = "";
            }
            this.totalHours = value;
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

        // Error message for when all days are checked
        const errorMessage = document.createElement('span');
        errorMessage.className = 'weekday-error';
        errorMessage.textContent = 'No puedes excluir todos los días de la semana';
        errorMessage.style.display = 'none';
        errorMessage.style.color = 'red';
        errorMessage.style.fontSize = '0.8em';
        errorMessage.style.marginTop = '4px';
        errorMessage.style.fontWeight = 'bold';

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

                // Check if this would result in all days being excluded
                if (target.checked) {
                    // If we're adding a day and it would make all 7 days checked
                    if (this.excludedWeekdays.size === 6) {
                        // Prevent checking all days
                        target.checked = false;

                        // Show error message
                        errorMessage.style.display = 'block';

                        // Hide error message after 5 seconds
                        setTimeout(() => {
                            errorMessage.style.display = 'none';
                        }, 5000);

                        return;
                    }

                    this.excludedWeekdays.add(weekday.value);
                } else {
                    this.excludedWeekdays.delete(weekday.value);
                    // Hide error message if it was showing
                    errorMessage.style.display = 'none';
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
        inputGroup.appendChild(errorMessage);
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

    private createButtons(container: HTMLElement): void {
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

        // Clear All Data Button
        const clearAllButton = document.createElement('button');
        clearAllButton.type = 'button';
        clearAllButton.textContent = 'Borrar todo';
        clearAllButton.classList.add('clear-all-button', 'export-buttons');
        clearAllButton.addEventListener('click', () => this.clearAllData());

        // Hidden file input for JSON import
        const fileInput = document.createElement('input');
        fileInput.title = 'Importar datos';
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleJsonImport(e));

        buttonGroup.appendChild(exportExcelButton);
        buttonGroup.appendChild(exportJsonButton);
        buttonGroup.appendChild(importJsonButton);
        buttonGroup.appendChild(clearAllButton);
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

        // Clean up memory after download starts (use timeout to ensure download begins)
        setTimeout(() => {
            console.log('JSON export: Memory cleaned up successfully');
        }, 100);
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
        const maxSize = 2 * 1024 * 1024; // 2MB limit

        // Check file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('Error: Solo se permiten archivos JSON (.json).');
            console.error('JSON import: Invalid file type:', file.name);
            return;
        }

        // Check file size
        if (file.size > maxSize) {
            alert('Error: El archivo es demasiado grande. El tamaño máximo permitido es 2MB.');
            console.error('JSON import: File size exceeds limit:', file.size);
            return;
        }

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
            console.error('JSON import: File reading error');
        };

        reader.readAsText(file);
        console.log('JSON import: File validation passed, size:', file.size, 'bytes');
    }

    /**
     * Imports configuration from a JSON object with comprehensive validation
     */
    private importFromJson(config: any): void {
        console.log('JSON import: Starting validation process');

        try {
            // Comprehensive validation
            const validationErrors = this.validateImportData(config);

            if (validationErrors.length > 0) {
                // Show specific error messages
                const errorMessage = 'Errores de validación:\n' + validationErrors.map(error => `• ${error}`).join('\n');
                alert(errorMessage);
                console.error('JSON import validation failed:', validationErrors);
                return;
            }

            console.log('JSON import: Validation passed, applying configuration');

            // Apply the configuration only if all validation passes
            this.applyValidatedConfiguration(config);

            console.log('JSON import: Configuration applied successfully');

        } catch (error) {
            console.error('JSON import: Unexpected error:', error);
            alert('Error inesperado al importar la configuración: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    }

    /**
     * Validates imported JSON configuration data
     */
    private validateImportData(config: any): string[] {
        const errors: string[] = [];

        // Check if config is an object
        if (typeof config !== 'object' || config === null) {
            errors.push('El archivo debe contener un objeto de configuración válido');
            return errors; // Return early if not an object
        }

        // Validate initialDate
        if (config.initialDate !== undefined) {
            if (config.initialDate !== null) {
                if (typeof config.initialDate !== 'string') {
                    errors.push('initialDate debe ser una cadena de texto o null');
                } else {
                    const date = new Date(config.initialDate);
                    if (isNaN(date.getTime())) {
                        errors.push('initialDate contiene un formato de fecha inválido');
                    }
                }
            }
        }

        // Validate hoursPerDay
        if (config.hoursPerDay !== undefined) {
            if (typeof config.hoursPerDay !== 'number') {
                errors.push('hoursPerDay debe ser un número');
            } else if (config.hoursPerDay < 1 || config.hoursPerDay > 24) {
                errors.push('hoursPerDay debe estar entre 1 y 24 horas');
            }
        }

        // Validate totalHours
        if (config.totalHours !== undefined) {
            if (typeof config.totalHours !== 'number') {
                errors.push('totalHours debe ser un número');
            } else if (config.totalHours < 0) {
                errors.push('totalHours no puede ser negativo');
            }
        }

        // Validate excludedWeekdays
        if (config.excludedWeekdays !== undefined) {
            if (!Array.isArray(config.excludedWeekdays)) {
                errors.push('excludedWeekdays debe ser un array');
            } else {
                config.excludedWeekdays.forEach((day: any, index: number) => {
                    if (typeof day !== 'number') {
                        errors.push(`excludedWeekdays[${index}] debe ser un número`);
                    } else if (day < 0 || day > 6) {
                        errors.push(`excludedWeekdays[${index}] debe estar entre 0 y 6 (0=Domingo, 6=Sábado)`);
                    }
                });
            }
        }

        // Validate customDays
        if (config.customDays !== undefined) {
            if (typeof config.customDays !== 'object' || config.customDays === null) {
                errors.push('customDays debe ser un objeto');
            } else {
                for (const [dateKey, dayConfig] of Object.entries(config.customDays)) {
                    if (typeof dayConfig !== 'object' || dayConfig === null) {
                        errors.push(`customDays["${dateKey}"] debe ser un objeto`);
                        continue;
                    }

                    const config = dayConfig as any;

                    // Validate excluded property
                    if (config.excluded !== undefined && typeof config.excluded !== 'boolean') {
                        errors.push(`customDays["${dateKey}"].excluded debe ser true o false`);
                    }

                    // Validate customHours property
                    if (config.customHours !== undefined) {
                        if (typeof config.customHours !== 'number') {
                            errors.push(`customDays["${dateKey}"].customHours debe ser un número`);
                        } else if (config.customHours < 0 || config.customHours > 24) {
                            errors.push(`customDays["${dateKey}"].customHours debe estar entre 0 y 24`);
                        }
                    }
                }
            }
        }

        return errors;
    }

    /**
     * Updates the input fields in the UI to match the current state
     */
    private updateInputFields(): void {
        // Update initial date input
        const initialDateInput = document.getElementById('initial-date') as HTMLInputElement;
        if (initialDateInput) {
            initialDateInput.value = this.initialDate ? this.initialDate.toISOString().split('T')[0] : '';
        }

        // Update hours per day input
        const hoursPerDayInput = document.getElementById('hours-per-day') as HTMLInputElement;
        if (hoursPerDayInput) {
            hoursPerDayInput.value = this.hoursPerDay.toString();
        }

        // Update total hours input
        const totalHoursInput = document.getElementById('total-hours') as HTMLInputElement;
        if (totalHoursInput) {
            totalHoursInput.value = this.totalHours.toString();
        }

        // Update weekday checkboxes
        this.updateWeekdayCheckboxes();
    }

    /**
     * Applies validated configuration to the application
     */
    private applyValidatedConfiguration(config: any): void {
        let hasChanges = false;

        // Apply initialDate
        if (config.initialDate !== undefined) {
            this.initialDate = config.initialDate ? new Date(config.initialDate) : null;
            hasChanges = true;
            console.log('JSON import: Applied initialDate:', this.initialDate);
        }

        // Apply hoursPerDay
        if (config.hoursPerDay !== undefined) {
            this.hoursPerDay = config.hoursPerDay;
            hasChanges = true;
            console.log('JSON import: Applied hoursPerDay:', this.hoursPerDay);
        }

        // Apply totalHours
        if (config.totalHours !== undefined) {
            this.totalHours = config.totalHours;
            hasChanges = true;
            console.log('JSON import: Applied totalHours:', this.totalHours);
        }

        // Apply excludedWeekdays
        if (config.excludedWeekdays !== undefined) {
            this.excludedWeekdays = new Set(config.excludedWeekdays);
            hasChanges = true;
            console.log('JSON import: Applied excludedWeekdays:', Array.from(this.excludedWeekdays));
        }

        // Apply customDays
        if (config.customDays !== undefined) {
            this.customDays = new Map(Object.entries(config.customDays));
            hasChanges = true;
            console.log('JSON import: Applied customDays:', Object.fromEntries(this.customDays));
        }

        // Save to storage and refresh the calendar if there were changes
        if (hasChanges) {
            this.saveToStorage();

            // Update the calendar with the new data
            if (this.calendar) {
                // Update the calendar's reference to the custom days
                this.calendar['customDays'] = this.customDays;

                // Force a complete re-render of the calendar
                const currentDate = this.calendar['currentDate'];
                this.calendar['currentDate'] = new Date(currentDate);
                this.calendar.refresh();

                // Update all input fields in the UI
                this.updateInputFields();

                console.log('JSON import: Configuration applied successfully without page reload');
            }
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
            const dateKey = this.calendar.formatDateKey(currentDate);
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

        // Clean up memory after download starts (use timeout to ensure download begins)
        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log('Excel export: Memory cleaned up successfully');
        }, 100);
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
    }

    /**
     * Updates the weekday checkboxes based on the current excludedWeekdays set
     */
    private updateWeekdayCheckboxes(): void {
        // Get all weekday checkboxes
        const checkboxes = document.querySelectorAll<HTMLInputElement>('.weekday-checkbox input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            const dayValue = parseInt(checkbox.value, 10);
            checkbox.checked = this.excludedWeekdays.has(dayValue);
        });
    }

    // Método para establecer la fecha inicial desde el calendario
    public setInitialDate(date: Date): void {
        const today = new Date();
        if (date <= today) {
            this.initialDate = date;
            this.saveToStorage();
            this.calendar.refresh();

            // Actualizar el input de fecha inicial si existe
            const dateInput = document.getElementById('initial-date') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = date.toISOString().split('T')[0];
            }
        } else {
            alert('No puedes seleccionar una fecha futura');
        }
    }
}

const title = document.createElement('h1');
title.textContent = 'Calculadora de días';
title.classList.add('title');
app.appendChild(title);

const calendar = new Calendar(app);
const inputs = new Inputs(app, calendar);
calendar.setInputs(inputs);