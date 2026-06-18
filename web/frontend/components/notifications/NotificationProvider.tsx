"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NotificationService from '@/services/notificationService';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.access) {
      // Set the auth token for notification service
      NotificationService.setAuthToken(session.access);
    } else {
      // Remove auth token if no session
      NotificationService.removeAuthToken();
    }
  }, [session?.access]);

  return <>{children}</>;
};
