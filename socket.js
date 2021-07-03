let io;

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    });
    return io;
  },
  getIo: () =>{
    if (!io) {
      throw new Error('Socket.io is not inatialized');
    }
    return io;
  },
};
