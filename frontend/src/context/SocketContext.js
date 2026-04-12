import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SocketContext = createContext(null);

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
  const [notifications, setNotifications] = useState([]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available for socket connection');
      return null;
    }

    // Get the socket URL - replace http with ws for WebSocket
    const socketUrl = BACKEND_URL.replace(/^http/, 'ws');
    
    const newSocket = io(BACKEND_URL, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('notification', (data) => {
      console.log('Received notification:', data);
      setNotifications(prev => [data, ...prev]);
      
      // Dispatch custom event for notification handling
      window.dispatchEvent(new CustomEvent('socket-notification', { detail: data }));
    });

    newSocket.on('new_message', (data) => {
      console.log('Received new message:', data);
      window.dispatchEvent(new CustomEvent('new-message', { detail: data }));
    });

    newSocket.on('user_typing', (data) => {
      console.log('User typing:', data);
      window.dispatchEvent(new CustomEvent('user-typing', { detail: data }));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);
    return newSocket;
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const joinChat = useCallback((chatId) => {
    if (socket && isConnected) {
      socket.emit('join_chat', { chat_id: chatId });
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId) => {
    if (socket && isConnected) {
      socket.emit('leave_chat', { chat_id: chatId });
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId, text) => {
    if (socket && isConnected) {
      socket.emit('send_message', { chat_id: chatId, text });
    }
  }, [socket, isConnected]);

  const sendTypingIndicator = useCallback((chatId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { chat_id: chatId, is_typing: isTyping });
    }
  }, [socket, isConnected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    // Auto-connect when token is available
    const token = localStorage.getItem('token');
    if (token && !socket) {
      connect();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    connect,
    disconnect,
    joinChat,
    leaveChat,
    sendMessage,
    sendTypingIndicator,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
