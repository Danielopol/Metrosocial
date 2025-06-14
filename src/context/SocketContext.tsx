import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Socket URL - Dynamic based on current host
const getSocketUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  } else {
    // Use the same IP as the frontend but port 5000 for backend
    return `http://${hostname}:5000`;
  }
};

const SOCKET_URL = getSocketUrl();

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.user && authState.token) {
      console.log('Connecting to Socket.IO server...');
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: authState.token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setIsConnected(true);
        // Join user-specific room
        newSocket.emit('join', authState.user!.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up Socket.IO connection');
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.user, authState.token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 