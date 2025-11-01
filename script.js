const API_KEY = "92ce074892d6be811931e1e60f2cfce6";
const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const suggestions = document.getElementById('suggestions');
const card = document.getElementById('weatherCard');
const clock = document.getElementById('clock');

// 🕒 Update both India and US times every second
setInterval(() => {
  const now = new Date();
  const indiaTime = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
  const usaTime = now.toLocaleTimeString("en-US", { timeZone: "America/New_York" });
  clock.textContent = `🇮🇳 India: ${indiaTime} | 🇺🇸 USA: ${usaTime}`;
}, 1000);

// 🌦 Fetch weather by city name
async function fetchWeather(city) {
  if (!city) return;
  card.innerHTML = '<div class="status">Loading...</div>';
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}`);
    const data = await res.json();
    if (res.ok) displayWeather(data);
    else throw new Error(data.message);
  } catch (err) {
    card.innerHTML = `<div class="status error">Error: ${err.message}</div>`;
  }
}

// 🌡 Determine weather symbol
function getWeatherSymbol(tempC, condition) {
  if (condition.toLowerCase().includes("rain")) return "☔";
  if (tempC > 30) return "☀️";
  if (tempC < 15) return "🌨";
  return "⛅";
}

// 🧾 Display weather data
function displayWeather(data) {
  const tempC = (data.main.temp - 273.15).toFixed(1);
  const symbol = getWeatherSymbol(tempC, data.weather[0].main);

  card.innerHTML = `
    <div class="weather-grid">
      <div class="left">
        <h2>${data.name}, ${data.sys.country}</h2>
        <div class="temp">${symbol} ${tempC}°C</div>
        <div class="desc">${data.weather[0].description}</div>
        <div class="meta">Feels like: ${(data.main.feels_like - 273.15).toFixed(1)}°C</div>
        <div class="meta">Humidity: ${data.main.humidity}%</div>
        <div class="meta">Wind: ${data.wind.speed} m/s</div>
      </div>
      <div class="right">
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
        <div class="timestamps">Updated: ${new Date().toLocaleTimeString()}</div>
        <div class="timestamps">Coordinates: ${data.coord.lat}, ${data.coord.lon}</div>
      </div>
    </div>`;
}

// 🔍 Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchWeather(cityInput.value.trim());
  suggestions.innerHTML = '';
});

// 📍 Use current location
document.getElementById('useLocation').addEventListener('click', () => {
  if (!navigator.geolocation) {
    card.innerHTML = '<div class="status error">Geolocation not supported by your browser.</div>';
    return;
  }
  card.innerHTML = '<div class="status">Fetching your location...</div>';
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`);
      const data = await res.json();
      if (res.ok) displayWeather(data);
      else throw new Error(data.message);
    } catch (err) {
      card.innerHTML = `<div class="status error">Error: ${err.message}</div>`;
    }
  }, (err) => {
    card.innerHTML = `<div class="status error">${err.message}</div>`;
  });
});

// 🧭 City suggestions (auto-complete)
cityInput.addEventListener('input', async () => {
  const query = cityInput.value.trim();
  if (query.length < 3) {
    suggestions.innerHTML = '';
    return;
  }
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
    const data = await res.json();
    suggestions.innerHTML = data
      .map(item => `<div class="suggestion-item" data-city="${item.name}">${item.name}, ${item.country}</div>`)
      .join('');
  } catch (err) {
    console.error(err);
  }
});

// 🖱 Click on suggestion
suggestions.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-item')) {
    const city = e.target.getAttribute('data-city');
    cityInput.value = city;
    suggestions.innerHTML = '';
    fetchWeather(city);
  }
});
