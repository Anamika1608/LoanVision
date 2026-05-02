import { createServer } from "http";
import app from "./server";
import { EXPRESS_SERVER_PORT } from "./config";
import { initializeSocket } from "./socket";

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(EXPRESS_SERVER_PORT, () => {
  console.log("Server ready on port:", EXPRESS_SERVER_PORT);
});
