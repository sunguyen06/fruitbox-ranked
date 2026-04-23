import { createServer } from "node:http";

import { Server } from "socket.io";
import { MatchCompletionReason, MatchStatus } from "@prisma/client";

import { getServerConfig } from "./config";
import { authenticateSocketUser } from "./auth";
import { persistRoomSnapshot } from "./persistence";
import { RoomRegistry } from "./room-registry";
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
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const user = await authenticateSocketUser(socket.handshake.headers);

    if (!user) {
      next(new Error("Authentication required."));
      return;
    }

    socket.data.userId = user.userId;
    socket.data.displayName = user.displayName;
    socket.data.handle = user.handle;
    socket.data.image = user.image;
    socket.data.roomId = null;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error("Authentication failed."));
  }
});

io.on("connection", (socket) => {
  socket.emit("session:ready", {
    userId: socket.data.userId,
    displayName: socket.data.displayName,
    handle: socket.data.handle,
    image: socket.data.image,
    connectedAt: new Date().toISOString(),
    serverVersion: "0.1.0",
  });

  socket.on("client:ping", (_payload, ack) => {
    const response = { receivedAt: new Date().toISOString() };

    socket.emit("server:pong", response);
    ack?.(response);
  });

  socket.on("room:create", async (request, ack) => {
    const result = roomRegistry.createRoom(request, {
      userId: socket.data.userId,
      socketId: socket.id,
      displayName: socket.data.displayName,
      handle: socket.data.handle,
      image: socket.data.image,
    });

    if (result.ok) {
      socket.join(result.room.roomId);
      socket.data.roomId = result.room.roomId;
      await safePersist(result.room);
      io.to(result.room.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:join", async (request, ack) => {
    const result = roomRegistry.joinRoom(request, {
      userId: socket.data.userId,
      socketId: socket.id,
      displayName: socket.data.displayName,
      handle: socket.data.handle,
      image: socket.data.image,
    });

    if (result.ok) {
      socket.join(result.room.roomId);
      socket.data.roomId = result.room.roomId;
      await safePersist(result.room);
      io.to(result.room.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:leave", async (request, ack) => {
    const result = roomRegistry.leaveRoom(request.roomId, socket.data.userId);

    if (result.ok) {
      socket.leave(request.roomId);
      socket.data.roomId = null;
      await safePersist(
        result.room,
        result.room.players.length === 0
          ? {
              completionReason: MatchCompletionReason.EMPTY_ROOM,
              forceStatus: MatchStatus.CANCELLED,
            }
          : undefined,
      );
      io.to(request.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:get", (request, ack) => {
    ack(roomRegistry.getRoom(request.roomId));
  });

  socket.on("room:start", async (request, ack) => {
    const result = roomRegistry.startMatch(request.roomId, socket.data.userId);

    if (result.ok) {
      await safePersist(result.room);
      io.to(request.roomId).emit("room:updated", result.room);
      scheduleRoomRefresh(request.roomId, result.room.countdownDurationMs + 50);
      scheduleRoomRefresh(
        request.roomId,
        result.room.countdownDurationMs + result.room.matchConfig.durationMs + 100,
      );
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("room:move", (request, ack) => {
    const result = roomRegistry.submitMove(
      request.roomId,
      socket.data.userId,
      request.selectionBox,
    );

    if (result.ok) {
      io.to(request.roomId).emit("room:updated", result.room);
    } else {
      socket.emit("room:error", result.error);
    }

    ack(result);
  });

  socket.on("disconnect", async () => {
    const room = roomRegistry.disconnectSession(socket.data.userId, socket.id, socket.data.roomId);

    if (room) {
      await safePersist(
        room,
        room.players.length === 0
          ? {
              completionReason: MatchCompletionReason.EMPTY_ROOM,
              forceStatus: MatchStatus.CANCELLED,
            }
          : undefined,
      );
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
    void refreshRoom(roomId);
  }, Math.max(0, delayMs));
}

async function refreshRoom(roomId: string) {
  const result = roomRegistry.getRoom(roomId);

  if (result.ok) {
    await safePersist(result.room);
    io.to(roomId).emit("room:updated", result.room);
  }
}

async function safePersist(
  room: import("../lib/multiplayer").RoomSnapshot,
  options?: {
    completionReason?: MatchCompletionReason;
    forceStatus?: MatchStatus;
  },
) {
  try {
    await persistRoomSnapshot(room, options);
  } catch (error) {
    console.error("[fruitbox-realtime] failed to persist room snapshot", error);
  }
}
