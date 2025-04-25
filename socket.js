const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000"], // your frontend
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
