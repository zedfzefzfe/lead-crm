import creart from './creart'
import bajaj from './bajaj'

// Which client this deployment is for: set VITE_CLIENT in Vercel (default: creart).
const CLIENTS = { creart, bajaj }
const client = CLIENTS[import.meta.env.VITE_CLIENT] || creart

export default client
