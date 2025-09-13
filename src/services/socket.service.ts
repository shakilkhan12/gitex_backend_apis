import { Server, Socket } from 'socket.io';
import * as http from 'http';

// Declare socket variable
let io: Server;

// Initialize Socket.IO
export const initSocket = (server: http.Server): void => {
  io = new Server(server); // Initialize the socket server with the provided HTTP server

  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle custom events from clients
    socket.on('message', (data: string) => {
      console.log('Received message:', data);
      io.emit('message', data);  // Broadcast message to all clients
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

// Get the socket instance for use in other files (controllers/services)
export const getSocketInstance = (): Server | undefined => {
  return io;
};

// Example of broadcasting a message to all connected clients
export const broadcastMessage = (message: string): void => {
  if (io) {
    io.emit('message', message); // Broadcast message to all connected clients
  }
};
