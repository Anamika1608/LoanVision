import { Server, Socket } from "socket.io";

export function registerSignalingHandlers(io: Server, socket: Socket) {
  socket.on("join-session", (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
    socket.to(sessionId).emit("peer-joined", { socketId: socket.id });
  });

  socket.on("webrtc-offer", ({ sessionId, offer }: { sessionId: string; offer: unknown }) => {
    socket.to(sessionId).emit("webrtc-offer", { offer, from: socket.id });
  });

  socket.on("webrtc-answer", ({ sessionId, answer }: { sessionId: string; answer: unknown }) => {
    socket.to(sessionId).emit("webrtc-answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ sessionId, candidate }: { sessionId: string; candidate: unknown }) => {
    socket.to(sessionId).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("leave-session", (sessionId: string) => {
    socket.leave(sessionId);
    socket.to(sessionId).emit("peer-left", { socketId: socket.id });
  });
}
