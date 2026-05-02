import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { registerSignalingHandlers } from "./signaling";
import { registerEventHandlers } from "./events";

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    registerSignalingHandlers(io, socket);
    registerEventHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
