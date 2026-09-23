import { io } from 'socket.io-client'

// Create a single socket instance
// In production it will connect to the same host that serves the page
// In development, Vite will proxy the requests, but Socket.IO needs to know the URL
// Since Vite proxy doesn't automatically proxy WS correctly without config, 
// we just connect to window.location.origin
export const socket = io(window.location.origin, {
  autoConnect: true,
})

socket.on('connect', () => {
  console.log('Connected to server via Socket.IO')
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
})
