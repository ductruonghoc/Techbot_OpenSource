// Inside page.tsx, or better, create a separate file like MessageItem.tsx
// MessageItem.tsx
import React, { useRef, useEffect } from "react";
import { User, Bot, Copy, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import MessageImageSlider from "@/components/slider/messege"; // Adjust path

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
  images_ids?: number[];
}

interface MessageItemProps {
  message: Message;
  formatTime: (timestamp: string) => string;
  onCopyMessage: (content: string) => void;
  onSaveNote: (message: Message) => void;
  components: any;
  onHeight?: (height: number) => void; // Add this prop
}

const MessageItem: React.FC<MessageItemProps> = React.memo(
  ({ message, formatTime, onCopyMessage, onSaveNote, components, onHeight }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (itemRef.current && onHeight) {
        onHeight(itemRef.current.offsetHeight);
      }
    }, [message, components, onHeight]);

    return (
      <div
        ref={itemRef}
        key={message.id}
        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
          }`}
      >
        <div
          className={`flex max-w-[700px] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
        >
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${message.sender === "user" ? "ml-3 bg-[#4045ef]" : `mr-3 bg-gray-200`
              }`}
          >
            {message.sender === "user" ? (
              <User className="h-5 w-5 text-white" />
            ) : (
              <Bot className="h-5 w-5 text-[#4045ef]" />
            )}
          </div>
          <div className="flex flex-col max-w-[700px]">
            <div
              className={`rounded-[10px] px-4 py-3 ${message.sender === "user"
                  ? "bg-[#4045ef] text-white"
                  : "bg-white text-[#2e3139] border border-gray-200"
                }`}
            >
              <div className="text-sm whitespace-pre-line break-words break-all max-w-[100%]">
                <ReactMarkdown components={components}>
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.images_ids && message.images_ids.length > 0 && (
                <MessageImageSlider images_ids={message.images_ids} />
              )}
              <div
                className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-[#2e3139]/70"
                  }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
            {message.sender === "ai" && (
              <div className="flex mt-2 space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#4045ef]"
                  onClick={() => onSaveNote(message)}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save as note</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#4045ef]"
                  onClick={() => onCopyMessage(message.content)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default MessageItem;