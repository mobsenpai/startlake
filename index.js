import { weatherCodes } from './weatherCodes.js'

const lat = process.env.LATITUDE
const lon = process.env.LONGITUDE

const twelveHour = true

const units = 'fahrenheit'
const timezone = 'America%2FLos_Angeles'

const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${units}&timezone=${timezone}`

let prevSec = -1
let isFetching = false

async function updateClock() {
	const now = new Date()
	const currSec = now.getSeconds()

	if (currSec !== prevSec) {
		prevSec = currSec

		let hours = now.getHours()
		const ampm = hours >= 12 ? 'pm' : 'am'
		if (twelveHour) {
			hours = hours % 12 || 12
		}

		const minutes = now.getMinutes().toString().padStart(2, '0')
		const seconds = currSec.toString().padStart(2, '0')

		document.querySelector('.time').textContent = `${hours}:${minutes}`
		document.querySelector('.sec').textContent = seconds
		document.querySelector('.ampm').textContent = ampm
		document.querySelector('.date').textContent = `${
			now.getMonth() + 1
		}.${now.getDate()}`
		document.querySelector('.day').textContent = now
			.toLocaleDateString('en-US', { weekday: 'long' })
			.toLocaleLowerCase()

		checkWeather(now)
	}

	requestAnimationFrame(updateClock)
}

function checkWeather(now) {
	const cachedData = localStorage.getItem('weatherData')
	if (cachedData) {
		const data = JSON.parse(cachedData)
		const cachedTime = new Date(data.current.time)

		if (now - cachedTime < (15 * 60 + 10) * 1000) {
			updateWeather(data)
			return
		}
	}

	if (!isFetching) {
		fetchAPI()
	}
}

async function fetchAPI() {
	console.log('fetching weather API')
	try {
		isFetching = true
		const response = await fetch(apiURL)
		const data = await response.json()
		console.log('successful fetch', data)
		localStorage.setItem('weatherData', JSON.stringify(data))
		updateWeather(data)
		isFetching = false
	} catch (error) {
		console.error('error fetching weather data:', error)
		isFetching = false
	}
}

function updateWeather(data) {
	const temperature = Math.round(data.current.temperature_2m)
	const weatherCode = data.current.weather_code
	const now = new Date()
	const isDaytime = now.getHours() >= 6 && now.getHours() < 18

	document.querySelector('.temp').textContent = `${temperature}°`
	document.querySelector('.weather').textContent =
		weatherCodes[weatherCode][
			isDaytime ? 'dayDescription' : 'nightDescription'
		].toLocaleLowerCase()
}

updateClock()
