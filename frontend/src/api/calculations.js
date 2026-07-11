import { api } from './client'

export const calcMotor = (payload) => api.post('/api/motor', payload)
export const calcNameplate = (payload) => api.post('/api/nameplate', payload)
export const calcStarDelta = (payload) => api.post('/api/star-delta', payload)
export const calcCableBusbar = (payload) => api.post('/api/cable-busbar', payload)
export const generateBOM = (payload) => api.post('/api/bom', payload)
