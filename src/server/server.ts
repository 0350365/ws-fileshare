import express from "express";
import http from "http";
import { Server } from "socket.io";
import { SocketEvents } from "../utils/types";
import { FileTransferMetadata, FileUpdate } from "../utils/types";

const PORT_SERVER = 3030;

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

server.listen(PORT_SERVER, "0.0.0.0", () => {
  console.log(`Listening on port ${PORT_SERVER}`);
});

io.on("connection", (socket) => {
  console.log(`Connection received from ${socket.id}`);
  socket.emit("user-connect", socket.id);

  socket.on(SocketEvents.FILE_SHARE_DOWNLOAD, (arg) => {
    io.to(arg.id).emit(SocketEvents.FILE_SHARE_DOWNLOAD, arg);
  });

  socket.on(SocketEvents.FILE_LIST_UPDATE, (update: FileUpdate) => {
    io.emit(SocketEvents.FILE_LIST_UPDATE, [update]);
  });

  socket.on(
    SocketEvents.FILE_SHARE_METADATA,
    (data: { metadata: FileTransferMetadata }) => {
      io.emit(SocketEvents.FILE_SHARE_METADATA, data.metadata);
    }
  );

  socket.on(SocketEvents.FILE_SHARE_START, () => {
    io.emit(SocketEvents.FILE_SHARE_START, {});
  });

  socket.on(SocketEvents.FILE_SHARE_BUFFER, (data) => {
    io.emit(SocketEvents.FILE_SHARE_BUFFER, data.buffer);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});
