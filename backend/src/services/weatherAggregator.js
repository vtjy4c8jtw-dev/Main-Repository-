const axios = require('axios');

class WeatherAggregator {
  constructor() {
    this.openWeatherKey = process.env.OPENWEATHER_API_KEY;
    this.weatherApiKey = process.env.WEATHER_API_KEY;
  }

  async getWeatherFromOpenWeather(lat, lon) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.openWeatherKey}&units=metric`
      );
      return {
        source: 'OpenWeatherMap',
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        description: response.data.weather[0].description,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      return null;
    }
  }

  async getWeatherFromWeatherAPI(lat, lon) {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${lat},${lon}`
      );
      const data = response.data.current;
      return {
        source: 'WeatherAPI',
        temperature: data.temp_c,
        humidity: data.humidity,
        windSpeed: data.wind_kph / 3.6,
        description: data.condition.text,
        confidence: 0.80,
      };
    } catch (error) {
      console.error('WeatherAPI error:', error.message);
      return null;
    }
  }

  async aggregateWeather(lat, lon) {
    const [openWeather, weatherApi] = await Promise.all([
      this.getWeatherFromOpenWeather(lat, lon),
      this.getWeatherFromWeatherAPI(lat, lon),
    ]);

    const sources = [openWeather, weatherApi].filter(Boolean);

    if (sources.length === 0) {
      throw new Error('Could not fetch weather from any source');
    }

    const totalConfidence = sources.reduce((sum, s) => sum + s.confidence, 0);
    const avgTemp = sources.reduce((sum, s) => sum + s.temperature * s.confidence, 0) / totalConfidence;
    const avgHumidity = sources.reduce((sum, s) => sum + s.humidity * s.confidence, 0) / totalConfidence;
    const avgWindSpeed = sources.reduce((sum, s) => sum + s.windSpeed * s.confidence, 0) / totalConfidence;

    return {
      temperature: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHumidity),
      windSpeed: Math.round(avgWindSpeed * 10) / 10,
      sources,
    };
  }
}

module.exports = new WeatherAggregator();
