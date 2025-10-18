import React, { createContext, useContext, useState, useCallback } from "react";

interface UnreadNotificationContextType {
  count: number;
  setCount: (count: number) => void;
  refresh: () => Promise<void>;
}

const UnreadNotificationContext = createContext<
  UnreadNotificationContextType | undefined
>(undefined);

export const useUnreadNotificationContext = () => {
  const context = useContext(UnreadNotificationContext);
  if (!context) {
    throw new Error(
      "useUnreadNotificationContext must be used within UnreadNotificationProvider"
    );
  }
  return context;
};

export const UnreadNotificationProvider: React.FC<{
  userId: string;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const [count, setCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/OEM/Alert/count/get/${userId}`
      );
      const data = await response.json();
      const countValue = data?.data?.[0]?.Count ?? 0;
      setCount(countValue);
    } catch {
      setCount(0);
    }
  }, [userId]);

  React.useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  return (
    <UnreadNotificationContext.Provider value={{ count, setCount, refresh }}>
      {children}
    </UnreadNotificationContext.Provider>
  );
};
