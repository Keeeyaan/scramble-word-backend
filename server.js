import http from "http";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import gameLogic from "./game-logic.js";

config();
const PORT = process.env.PORT || 8000;
const app = express();

//Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  gameLogic(io, socket);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
