import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const client = axios.create({ baseURL });

export const getAuthStatus = () => client.get('/api/auth/status').then((r) => r.data);
export const loginUrl = () => `${baseURL}/api/auth/login`;
export const logout = () => client.post('/api/auth/logout').then((r) => r.data);

export const getAthlete = () => client.get('/api/athlete').then((r) => r.data);
export const getActivities = (days = 120) =>
  client.get('/api/activities', { params: { days } }).then((r) => r.data);
export const getAnalysis = (days = 120) =>
  client.get('/api/analysis', { params: { days } }).then((r) => r.data);

export const getTrainingPlan = () => client.get('/api/training-plan').then((r) => r.data);
export const createTrainingPlan = (payload) =>
  client.post('/api/training-plan', payload).then((r) => r.data);
export const getGoalPresets = () => client.get('/api/training-plan/goals').then((r) => r.data);

export default client;
