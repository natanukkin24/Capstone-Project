// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');

//Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes')
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require("./routes/classRoutes");
const quizRoutes = require("./routes/quizRoutes");
dotenv.config();
//Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
// Increase body size limit to 10MB for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});


//Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes)
app.use('/api/students', studentRoutes);
app.use("/api/classes", classRoutes);
app.use('/api/quiz', quizRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.userRole})`);

  // Join quiz room
  socket.on('join-quiz', ({ quizId }) => {
    socket.join(`quiz-${quizId}`);
    console.log(`User ${socket.userId} joined quiz room: ${quizId}`);
    
    // Notify others in the room
    socket.to(`quiz-${quizId}`).emit('player-joined', {
      userId: socket.userId,
      userRole: socket.userRole
    });
  });

  // Leave quiz room
  socket.on('leave-quiz', ({ quizId }) => {
    socket.leave(`quiz-${quizId}`);
    console.log(`User ${socket.userId} left quiz room: ${quizId}`);
    
    // Notify others in the room
    socket.to(`quiz-${quizId}`).emit('player-left', {
      userId: socket.userId
    });
  });

  // Player move in game
  socket.on('player-move', (data) => {
    const { quizId, position, direction, facingDirection, currentFrame } = data;
    socket.to(`quiz-${quizId}`).emit('player-moved', {
      userId: socket.userId,
      position,
      direction,
      facingDirection,
      currentFrame
    });
  });

  // Answer question
  socket.on('answer-question', (data) => {
    const { quizId, questionId, answer, isCorrect } = data;
    io.to(`quiz-${quizId}`).emit('answer-submitted', {
      userId: socket.userId,
      questionId,
      answer,
      isCorrect
    });
  });

  // Game state update
  socket.on('game-state', (data) => {
    const { quizId, gameState } = data;
    
    // If teacher starts the game, notify all players
    if (gameState.status === 'started' && socket.userRole === 'teacher') {
      io.to(`quiz-${quizId}`).emit('game-started', {
        quizId,
        startedBy: socket.userId
      });
    } else {
      socket.to(`quiz-${quizId}`).emit('game-state-updated', {
        gameState,
        updatedBy: socket.userId
      });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.userId}`);
    
    // If student disconnects, remove them from all lobbies they're in
    if (socket.userRole === 'student') {
      try {
        const Lobby = require('./models/Lobby');
        const lobbies = await Lobby.find({ 
          'players.studentId': socket.userId 
        });
        
        for (const lobby of lobbies) {
          // Only remove if lobby is still waiting (not in progress)
          if (lobby.status === 'waiting') {
            lobby.players = lobby.players.filter(
              p => p.studentId.toString() !== socket.userId
            );
            
            // If no players left, delete the lobby
            if (lobby.players.length === 0) {
              await Lobby.findByIdAndDelete(lobby._id);
              io.to(`quiz-${lobby.quizId}`).emit('player-left-lobby', {
                quizId: lobby.quizId.toString(),
                studentId: socket.userId.toString(),
                playerCount: 0
              });
            } else {
              await lobby.save();
              io.to(`quiz-${lobby.quizId}`).emit('player-left-lobby', {
                quizId: lobby.quizId.toString(),
                studentId: socket.userId.toString(),
                playerCount: lobby.players.length
              });
            }
          }
        }
      } catch (error) {
        console.error('Error cleaning up student from lobbies on disconnect:', error);
      }
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
  console.log(`WebSocket server initialized`);
});

// Export io instance for use in controllers
module.exports.io = io;
module.exports.server = server;
