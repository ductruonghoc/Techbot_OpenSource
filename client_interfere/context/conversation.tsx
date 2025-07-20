import React, { createContext, useContext, useState } from "react";

export interface Conversation {
  id: string;
  title: string;
  deviceName: string;
  timestamp: Date;
}

type ConversationsContextType = {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const ConversationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  return (
    <ConversationsContext.Provider value={{ conversations, setConversations }}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) throw new Error("useConversations must be used within a ConversationsProvider");
  return context;
};