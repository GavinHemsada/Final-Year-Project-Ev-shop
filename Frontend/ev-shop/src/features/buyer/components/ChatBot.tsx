import React, { useState, useRef, useEffect } from "react";
import { CloseIcon, SendIcon } from "@/assets/icons/icons";
import type { ChatMessage } from "@/types";
import { buyerService } from "../buyerService";

// Define the props interface for the Chatbot component
type ChatbotProps = {
  onClose: () => void; // Function to call when the chatbot needs to be closed
};

// Chatbot functional component definition
export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  // State to manage the input field's value
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  // Ref to automatically scroll to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll the chat messages to the bottom
  const scrollToBottom = () => {
    // Scrolls the element referenced by messagesEndRef into view with a smooth animation
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect hook to scroll to the bottom whenever the messages array updates
  useEffect(scrollToBottom, [messages, isThinking]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      text,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsThinking(true);

    try {
      const respons = await buyerService.sendMessageToChatbot(text);
      console.log(respons);
      const botResponse: ChatMessage = {
        id: Date.now() + 1,
        text: respons,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorResponse: ChatMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for form submission (sending a message)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    // Check if the input value is not empty after trimming whitespace
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim()); // Call the onSendMessage prop with the trimmed input
    }
  };

  return (
    // Main container for the chatbot, positioned fixed at the bottom right
    <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-white rounded-xl shadow-2xl flex flex-col z-40 animate-slideInUp dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      {/* Chatbot header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-xl dark:bg-blue-700">
        <h3 className="font-bold text-lg">EV-Shop Assistant</h3>
        {/* Close button for the chatbot */}
        <button
          onClick={onClose}
          className="hover:bg-blue-700 p-1 rounded-full dark:hover:bg-blue-600"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Chat messages display area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Map through messages and render each one */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Bot avatar, displayed only for bot messages */}
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  E
                </div>
              )}
              {/* Message bubble */}
              <div
                className={`max-w-[80%] p-3 rounded-2xl animate-popIn ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {/* Thinking indicator */}
          {isThinking && (
             <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 animate-bounce">
                  E
                </div>
                <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-3 animate-pulse dark:bg-gray-700 dark:text-gray-200">
                  <p className="text-sm">Thinking...</p>
                </div>
             </div>
          )}
          {/* Empty div used as a reference point for scrolling to the bottom */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat input footer */}
      <footer className="p-2 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          {/* Send message button */}
          <button
            type="submit"
            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};
