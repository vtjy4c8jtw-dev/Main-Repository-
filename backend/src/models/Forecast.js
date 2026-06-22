const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  description: String,
  sources: [
    {
      name: String,
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      confidence: Number,
    },
  ],
  aggregatedAt: {
    type: Date,
    default: Date.now,
  },
});

forecastSchema.index({ locationId: 1, timestamp: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
