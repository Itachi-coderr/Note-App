import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Create socket connection with optimized settings
      const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          userId: user._id,
          username: user.name || user.email
        },
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket'],
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        pingInterval: 25000,
        pingTimeout: 20000
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Attempt to reconnect with websocket only
        socketInstance.io.opts.transports = ['websocket'];
      });

      // Set socket instance
      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    }
  }, [user]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 