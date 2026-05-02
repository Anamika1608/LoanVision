import { Server, Socket } from "socket.io";

export function registerEventHandlers(io: Server, socket: Socket) {
  socket.on("consent-given", ({ sessionId, transcript }: { sessionId: string; transcript: string }) => {
    console.log(`Consent received in session ${sessionId}`);
    socket.to(sessionId).emit("consent-confirmed", { transcript });
  });

  socket.on("request-liveness-challenge", ({ sessionId }: { sessionId: string }) => {
    socket.to(sessionId).emit("liveness-challenge", { type: "blink" });
  });
}

export function emitToSession(io: Server, sessionId: string, event: string, data: unknown) {
  io.to(sessionId).emit(event, data);
}
