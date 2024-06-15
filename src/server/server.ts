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

const connections = new Map<string, string[]>();
const files = new Map<string, any>();

io.on("connection", (socket) => {
  console.log(`Connection received from ${socket.id}`);
  connections.set(socket.id, []);
  io.emit(SocketEvents.USER_CONNECTION_UPDATE, Array.from(connections.keys()));
  io.emit(SocketEvents.FILE_LIST_UPDATE, Object.fromEntries(files));

  socket.on(SocketEvents.FILE_REQUEST_DOWNLOAD, ({ fileId, requestId }) => {
    const fileUploader = files.get(fileId)?.uploadedBy;
    console.log(
      `Requesting download of ${fileId} to ${requestId} from ${fileUploader}`
    );
    if (!fileUploader) {
      console.log(`File ${fileId} not found`);
      return;
    }
    io.to(fileUploader).emit(SocketEvents.FILE_REQUEST_DOWNLOAD, {
      fileId: fileId,
      requestId,
    });
  });

  socket.on(SocketEvents.FILE_LIST_UPDATE, (update: FileUpdate) => {
    switch (update.action) {
      case "add":
        files.set(update.id, {
          uploadedBy: update.uploadedBy,
          name: update.name,
        });
        connections.get(update.uploadedBy)?.push(update.id);
        break;
      case "remove":
        files.delete(update.id);
        connections
          .get(update.uploadedBy)
          ?.splice(connections.get(update.uploadedBy)?.indexOf(update.id) ?? 0);
        break;
    }
    io.emit(SocketEvents.FILE_LIST_UPDATE, Object.fromEntries(files));
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
    connections.delete(socket.id);
    io.emit(
      SocketEvents.USER_CONNECTION_UPDATE,
      Array.from(connections.keys())
    );
  });
});
