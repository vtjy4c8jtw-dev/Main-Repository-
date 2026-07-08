import axios from 'axios';

// In production the backend serves this build itself (same origin), so an
// empty base URL resolves relative to whatever host it's deployed on. Local
// dev runs the CRA dev server separately from the API, so it needs an
// explicit target unless overridden via REACT_APP_API_URL.
const baseURL =
  process.env.REACT_APP_API_URL !== undefined
    ? process.env.REACT_APP_API_URL
    : process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:5000';

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

export const getImportStatus = () => client.get('/api/import').then((r) => r.data);
export const uploadStravaExport = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return client
    .post('/api/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
    .then((r) => r.data);
};
export const clearImportedData = () => client.delete('/api/import').then((r) => r.data);

export default client;
