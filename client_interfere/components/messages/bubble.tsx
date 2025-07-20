// components/MessageBubble.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'other';
    timestamp: string;
    // Add other properties like image, etc.
  };
  style?: React.CSSProperties; // style prop from react-window
  onHeightChange?: (id: string, height: number) => void;
}

// Use forwardRef to allow parent to access the DOM element for measurement
const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, style, onHeightChange }, ref) => {
    const bubbleRef = useRef<HTMLDivElement>(null);

    // Expose the internal ref to the parent component
    useImperativeHandle(ref, () => bubbleRef.current!);

    useEffect(() => {
      if (bubbleRef.current && onHeightChange) {
        // Measure the actual height of the bubble after rendering
        const newHeight = bubbleRef.current.offsetHeight;
        onHeightChange(message.id, newHeight);
      }
    }, [message.text, message.id, onHeightChange]); // Re-measure if text changes

    const isUser = message.sender === 'user';

    return (
      <div
        ref={bubbleRef}
        style={{
          ...style, // react-window applies position, top, left, width, height here
          padding: '10px',
          backgroundColor: isUser ? '#DCF8C6' : '#E0E0E0',
          borderRadius: '10px',
          maxWidth: '70%',
          wordWrap: 'break-word',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          marginBottom: '50px', // This is where you add your fixed gap
          display: 'flex', // To make alignSelf work
          flexDirection: 'column', // For content within the bubble
        }}
      >
        <p style={{ margin: 0 }}>{message.text}</p>
        <span style={{ fontSize: '0.7em', color: '#666', textAlign: isUser ? 'right' : 'left' }}>
          {message.timestamp}
        </span>
        {/* Add logic for images or other dynamic content here */}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble'; // Good practice for forwardRef

export default MessageBubble;