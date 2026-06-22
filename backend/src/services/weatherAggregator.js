const axios = require('axios');

class WeatherAggregator {
  constructor() {
    this.openWeatherKey = process.env.OPENWEATHER_API_KEY;
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
        confidence: 0.90,
      };
    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      return null;
    }
  }

  async getWeatherFromNOAA(lat, lon) {
    try {
      // First get the grid data
      const gridResponse = await axios.get(
        `https://api.weather.gov/points/${lat},${lon}`
      );
      const gridData = gridResponse.data.properties;

      // Then get the forecast
      const forecastResponse = await axios.get(gridData.forecast);
      const forecast = forecastResponse.data.properties.periods[0];

      return {
        source: 'NOAA',
        temperature: forecast.temperature,
        humidity: 50, // NOAA doesn't provide humidity in simple API
        windSpeed: parseFloat(forecast.windSpeed.replace(/[^0-9.]/g, '')) / 2.237, // Convert mph to m/s
        description: forecast.shortForecast,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('NOAA API error:', error.message);
      return null;
    }
  }

  async aggregateWeather(lat, lon) {
    const [openWeather, noaa] = await Promise.all([
      this.getWeatherFromOpenWeather(lat, lon),
      this.getWeatherFromNOAA(lat, lon),
    ]);

    const sources = [openWeather, noaa].filter(Boolean);

    if (sources.length === 0) {
      throw new Error('Could not fetch weather from any source');
    }

    // Calculate weighted average
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
