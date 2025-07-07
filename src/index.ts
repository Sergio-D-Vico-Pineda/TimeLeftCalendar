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

        // Create customization panel
        this.customizationPanel = document.createElement('div');
        this.customizationPanel.className = 'day-customization-panel';
        container.appendChild(this.customizationPanel);

        this.render();
    }

    public setInputs(inputs: Inputs): void {
        this.inputs = inputs;
        // Load custom days from inputs
        this.customDays = inputs.getCustomDays();
        this.render();
    }

    public refresh(): void {
        this.render();
    }

    private render(): void {
        this.calendarElement.innerHTML = '';

        // Create hours display
        this.createHoursDisplay();

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

        if (this.selectedDate) {
            const dateText = document.createElement('span');
            dateText.textContent = this.selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

            const unselectButton = document.createElement('button');
            unselectButton.className = 'unselect-button-info';
            unselectButton.textContent = '✕';
            unselectButton.title = 'Deseleccionar día';
            unselectButton.addEventListener('click', () => this.unselectDate());

            info.appendChild(dateText);
            info.appendChild(unselectButton);
        } else {
            info.textContent = 'Selecciona un día para ver la fecha';
        }

        this.calendarElement.appendChild(header);
        this.calendarElement.appendChild(grid);
        this.calendarElement.appendChild(info);

        // Update customization panel
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

        // Check if this day is globally excluded by weekday
        const dayOfWeek = this.selectedDate.getDay();
        const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();
        const isGloballyExcluded = excludedWeekdays.has(dayOfWeek);

        this.customizationPanel.innerHTML = `
            <h4>Personalizar ${this.selectedDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}</h4>
            
            <div class="customization-row">
                <label>
                    <input type="checkbox" id="exclude-day" ${customData.excluded ? 'checked' : ''}>
                    Excluir este día específico
                </label>
            </div>
            
            <div class="customization-row">
                <label>
                    <input type="checkbox" id="include-day" 
                        ${customData.excluded === false ? 'checked' : ''} 
                        ${customData.excluded === true || !isGloballyExcluded ? 'disabled' : ''}>
                    Incluir este día (anular exclusión global)
                </label>
            </div>
            
            <div class="customization-row">
                <label for="custom-hours">Horas personalizadas:</label>
                <input 
                    type="number" 
                    id="custom-hours" 
                    min="0" 
                    max="24" 
                    step="0.25"
                    value="${customData.customHours !== undefined ? customData.customHours : (this.inputs?.getHoursPerDay() || 8)}"
                    ${customData.excluded ? 'disabled' : ''}
                    placeholder="${this.inputs?.getHoursPerDay() || 8}"
                >
            </div>
            
            <div class="customization-row">
                <button class="reset-button" id="reset-day" ${!customData.excluded && customData.customHours === undefined && customData.excluded !== false ? 'disabled' : ''}>
                    Restablecer a valores por defecto
                </button>
            </div>
        `;

        // Add event listeners
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
                // Only enable include checkbox if day is globally excluded
                const dayOfWeek = this.selectedDate!.getDay();
                const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();
                includeCheckbox.disabled = !excludedWeekdays.has(dayOfWeek);
            }
            this.updateResetButton(resetButton, dateKey);
        });

        includeCheckbox.addEventListener('change', () => {
            if (includeCheckbox.checked) {
                // Include this day (override global exclusion)
                this.updateCustomDay(dateKey, { excluded: false });
                customHoursInput.disabled = false;
                customHoursInput.value = (this.inputs?.getHoursPerDay() || 8).toString();
            } else {
                // Remove custom inclusion (revert to global exclusion if applicable)
                const date = new Date(dateKey + 'T00:00:00');
                const dayOfWeek = date.getDay();
                const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();

                if (excludedWeekdays.has(dayOfWeek)) {
                    // Day should be excluded again by global rule
                    this.customDays.delete(dateKey);
                    customHoursInput.disabled = true;
                    customHoursInput.value = '';
                } else {
                    // Day wasn't globally excluded, just remove custom inclusion
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
                delete existing.customHours; // Remove custom hours if excluding
            } else if (updates.excluded === false) {
                // Custom inclusion (override global exclusion)
                existing.excluded = false;
            } else {
                // Remove any exclusion setting
                delete existing.excluded;
            }
        }

        if (updates.customHours !== undefined && !existing.excluded) {
            if (updates.customHours === (this.inputs?.getHoursPerDay() || 8)) {
                delete existing.customHours; // Remove if same as default
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
        return date.toISOString().split('T')[0];
    }

    private saveCustomDays(): void {
        if (this.inputs) {
            this.inputs.setCustomDays(this.customDays);
        }
    }

    private addDaysToGrid(grid: HTMLDivElement): void {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);

        // Adjust for Monday as first day of week
        let dayOffset = firstDay.getDay() - 1;
        if (dayOffset < 0) dayOffset = 6; // Handle Sunday (0) -> make it 6
        startDate.setDate(startDate.getDate() - dayOffset);

        const today = new Date();
        const initialDate = this.inputs?.getInitialDate();
        const excludedWeekdays = this.inputs?.getExcludedWeekdays() || new Set();

        // Calculate expected end date once outside the loop
        const expectedEndDate = this.calculateExpectedEndDate();

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

            // Get custom day data
            const dateKey = this.formatDateKey(date);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = date.getDay();
            // Priority-based color logic
            let appliedClass = '';

            // Check if this specific day is custom included (overrides global exclusion)
            const isCustomIncluded = customData?.excluded === false;

            // Check if day is excluded by weekday rule but not custom included
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;

            // Check if day is custom excluded
            const isCustomExcluded = customData?.excluded === true;

            // 1. Check if it's a passed working day (base green or light green)
            if (initialDate && date >= initialDate && date <= today &&
                !isGloballyExcluded && !isCustomExcluded) {

                // Determine if it's before or after expected end date
                if (expectedEndDate && date > expectedEndDate) {
                    appliedClass = 'passed-day-after-expected';
                } else {
                    appliedClass = 'passed-day';
                }
            }

            // 2. Check if it's excluded (globally or custom) - overrides passed
            if (isGloballyExcluded || isCustomExcluded) {
                appliedClass = 'excluded-day';
            }

            // 3. Check if it has custom hours - overrides excluded and passed
            if (customData?.customHours !== undefined && !isCustomExcluded && !isGloballyExcluded) {
                if (customData.customHours === 0) {
                    appliedClass = 'zero-hours';
                } else {
                    appliedClass = 'custom-hours';
                }

                // Add tooltip for custom hours
                dayElement.title = `${customData.customHours}h`;
            }            // 4. Check if it's the expected end date
            if (expectedEndDate && this.isSameDay(date, expectedEndDate)) {
                appliedClass = 'expected-end';
            }

            // 5. Check if it's the initial date - overrides most others
            if (initialDate && this.isSameDay(date, initialDate)) {
                appliedClass = 'initial-date';
            }

            // 6. Check if it's today - overrides all others
            if (this.isSameDay(date, today)) {
                appliedClass = 'today';
            }

            // Apply the class
            if (appliedClass) {
                dayElement.classList.add(appliedClass);
            }

            // 6. Check if it's selected (this should be last to get darker color)
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

    private unselectDate(): void {
        this.selectedDate = null;
        this.render();
        console.log('Date unselected');
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
        this.selectedDate = null; // Clear selection when changing months
        this.render();
    }

    private nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDate = null; // Clear selection when changing months
        this.render();
    }

    public goToDate(date: Date): void {
        this.currentDate = new Date(date);
        this.render();
    }

    public getSelectedDate(): Date | null {
        return this.selectedDate;
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

        // Check if hours are complete
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

        // Include initial date and iterate until endDate (inclusive)
        while (currentDate <= endDate) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();
            // Check if this specific day is custom included (overrides global exclusion)
            const isCustomIncluded = customData?.excluded === false;

            // Check if day is excluded (globally but not custom included, or custom excluded)
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                // Use custom hours if available, otherwise use default
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

        // Find the date when we reach the total hours
        while (accumulatedHours < totalHours) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();

            // Check if this specific day is custom included (overrides global exclusion)
            const isCustomIncluded = customData?.excluded === false;

            // Check if day is excluded (globally but not custom included, or custom excluded)
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                // Use custom hours if available, otherwise use default
                const hoursForDay = customData?.customHours !== undefined
                    ? customData.customHours
                    : defaultHoursPerDay;

                accumulatedHours += hoursForDay;
            }

            // If we've reached the total, this is our end date
            if (accumulatedHours >= totalHours) {
                break;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // If the calculated end date is on an excluded day, move to next working day
        while (true) {
            const dateKey = this.formatDateKey(currentDate);
            const customData = this.customDays.get(dateKey);
            const dayOfWeek = currentDate.getDay();

            const isCustomIncluded = customData?.excluded === false;
            const isGloballyExcluded = excludedWeekdays.has(dayOfWeek) && !isCustomIncluded;
            const isCustomExcluded = customData?.excluded === true;
            const isExcluded = isGloballyExcluded || isCustomExcluded;

            if (!isExcluded) {
                break; // Found a working day
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return new Date(currentDate);
    }

    private createColorLegend(container: HTMLElement): void {
        const legendGroup = document.createElement('div');
        legendGroup.className = 'legend-group';

        const title = document.createElement('h4');
        title.textContent = 'Leyenda de colores';
        title.style.marginBottom = '10px';
        title.style.color = '#333';
        legendGroup.appendChild(title);

        const legendContainer = document.createElement('div');
        legendContainer.className = 'legend-container';

        const legendItems = [
            { color: '#2196f3', label: 'Fecha inicial', class: 'legend-initial' },
            { color: '#4caf50', label: 'Días trabajados', class: 'legend-passed' },
            { color: '#2196f3', border: '2px solid gold', label: 'Fecha final esperada', class: 'legend-expected' },
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

        // Load saved values from localStorage
        this.loadFromStorage();

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
        this.createInitialDateInput(inputContainer);        // Create input for hours per day
        this.createHoursPerDayInput(inputContainer);

        // Create input for total hours
        this.createTotalHoursInput(inputContainer);        // Create checkboxes for excluded weekdays
        this.createWeekdayExclusions(inputContainer);

        // Create color legend
        this.createColorLegend(inputContainer);
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
                    // Convert array back to Map
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
        label.htmlFor = 'initial-date'; const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'initial-date';
        dateInput.className = 'date-input';

        // Set max date to today to prevent future dates
        const today = new Date();
        dateInput.max = today.toISOString().split('T')[0];

        // Restore saved value
        if (this.initialDate) {
            dateInput.value = this.initialDate.toISOString().split('T')[0];
        }

        dateInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.value) {
                const selectedDate = new Date(target.value); if (selectedDate <= today) {
                    this.initialDate = selectedDate;
                    this.saveToStorage(); // Save to localStorage
                    this.calendar.refresh(); // Refresh calendar
                    console.log('Initial date set:', this.initialDate.toDateString());
                } else {
                    alert('No puedes seleccionar una fecha futura');
                    target.value = '';
                }
            } else {
                this.initialDate = null;
                this.saveToStorage(); // Save to localStorage
                this.calendar.refresh(); // Refresh calendar
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
        label.htmlFor = 'hours-per-day'; const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.id = 'hours-per-day';
        hoursInput.min = '1';
        hoursInput.max = '24';
        hoursInput.value = this.hoursPerDay.toString(); // Use saved value

        hoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.hoursPerDay = parseInt(target.value) || 8;
            this.saveToStorage(); // Save to localStorage
            this.calendar.refresh(); // Refresh calendar
            console.log('Hours per day set:', this.hoursPerDay);
        }); inputGroup.appendChild(label);
        inputGroup.appendChild(hoursInput);
        container.appendChild(inputGroup);
    }

    private createTotalHoursInput(container: HTMLElement): void {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = 'Total de horas a contar:';
        label.htmlFor = 'total-hours'; const totalHoursInput = document.createElement('input');
        totalHoursInput.type = 'number';
        totalHoursInput.id = 'total-hours';
        totalHoursInput.min = '0';
        totalHoursInput.step = '0.5';
        totalHoursInput.placeholder = 'Ej: 160';

        // Restore saved value
        if (this.totalHours > 0) {
            totalHoursInput.value = this.totalHours.toString();
        }

        totalHoursInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.totalHours = parseFloat(target.value) || 0;
            this.saveToStorage(); // Save to localStorage
            this.calendar.refresh(); // Refresh calendar
            console.log('Total hours set:', this.totalHours);
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(totalHoursInput);
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
            const checkbox = document.createElement('input');
            checkboxContainer.className = 'weekday-checkbox';
            checkbox.type = 'checkbox';
            checkbox.id = `weekday-${weekday.value}`;
            checkbox.value = weekday.value.toString();

            // Restore saved value
            checkbox.checked = this.excludedWeekdays.has(weekday.value);

            checkbox.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                if (target.checked) {
                    this.excludedWeekdays.add(weekday.value);
                } else {
                    this.excludedWeekdays.delete(weekday.value);
                }
                this.saveToStorage(); // Save to localStorage
                this.calendar.refresh(); // Refresh calendar
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

    private createColorLegend(container: HTMLElement): void {
        const legendGroup = document.createElement('div');
        legendGroup.className = 'legend-group';

        const title = document.createElement('h4');
        title.textContent = 'Leyenda de colores';
        title.style.marginBottom = '10px';
        title.style.color = '#333';
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

// Initialize the calendar
const title = document.createElement('h1');
title.textContent = 'Calculadora de días';
title.classList.add('title');
app.appendChild(title);

const calendar = new Calendar(app);
const inputs = new Inputs(app, calendar);
calendar.setInputs(inputs);