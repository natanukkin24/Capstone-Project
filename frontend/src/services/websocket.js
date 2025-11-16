// services/websocket.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(token, quizId = null) {
    if (this.socket && this.socket.connected) {
      console.log('Already connected to WebSocket.');
      if (quizId) {
        this.joinQuizRoom(quizId);
      }
      return;
    }

    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: {
        token: token,
      },
      query: {
        quizId: quizId, // Pass quizId in query for initial join if needed
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      if (quizId) {
        this.joinQuizRoom(quizId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  }

  joinQuizRoom(quizId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-quiz', { quizId });
    } else {
      console.warn('Socket not connected, cannot join quiz room.');
    }
  }

  leaveQuizRoom(quizId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-quiz', { quizId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners[event] = callback; // Store for easy removal
    }
  }

  off(event) {
    if (this.socket && this.listeners[event]) {
      this.socket.off(event, this.listeners[event]);
      delete this.listeners[event];
    }
  }

  sendPlayerMove(data) {
    if (this.socket) {
      this.socket.emit('player-move', data);
    }
  }

  sendAnswer(data) {
    if (this.socket) {
      this.socket.emit('answer-question', data);
    }
  }

  sendGameState(data) {
    if (this.socket) {
      this.socket.emit('game-state', data);
    }
  }

  getSocket() {
    return this.socket;
  }
}

const websocketService = new WebSocketService();
export default websocketService;

