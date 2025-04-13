const { Server } = require('socket.io');
const Note = require('../models/Note');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store active users and their document connections
  const activeUsers = new Map(); // userId -> socketId
  const documentUsers = new Map(); // documentId -> Set of userIds

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username;

    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`User connected: ${username} (${userId})`);
    }

    // Join document room
    socket.on('join-document', async ({ documentId }) => {
      socket.join(documentId);
      
      if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Set());
      }
      documentUsers.get(documentId).add(userId);

      // Notify others in the room about new user
      socket.to(documentId).emit('user-joined', {
        userId,
        username
      });

      // Send current users in document to the new user
      const users = Array.from(documentUsers.get(documentId)).map(id => ({
        userId: id,
        username: getUsernameByUserId(id)
      }));
      io.to(socket.id).emit('document-users', users);
    });

    // Handle document changes
    socket.on('document-change', async ({ documentId, changes, version }) => {
      try {
        // Save changes to database
        await Note.findByIdAndUpdate(documentId, {
          content: changes.content,
          $push: {
            versions: {
              content: changes.content,
              modifiedBy: userId
            }
          }
        });

        // Broadcast changes to other users in the document
        socket.to(documentId).emit('document-changed', {
          changes,
          userId,
          username,
          version
        });
      } catch (error) {
        console.error('Error saving document changes:', error);
        socket.emit('document-error', {
          message: 'Failed to save changes'
        });
      }
    });

    // Handle cursor position updates
    socket.on('cursor-move', ({ documentId, position }) => {
      socket.to(documentId).emit('cursor-moved', {
        userId,
        username,
        position
      });
    });

    // Handle document locking
    socket.on('lock-document', ({ documentId }) => {
      socket.to(documentId).emit('document-locked', {
        userId,
        username
      });
    });

    socket.on('unlock-document', ({ documentId }) => {
      socket.to(documentId).emit('document-unlocked', {
        userId,
        username
      });
    });

    // Leave document room
    socket.on('leave-document', ({ documentId }) => {
      socket.leave(documentId);
      if (documentUsers.has(documentId)) {
        documentUsers.get(documentId).delete(userId);
        if (documentUsers.get(documentId).size === 0) {
          documentUsers.delete(documentId);
        }
      }
      socket.to(documentId).emit('user-left', {
        userId,
        username
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (userId) {
        activeUsers.delete(userId);
        // Notify all documents where user was active
        documentUsers.forEach((users, documentId) => {
          if (users.has(userId)) {
            users.delete(userId);
            io.to(documentId).emit('user-left', {
              userId,
              username
            });
          }
        });
      }
      console.log(`User disconnected: ${username} (${userId})`);
    });
  });

  // Helper function to get username by userId
  const getUsernameByUserId = (userId) => {
    const socketId = activeUsers.get(userId);
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      return socket?.handshake.auth.username;
    }
    return null;
  };

  return io;
};

module.exports = setupSocket; 