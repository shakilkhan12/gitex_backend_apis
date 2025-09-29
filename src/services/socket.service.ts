import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private static io: SocketIOServer | null = null;

  public static initializeSocket(server: HTTPServer): SocketIOServer {
    if (!this.io) {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? ['https://gitexai-1dd08c5fca2d.herokuapp.com', 'http://localhost:4000', 'https://10.70.90.183:443', 'https://10.70.90.183']
            : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:4000', 'https://10.70.90.183:443', 'https://10.70.90.183'],
          methods: ['GET', 'POST'],
          credentials: true
        }
      });

      this.io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join office sentiment room
        socket.on('join-office-sentiment', () => {
          socket.join('office-sentiment');
          console.log(`📊 Client ${socket.id} joined office-sentiment room`);
        });

        // Leave office sentiment room
        socket.on('leave-office-sentiment', () => {
          socket.leave('office-sentiment');
          console.log(`📊 Client ${socket.id} left office-sentiment room`);
        });

        // Join park sentiment room
        socket.on('join-park-sentiment', () => {
          socket.join('park-sentiment');
          console.log(`🌳 Client ${socket.id} joined park-sentiment room`);
        });

        // Leave park sentiment room
        socket.on('leave-park-sentiment', () => {
          socket.leave('park-sentiment');
          console.log(`🌳 Client ${socket.id} left park-sentiment room`);
        });

        // Join office footfall room
        socket.on('join-office-footfall', () => {
          socket.join('office-footfall');
          console.log(`🏢 Client ${socket.id} joined office-footfall room`);
        });

        // Leave office footfall room
        socket.on('leave-office-footfall', () => {
          socket.leave('office-footfall');
          console.log(`🏢 Client ${socket.id} left office-footfall room`);
        });

        // Join park footfall room
        socket.on('join-park-footfall', () => {
          socket.join('park-footfall');
          console.log(`🌳 Client ${socket.id} joined park-footfall room`);
        });

        // Leave park footfall room
        socket.on('leave-park-footfall', () => {
          socket.leave('park-footfall');
          console.log(`🌳 Client ${socket.id} left park-footfall room`);
        });

        // Join office attendance room
        socket.on('join-office-attendance', () => {
          socket.join('office-attendance');
          console.log(`🏢 Client ${socket.id} joined office-attendance room`);
        });

        // Leave office attendance room
        socket.on('leave-office-attendance', () => {
          socket.leave('office-attendance');
          console.log(`🏢 Client ${socket.id} left office-attendance room`);
        });

        // Test office footfall event
        socket.on('test-office-footfall-event', () => {
          console.log(`🧪 Client ${socket.id} requested test office footfall event`);
          if (this.io) {
            const testData = {
              type: 'new_entry',
              data: {
                id: Date.now(),
                time: new Date(),
                person_Id: 1,
                person: {
                  Id: 1,
                  name: 'Test Employee',
                  user_Id: 'test123'
                },
                office: {
                  Id: 1,
                  office_english_name: 'Test Office'
                },
                camera: {
                  Id: 1,
                  camera_name: 'Test Camera'
                }
              }
            };
            this.io.to('office-footfall').emit('office-footfall-update', testData);
            console.log(`🧪 Sent test office footfall event to office-footfall room`);
          }
        });


        socket.on('disconnect', () => {
          console.log(`🔌 Client disconnected: ${socket.id}`);
        });
      });
    }

    return this.io;
  }

  public static getIO(): SocketIOServer | null {
    return this.io;
  }

  public static emitOfficeSentimentUpdate(data: any): void {
    if (this.io) {
      this.io.to('office-sentiment').emit('office-sentiment-update', data);
      console.log('📡 Emitted office sentiment update to all clients in room');
    }
  }

  public static emitParkSentimentUpdate(data: any): void {
    if (this.io) {
      this.io.to('park-sentiment').emit('park-sentiment-update', data);
      console.log('📡 Emitted park sentiment update to all clients in room');
    }
  }

  public static emitOfficeFootfallUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('office-footfall');
      const roomSize = room ? room.size : 0;
      console.log(`📡 Emitting office footfall update to ${roomSize} clients in office-footfall room`);
      this.io.to('office-footfall').emit('office-footfall-update', data);
    } else {
      console.log('❌ Socket.IO not initialized, cannot emit office footfall update');
    }
  }

  public static emitParkFootfallUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('park-footfall');
      const roomSize = room ? room.size : 0;
      console.log(`📡 Emitting park footfall update to ${roomSize} clients in park-footfall room`);
      this.io.to('park-footfall').emit('park-footfall-update', data);
    } else {
      console.log('❌ Socket.IO not initialized, cannot emit park footfall update');
    }
  }

  public static emitOfficeAttendanceUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('office-attendance');
      const roomSize = room ? room.size : 0;
      console.log(`📡 Emitting office attendance update to ${roomSize} clients in office-attendance room`);
      this.io.to('office-attendance').emit('office-attendance-update', data);
    } else {
      console.log('❌ Socket.IO not initialized, cannot emit office attendance update');
    }
  }

}

export default SocketService;
