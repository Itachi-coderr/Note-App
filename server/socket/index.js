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
    socket.on('join-document', async ({ documentId, userId, username }) => {
      socket.join(documentId);
      
      if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Set());
      }
      documentUsers.get(documentId).add(userId);

      // Notify others in the room about the new user
      socket.to(documentId).emit('user-joined', {
        userId,
        username,
      });

      // Send the list of active users in the document to the new user
      const users = Array.from(documentUsers.get(documentId)).map((id) => ({
        userId: id,
        username: getUsernameByUserId(id),
      }));
      io.to(socket.id).emit('document-users', users);
    });

    // Handle document changes
    socket.on('document-change', async ({ documentId, changes, version }) => {
      try {
        // Save changes to the database
        await Note.findByIdAndUpdate(documentId, {
          content: changes.content,
          $push: {
            versions: {
              content: changes.content,
              modifiedBy: userId,
            },
          },
        });

        // Broadcast changes to other users in the document
        socket.to(documentId).emit('document-changed', {
          changes,
          userId,
          username, // Include the username of the editor
          version,
        });
      } catch (error) {
        console.error('Error saving document changes:', error);
        socket.emit('document-error', { message: 'Failed to save changes' });
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

    socket.on('get-document', async ({ documentId }) => {
      try {
        const document = await Note.findById(documentId);
        if (!document) {
          return socket.emit('document-error', { message: 'Document not found' });
        }
    
        // Send the document to the client
        socket.emit('load-document', {
          title: document.title,
          content: document.content,
          version: document.versions.length || 0,
        });
      } catch (error) {
        console.error('Error fetching document:', error);
        socket.emit('document-error', { message: 'Failed to load document' });
      }
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