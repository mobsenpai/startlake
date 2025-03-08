import { weatherCodes } from "./weatherCodes.js";

document.addEventListener("DOMContentLoaded", () => {
  const settingsForm = document.getElementById("settings-form");
  const toggleSettingsButton = document.getElementById("toggle-settings");

  const settings = JSON.parse(localStorage.getItem("settings"));

  if (!settings) {
    settingsForm.style.display = "block";
  } else {
    settingsForm.style.display = "none";
    toggleSettingsButton.style.display = "block";
  }

  toggleSettingsButton.addEventListener("click", () => {
    if (settingsForm.style.display === "none") {
      settingsForm.style.display = "block";
    } else {
      settingsForm.style.display = "none";
    }
  });
});

document.getElementById("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  lat = document.getElementById("latitude").value;
  lon = document.getElementById("longitude").value;
  units = document.getElementById("units").value;
  const timeFormat = document.getElementById("time-format").value;
  twelveHour = timeFormat === "12";

  localStorage.setItem(
    "settings",
    JSON.stringify({ lat, lon, units, timeFormat }),
  );
  document.getElementById("settings-form").style.display = "none";
  document.getElementById("toggle-settings").style.display = "block";
  localStorage.removeItem("weatherData");
});

const settings = JSON.parse(localStorage.getItem("settings")) || {
  lat: "0",
  lon: "0",
  units: "fahrenheit",
  timeFormat: "12",
};

let lat = settings.lat;
let lon = settings.lon;
let units = settings.units;
let twelveHour = settings.timeFormat === "12";

let prevSec = -1;
let isFetching = false;

async function updateClock() {
  const now = new Date();
  const currSec = now.getSeconds();

  if (currSec !== prevSec) {
    prevSec = currSec;

    let hours = now.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    if (twelveHour) {
      hours = hours % 12 || 12;
    }

    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = currSec.toString().padStart(2, "0");

    document.querySelector(".time").textContent = `${hours}:${minutes}`;
    document.querySelector(".sec").textContent = seconds;
    document.querySelector(".ampm").textContent = ampm;
    document.querySelector(".date").textContent = `${
      now.getMonth() + 1
    }.${now.getDate()}`;
    document.querySelector(".day").textContent = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLocaleLowerCase();

    checkWeather(now);
  }

  requestAnimationFrame(updateClock);
}

function checkWeather(now) {
  const cachedData = localStorage.getItem("weatherData");
  if (cachedData) {
    const data = JSON.parse(cachedData);
    const cachedTime = new Date(data.current.time);

    if (now - cachedTime < (15 * 60 + 10) * 1000) {
      updateWeather(data);
      return;
    }
  }

  if (!isFetching) {
    fetchAPI();
  }
}

async function fetchAPI() {
  console.log(lat, lon, units);
  try {
    isFetching = true;
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${units}`,
    );
    const data = await response.json();
    console.log("successful fetch", data);
    localStorage.setItem("weatherData", JSON.stringify(data));
    updateWeather(data);
    isFetching = false;
  } catch (error) {
    console.error("error fetching weather data:", error);
    isFetching = false;
  }
}

function updateWeather(data) {
  const temperature = Math.round(data.current.temperature_2m);
  const weatherCode = data.current.weather_code;
  const now = new Date();
  const isDaytime = now.getHours() >= 6 && now.getHours() < 18;

  document.querySelector(".temp").textContent = `${temperature}°`;
  document.querySelector(".weather").textContent =
    weatherCodes[weatherCode][
      isDaytime ? "dayDescription" : "nightDescription"
    ].toLocaleLowerCase();
}

updateClock();
