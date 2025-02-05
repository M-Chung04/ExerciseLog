document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const logSection = document.getElementById('log-section');
  const calendarSection = document.getElementById('calendar-section');
  const exerciseForm = document.getElementById('exercise-form');
  const goCalendarBtn = document.getElementById('go-calendar');
  const backToLogBtn = document.getElementById('back-to-log');
  const calendarDiv = document.getElementById('calendar');
  const exerciseDetailsDiv = document.getElementById('exercise-details');
  const yearSelect = document.getElementById('year-select');
  const monthSelect = document.getElementById('month-select');
  const dateInput = document.getElementById('date');
  const typeInput = document.getElementById('type');
  const typeDropdownBtn = document.getElementById('type-dropdown-btn');
  const typeSuggestionsDiv = document.getElementById('type-suggestions');

  // Load exercises from localStorage or initialize an empty array.
  // Each exercise will have a unique id.
  let exercises = JSON.parse(localStorage.getItem('exercises')) || [];

  // Set default date on the log form to today.
  const today = new Date();
  dateInput.value = today.toISOString().split('T')[0];

  // --- AUTOCOMPLETE & DROPDOWN FOR EXERCISE TYPE ---
  // Get unique, alphabetically sorted exercise types.
  function getUniqueTypes() {
    const types = exercises.map(ex => ex.type);
    return [...new Set(types)].sort((a, b) => a.localeCompare(b));
  }

  // Update the suggestions dropdown based on current input.
  function updateTypeSuggestions() {
    const suggestions = getUniqueTypes();
    const inputVal = typeInput.value.trim().toLowerCase();
    const filtered = suggestions.filter(t => t.toLowerCase().includes(inputVal));
    
    typeSuggestionsDiv.innerHTML = '';
    if (filtered.length > 0 && inputVal !== '') {
      filtered.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', () => {
          typeInput.value = suggestion;
          typeSuggestionsDiv.style.display = 'none';
        });
        typeSuggestionsDiv.appendChild(div);
      });
      typeSuggestionsDiv.style.display = 'block';
    } else {
      typeSuggestionsDiv.style.display = 'none';
    }
  }

  // When the user types in the type input, update suggestions.
  typeInput.addEventListener('input', updateTypeSuggestions);

  // When the user presses Tab in the type input, try to auto-complete.
  typeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      const inputVal = typeInput.value.trim().toLowerCase();
      const suggestions = getUniqueTypes();
      const candidate = suggestions.find(s => s.toLowerCase().startsWith(inputVal));
      if (candidate && candidate.toLowerCase() !== inputVal) {
        e.preventDefault();
        typeInput.value = candidate;
        // Place caret at the end.
        typeInput.setSelectionRange(candidate.length, candidate.length);
      }
    }
  });

  // Toggle full dropdown when the dropdown button is clicked.
  typeDropdownBtn.addEventListener('click', function() {
    const suggestions = getUniqueTypes();
    typeSuggestionsDiv.innerHTML = '';
    if (suggestions.length > 0) {
      suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', () => {
          typeInput.value = suggestion;
          typeSuggestionsDiv.style.display = 'none';
        });
        typeSuggestionsDiv.appendChild(div);
      });
      typeSuggestionsDiv.style.display = 'block';
    }
  });

  // Hide suggestions if clicking outside the type container.
  document.addEventListener('click', function(e) {
    if (!document.querySelector('.type-container').contains(e.target)) {
      typeSuggestionsDiv.style.display = 'none';
    }
  });

  // --- MAIN FORM SUBMISSION ---
  exerciseForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Create a new exercise with a unique id.
    const newExercise = {
      id: Date.now(), // Unique id based on timestamp.
      type: typeInput.value,
      weight: document.getElementById('weight').value,
      reps: document.getElementById('reps').value,
      sets: document.getElementById('sets').value,
      notes: document.getElementById('notes').value,  // Capture notes.
      date: document.getElementById('date').value  // Format: YYYY-MM-DD
    };

    exercises.push(newExercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    alert('Exercise logged successfully!');
    exerciseForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
  });

  // --- CALENDAR VIEW ---
  goCalendarBtn.addEventListener('click', function() {
    logSection.style.display = 'none';
    calendarSection.style.display = 'block';
    populateCalendarControls();
    renderCalendar();
  });

  backToLogBtn.addEventListener('click', function() {
    calendarSection.style.display = 'none';
    logSection.style.display = 'block';
  });

  yearSelect.addEventListener('change', function() {
    populateMonthSelect();
    renderCalendar();
  });
  monthSelect.addEventListener('change', renderCalendar);

  function populateCalendarControls() {
    let earliestDate = null;
    if (exercises.length > 0) {
      const sorted = exercises
        .map(ex => new Date(ex.date))
        .sort((a, b) => a - b);
      earliestDate = sorted[0];
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    let startYear = earliestDate ? earliestDate.getFullYear() : currentYear;
    
    yearSelect.innerHTML = '';
    for (let y = startYear; y <= currentYear; y++) {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      if (y === currentYear) option.selected = true;
      yearSelect.appendChild(option);
    }
    populateMonthSelect();
  }

  function populateMonthSelect() {
    monthSelect.innerHTML = '';
    const selectedYear = parseInt(yearSelect.value, 10);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let earliestDate = null;
    if (exercises.length > 0) {
      const sorted = exercises
        .map(ex => new Date(ex.date))
        .sort((a, b) => a - b);
      earliestDate = sorted[0];
    }
    let earliestYear = earliestDate ? earliestDate.getFullYear() : selectedYear;
    let earliestMonth = earliestDate ? earliestDate.getMonth() : 0;

    let lowerBound = 0, upperBound = 11;
    if (selectedYear === earliestYear) lowerBound = earliestMonth;
    if (selectedYear === currentYear) upperBound = currentMonth;

    for (let m = lowerBound; m <= upperBound; m++) {
      const option = document.createElement('option');
      option.value = m;
      const dateForMonth = new Date(selectedYear, m, 1);
      option.textContent = dateForMonth.toLocaleString('default', { month: 'long' });
      if (selectedYear === currentYear && m === currentMonth) {
        option.selected = true;
      } else if (!monthSelect.querySelector('option[selected]') && m === lowerBound) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    }
  }

  function renderCalendar() {
    calendarDiv.innerHTML = '';
    const selectedYear = parseInt(yearSelect.value, 10);
    const selectedMonth = parseInt(monthSelect.value, 10);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(dayName => {
      const headerCell = document.createElement('div');
      headerCell.classList.add('calendar-header');
      headerCell.textContent = dayName;
      calendarDiv.appendChild(headerCell);
    });

    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let i = 0; i < startingDay; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('calendar-cell');
      blankCell.textContent = '';
      calendarDiv.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.classList.add('calendar-cell');
      cell.textContent = day;
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
      if (exercises.some(ex => ex.date === dateStr)) {
        cell.classList.add('highlight');
      }
      cell.addEventListener('click', function() {
        showExercisesForDate(dateStr);
      });
      calendarDiv.appendChild(cell);
    }
  }

  // Display exercises for a given date.
  function showExercisesForDate(dateStr) {
    exerciseDetailsDiv.style.display = 'block';
    exerciseDetailsDiv.innerHTML = `<h3>Exercises on <span>${dateStr}</span></h3>`;
    
    const exerciseListUl = document.createElement('ul');
    const exercisesForDate = exercises.filter(ex => ex.date === dateStr);
    
    if (exercisesForDate.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No exercises logged for this date.';
      exerciseListUl.appendChild(li);
    } else {
      exercisesForDate.forEach(ex => {
        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.innerHTML = `<strong>${ex.type}</strong>: ${ex.weight} kgs, ${ex.sets} sets, ${ex.reps} reps `;
        
        // View Notes button toggles inline notes.
        const notesBtn = document.createElement('button');
        notesBtn.textContent = 'View Notes';
        notesBtn.classList.add('notes-button');
        notesBtn.style.marginLeft = '10px';
        notesBtn.addEventListener('click', function() {
          let notesContainer = li.querySelector('.notes-container');
          if (notesContainer) {
            notesContainer.style.display = (notesContainer.style.display === 'none' ? 'block' : 'none');
          } else {
            notesContainer = document.createElement('ul');
            notesContainer.classList.add('notes-container');
            notesContainer.style.marginLeft = '20px';
            notesContainer.style.listStyleType = 'disc';
            const noteItem = document.createElement('li');
            noteItem.textContent = ex.notes && ex.notes.trim() !== '' ? ex.notes : 'No notes for this exercise.';
            notesContainer.appendChild(noteItem);
            li.appendChild(notesContainer);
          }
        });
        li.appendChild(notesBtn);
        
        // Edit button.
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.marginLeft = '5px';
        editBtn.addEventListener('click', function() {
          editExercise(ex);
        });
        li.appendChild(editBtn);

        // Delete button.
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-button');
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.addEventListener('click', function() {
          if (confirm('Are you sure you want to delete this exercise?')) {
            deleteExercise(ex.id, ex.date);
          }
        });
        li.appendChild(deleteBtn);

        exerciseListUl.appendChild(li);
      });
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', function() {
      exerciseDetailsDiv.style.display = 'none';
      renderCalendar();
    });
    exerciseDetailsDiv.appendChild(exerciseListUl);
    exerciseDetailsDiv.appendChild(closeBtn);
  }

  // Edit an exercise (including editing notes).
  function editExercise(ex) {
    exerciseDetailsDiv.innerHTML = `<h3>Edit Exercise on <span>${ex.date}</span></h3>`;
    const editForm = document.createElement('form');
    editForm.innerHTML = `
      <div class="edit-row">
        <label>Type:
          <input type="text" name="type" value="${ex.type}" required>
        </label>
      </div>
      <div class="edit-row">
        <label>Weight (kgs):
          <input type="number" name="weight" value="${ex.weight}" required>
        </label>
        <label>Sets:
          <input type="number" name="sets" value="${ex.sets}" required>
        </label>
        <label>Reps:
          <input type="number" name="reps" value="${ex.reps}" required>
        </label>
      </div>
      <div class="edit-row">
        <label>Notes:
          <textarea name="notes" placeholder="Enter notes...">${ex.notes}</textarea>
        </label>
      </div>
      <div class="edit-row">
        <button type="submit">Save</button>
        <button type="button" id="cancel-edit">Cancel</button>
      </div>
    `;
    exerciseDetailsDiv.appendChild(editForm);

    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const updatedExercise = {
        ...ex,
        type: editForm.elements['type'].value,
        weight: editForm.elements['weight'].value,
        sets: editForm.elements['sets'].value,
        reps: editForm.elements['reps'].value,
        notes: editForm.elements['notes'].value
      };
      const index = exercises.findIndex(item => item.id === ex.id);
      if (index !== -1) {
        exercises[index] = updatedExercise;
      }
      localStorage.setItem('exercises', JSON.stringify(exercises));
      alert('Exercise updated successfully!');
      showExercisesForDate(ex.date);
    });

    editForm.querySelector('#cancel-edit').addEventListener('click', function() {
      showExercisesForDate(ex.date);
    });
  }

  function deleteExercise(exerciseId, date) {
    exercises = exercises.filter(ex => ex.id !== exerciseId);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    showExercisesForDate(date);
  }
});
