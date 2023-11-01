'use strict';

// Array of month names for later use

// DOM element selections
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

////////////////////////// Creating the WorkOut Class //////////////////////////////////////////
class workOut {
  date = new Date();
  // creating unique id
  id = (Date.now() + '').slice(-10);
  type = inputType.value;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.setDescription();
  }
  // Creating the Date

  setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.decription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class running extends workOut {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this.setDescription();
  }
  clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends workOut {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacspeed();
    this.setDescription();
  }
  clacspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//////////////////////////// Creating the main App class/////////////////////////////////////////////

class App {
  #map; // Private field for storing a map object
  #mapEvent; // Private field for storing a map event
  #workOuts = [];

  constructor() {
    this._getPosition(); // Get the user's geolocation

    this.getLocalStorage(); // Get data from local storage

    form.addEventListener('submit', this._newWorkout.bind(this)); // Add a submit event listener to the form
    inputType.addEventListener('change', this._toggleElevationField.bind(this)); // Add a change event listener to the workout type input
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Get the user's geolocation
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMapPosition.bind(this), // On success, call _loadMapPosition
        () => {
          alert('Get Lost'); // On failure, display an alert message
        }
      );
  }

  // Load the map with the user's position
  _loadMapPosition(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 12); // Create a Leaflet map and set its view to the user's coordinates

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map); // Add a tile layer from OpenStreetMap to the map

    this.#map.on('click', this._showForm.bind(this)); // Add a click event listener to the map

    this.workOut.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // Show the input form when the map is clicked
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden'); // Remove the 'hidden' class to display the form
    inputDistance.focus(); // Set focus to the input for workout distance
  }

  // Toggle the visibility of the cadence and elevation input fields based on the selected workout type
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden'); // Toggle the 'form__row--hidden' class for elevation input
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden'); // Toggle the 'form__row--hidden' class for cadence input
  }

  // Handle the submission of a new workout
  _newWorkout(e) {
    e.preventDefault(); // Prevent the default form submission

    const validInputs = (...inputs) => {
      return inputs.every(inp => Number.isFinite(inp));
    };
    const allPositive = (...inputs) => {
      return inputs.every(inp => inp > 0);
    };

    // Get Data from Form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workOut;

    // If WorkOut Is running Create running object
    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      // Cheak if Data is Valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Invalid Input! Please enter all numbers');
      }
      workOut = new running([lat, lng], distance, duration, cadence);
    }

    // If WorkOut Is cycling /// Create cycling object
    if (type === 'cycling') {
      const elevationGain = Number(inputElevation.value);
      // Check if Data is Valid
      if (
        !validInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration)
      ) {
        return alert('Invalid Input! Please enter all numbers');
      }
      workOut = new cycling([lat, lng], distance, duration, elevationGain);
    }

    //Add new object to workout array

    this.#workOuts.push(workOut);

    // Render the workouts in sidebar

    this._renderWorkout(workOut);

    // Display a marker on the map at the clicked location
    this._renderWorkoutMarker(workOut);

    // Clear input fields

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // Set the Local Storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workOut) {
    L.marker(workOut.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workOut.type}-popup`,
        })
      )

      .setPopupContent(
        `${workOut.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workOut.decription}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.decription}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
    form.style.display = 'none';
    form.classList.add('hidden'); // Add the 'hidden' class to Hide the form
    setTimeout(() => (form.style.display = 'grid'));
  }
  // move to workout marker
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    const workout = this.#workOuts.find(
      work => work.id == workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 12, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workOuts));
  }
  getLocalStorage() {
    let storedWorkouts = JSON.parse(localStorage.getItem('workouts'));

    if (!storedWorkouts) return;

    this.workOut = storedWorkouts;

    this.workOut.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workOuts');
    location.reload();
  }
}

const app = new App(); // Create an instance of the App class to initialize the application
