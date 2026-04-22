import { createServer } from "node:http";

import { Server } from "socket.io";

import { getServerConfig } from "./config";
import { RoomRegistry } from "./room-registry";
import { createSessionSeed } from "../lib/game/rng";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../lib/multiplayer/protocol";

const config = getServerConfig();
const roomRegistry = new RoomRegistry();

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "fruitbox-realtime",
        time: new Date().toISOString(),
      }),
    );
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: false, message: "Not found." }));
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.data.sessionId = createSessionSeed("session");
  socket.data.roomId = null;

  socket.emit("session:ready", {
    sessionId: socket.data.sessionId,
    connectedAt: new Date().toISOString(),
    serverVersion: "0.1.0",
  });

  socket.on("client:ping", (_payload, ack) => {
    const response = { receivedAt: new Date().toISOString() };

    socket.emit("server:pong", response);
    ack?.(response);
  });

  socket.on("room:create", (request, ack) => {
    const result = roomRegistry.createRoom(request, {
      sessionId: socket.data.sessionId,
      socketId: socket.id,
      displayName: request.displayName?.trim() || "Player",
    });

    if (result.ok) {
      socket.join(result.room.roomId);
      socket.data.roomId = result.room.roomId;
      io.to(result.room.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:join", (request, ack) => {
    const result = roomRegistry.joinRoom(request, {
      sessionId: socket.data.sessionId,
      socketId: socket.id,
      displayName: request.displayName?.trim() || "Player",
    });

    if (result.ok) {
      socket.join(result.room.roomId);
      socket.data.roomId = result.room.roomId;
      io.to(result.room.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:leave", (request, ack) => {
    const result = roomRegistry.leaveRoom(request.roomId, socket.data.sessionId);

    if (result.ok) {
      socket.leave(request.roomId);
      socket.data.roomId = null;
      io.to(request.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:get", (request, ack) => {
    ack(roomRegistry.getRoom(request.roomId));
  });

  socket.on("room:start", (request, ack) => {
    const result = roomRegistry.startMatch(request.roomId, socket.data.sessionId);

    if (result.ok) {
      io.to(request.roomId).emit("room:updated", result.room);
      scheduleRoomRefresh(request.roomId, result.room.countdownDurationMs + 50);
      scheduleRoomRefresh(request.roomId, result.room.countdownDurationMs + result.room.matchConfig.durationMs + 100);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:move", (request, ack) => {
    const result = roomRegistry.submitMove(
      request.roomId,
      socket.data.sessionId,
      request.selectionBox,
    );

    if (result.ok) {
      io.to(request.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("disconnect", () => {
    const room = roomRegistry.disconnectSession(socket.data.sessionId, socket.data.roomId);

    if (room) {
      io.to(room.roomId).emit("room:updated", room);
    }
  });
});

httpServer.listen(config.port, () => {
  console.log(
    `[fruitbox-realtime] listening on http://localhost:${config.port} (cors: ${config.corsOrigin})`,
  );
});

function scheduleRoomRefresh(roomId: string, delayMs: number) {
  setTimeout(() => {
    const result = roomRegistry.getRoom(roomId);

    if (result.ok) {
      io.to(roomId).emit("room:updated", result.room);
    }
  }, Math.max(0, delayMs));
}
