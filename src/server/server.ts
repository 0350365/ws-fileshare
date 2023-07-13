import express from "express";
import http from "http";
import { Server } from "socket.io";
import { FileTransferMetadata, FileUpdate } from "../utils/types";

const PORT = 3030;

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on port ${PORT}`);
});

app.get("/", (_, res) => {
  res.send("Hit");
});

io.on("connection", (socket) => {
  console.log(`Connection received from ${socket.id}`);

  socket.on("download-request", (arg) => {
    io.emit("message", arg);
  });

  socket.on("update-file", (update: FileUpdate) => {
    io.emit("update-file", update);
  });

  socket.on("fs-meta", (data: { metadata: FileTransferMetadata }) => {
    io.emit("fs-meta", data.metadata);
  });

  socket.on("fs-start", () => {
    io.emit("fs-start", {});
  });

  socket.on("fs-raw", (data) => {
    io.emit("fs-raw", data.buffer);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});
