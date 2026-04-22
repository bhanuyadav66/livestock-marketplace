const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "https://livestock-marketplace-six.vercel.app",
    methods: ["GET", "POST"],
  },
});

console.log("Socket server running on port 3001");

const users = {};
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  users[socket.id] = true;

  socket.on("userOnline", (userId) => {
    if (!userId) return;

    socket.userId = userId;
    onlineUsers[userId] = true;
    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("joinRoom", ({ listingId, buyerId }) => {
    const room = `${listingId}_${buyerId}`;
    socket.join(room);
  });

  socket.on("typing", ({ listingId, buyerId }) => {
    const room = `${listingId}_${buyerId}`;
    socket.to(room).emit("typing");
  });

  socket.on("stopTyping", ({ listingId, buyerId }) => {
    const room = `${listingId}_${buyerId}`;
    socket.to(room).emit("stopTyping");
  });

  socket.on("sendMessage", (data) => {
    const room = `${data.listingId}_${data.buyerId}`;
    io.to(room).emit("receiveMessage", data);
  });

  socket.on("markSeen", ({ listingId, buyerId }) => {
    const room = `${listingId}_${buyerId}`;
    socket.to(room).emit("seen");
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    if (socket.userId) {
      delete onlineUsers[socket.userId];
      io.emit("onlineUsers", onlineUsers);
    }

    console.log("User disconnected");
  });
});
