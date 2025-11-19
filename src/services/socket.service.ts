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

          socket.on('join-office-sentiment', () => {
            socket.join('office-sentiment');
          });

        socket.on('leave-office-sentiment', () => {
          socket.leave('office-sentiment');
        });

        socket.on('join-park-sentiment', () => {
          socket.join('park-sentiment');
        });

        socket.on('leave-park-sentiment', () => {
          socket.leave('park-sentiment');
        });

        socket.on('join-office-footfall', () => {
          socket.join('office-footfall');
        });

        socket.on('leave-office-footfall', () => {
          socket.leave('office-footfall');
        });

        socket.on('join-park-footfall', () => {
          socket.join('park-footfall');
        });

        socket.on('leave-park-footfall', () => {
          socket.leave('park-footfall');
        });

        socket.on('join-office-attendance', () => {
          socket.join('office-attendance');
        });

        socket.on('leave-office-attendance', () => {
          socket.leave('office-attendance');
        });

        socket.on('join-notifications', () => {
          socket.join('notifications');
        });

        socket.on('leave-notifications', () => {
          socket.leave('notifications');
        });

        socket.on('test-office-footfall-event', () => {
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
          }
        });


        socket.on('disconnect', () => {
            // Client disconnected
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
    }
  }

  public static emitParkSentimentUpdate(data: any): void {
    if (this.io) {
      this.io.to('park-sentiment').emit('park-sentiment-update', data);
    }
  }

  public static emitOfficeFootfallUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('office-footfall');
      const roomSize = room ? room.size : 0;
      this.io.to('office-footfall').emit('office-footfall-update', data);
    } else {
    }
  }

  public static emitParkFootfallUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('park-footfall');
      const roomSize = room ? room.size : 0;
      this.io.to('park-footfall').emit('park-footfall-update', data);
    } else {
    }
  }

  public static emitOfficeAttendanceUpdate(data: any): void {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get('office-attendance');
      const roomSize = room ? room.size : 0;
      this.io.to('office-attendance').emit('office-attendance-update', data);
    } else {
    }
  }

  public static emitNotificationUpdate(data: any): void {
    if (this.io) {
      // Emit only to the notifications room to avoid duplicates
      this.io.to('notifications').emit('notification-update', data);
    }
  }

}

export default SocketService;
