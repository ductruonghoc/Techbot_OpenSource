// components/ChatList.tsx
'use client'; // If using Next.js App Router, this should be a client component

import React, { useRef, useCallback, useEffect } from 'react';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import MessageItem from './item';

interface Message {
    id: string;
    content: string;
    sender: "user" | "ai";
    timestamp: string;
    images_ids?: number[];
}

interface ChatListProps {
    messages: Message[];
    formatTime: (timestamp: string) => string;
    onCopyMessage: (content: string) => void;
    onSaveNote: (message: Message) => void;
    markdownComponents?: any;
}

const GAP = 25;
const ESTIMATED_HEIGHT = 100;

const ChatList: React.FC<ChatListProps> = ({
    messages,
    formatTime,
    onCopyMessage,
    onSaveNote,
    markdownComponents = {},
}) => {
    const listRef = useRef<VariableSizeList>(null);
    const itemHeights = useRef(new Map<number, number>());
    const prevMessagesLength = useRef(messages.length);
    const scrollOffsetRef = useRef(0);

    // Only scroll to bottom when a new message is added
    useEffect(() => {
        // Reset heights when messages change
        listRef.current?.resetAfterIndex(0);
        // Only scroll if a new message is appended
        if (
            listRef.current &&
            messages.length > 0 &&
            messages.length > prevMessagesLength.current
        ) {
            // Use setTimeout to ensure scroll happens after render
            setTimeout(() => {
                listRef.current?.scrollToItem(messages.length - 1, 'end');
            }, 10);
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);
    // Callback to update item height
    const handleItemHeight = useCallback((index: number, height: number) => {
        if (itemHeights.current.get(index) !== height) {
            itemHeights.current.set(index, height);
            listRef.current?.resetAfterIndex(index);
        }
    }, []);

    const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
        if (scrollOffset > scrollOffsetRef.current) {
            // Scrolling down, recalculate heights from the first visible item
            const list = listRef.current;
            if (list) {
                const startIndex = Math.floor(scrollOffset / ESTIMATED_HEIGHT);
                list.resetAfterIndex(startIndex);
            }
        }
        // Update the previous scroll offset
        scrollOffsetRef.current = scrollOffset;
    };

    // Memoized row renderer
    const Row = useCallback(
        ({ index, style }: ListChildComponentProps) => {
            const message = messages[index];
            if (!message) return null;

            return (
                <div style={style}>
                    <MessageItem
                        message={message}
                        formatTime={formatTime}
                        onCopyMessage={onCopyMessage}
                        onSaveNote={onSaveNote}
                        components={markdownComponents}
                        onHeight={(height: number) => handleItemHeight(index, height)}
                    />
                </div>
            );
        },
        [messages, formatTime, onCopyMessage, onSaveNote, markdownComponents, handleItemHeight]
    );

    // Estimate item size
    const getItemSize = useCallback((index: number) => {
        const bubbleHeight = itemHeights.current.get(index);
        return (bubbleHeight ?? ESTIMATED_HEIGHT) + GAP;
    }, []);

    return (
        <div style={{ flex: '1 1 auto', height: '100%', padding: 10 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <VariableSizeList
                        height={height}
                        width={width}
                        itemCount={messages.length}
                        itemSize={getItemSize}
                        ref={listRef}
                        onScroll={handleScroll} // Add this prop
                    >
                        {Row}
                    </VariableSizeList>
                )}
            </AutoSizer>
        </div>
    );
};

export default ChatList;