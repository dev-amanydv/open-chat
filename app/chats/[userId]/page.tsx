"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useRef, useCallback, useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import {
  RiEmojiStickerLine,
  RiCheckDoubleFill,
  RiCheckFill,
} from "react-icons/ri";
import { Id } from "@/convex/_generated/dataModel";
import ChatPageSkeleton from "@/components/skeletons/ChatPageSkeleton";
import TypingIndicator from "@/components/TypingIndicator";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

const MAX_TEXTAREA_HEIGHT = 150;

export default function ChatPage() {
  const params = useParams();
  const userId = params.userId as Id<"users">;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const currentUser = useQuery(api.chats.getCurrentUser);
  const conversation = useQuery(api.chats.getConversationByUsers, {
    otherUserId: userId,
  });
  const messages = useQuery(
    api.chats.getMessagesByConversation,
    conversation ? { conversationId: conversation._id } : "skip",
  );
  const getOrCreateConversation = useMutation(
    api.chats.getOrCreateConversation,
  );
  const sendMessage = useMutation(api.chats.sendMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const markAsSeen = useMutation(api.chats.markAsSeen);

  useEffect(() => {
    if (!conversation) return;
    markAsSeen({ conversationId: conversation._id });
  }, [conversation, messages, markAsSeen]);
  const otherUserLastTyped = useQuery(
    api.typing.getTypingStatus,
    conversation
      ? { conversationId: conversation._id, otherUserId: userId }
      : "skip",
  );

  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!otherUserLastTyped) {
      setIsOtherUserTyping(false);
      return;
    }
    setIsOtherUserTyping(Date.now() - otherUserLastTyped < 3000);
    const interval = setInterval(() => {
      setIsOtherUserTyping(Date.now() - otherUserLastTyped < 3000);
    }, 1000);
    return () => clearInterval(interval);
  }, [otherUserLastTyped]);

  const lastTypingSent = useRef(0);
  const handleTyping = useCallback(() => {
    if (!conversation) return;
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      setTyping({ conversationId: conversation._id });
    }
  }, [conversation, setTyping]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY =
      ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content) return;

    let convoId: Id<"conversations">;
    if (conversation) {
      convoId = conversation._id;
    } else {
      convoId = await getOrCreateConversation({ otherUserId: userId });
    }

    await sendMessage({ conversationId: convoId, content });
    setMessageText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (conversation === undefined) {
    return <ChatPageSkeleton />;
  }

  return (
    <div className="h-full relative flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col gap-0 relative">
        <div className="h-full absolute -z-10 inset-0 w-full bg-[#fafafa] text-gray-900">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `
            repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px)
          `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 w-full py-3">
          {!messages || messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-400 text-sm italic">
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender === currentUser?._id;
              return (
                <div
                  key={message._id}
                  className={`backdrop-blur-sm flex flex-col ${
                    isMe
                      ? "self-end rounded-bl-lg bg-[#357578] text-white"
                      : "rounded-br-lg"
                  } w-fit max-w-[70%] px-4 py-1 rounded-tl-lg rounded-tr-lg`}
                >
                  <h1>{message.content}</h1>
                  <div className="flex items-center gap-1 self-end">
                    <p
                      className={`text-xs ${
                        isMe ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {new Date(message._creationTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isMe &&
                      (message.status === "sent" ? (
                        <RiCheckFill className="text-xs text-slate-300" />
                      ) : (
                        <RiCheckDoubleFill
                          className={`text-xs ${
                            message.status === "seen"
                              ? "text-blue-300"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                  </div>
                </div>
              );
            })
          )}
          {isOtherUserTyping && (
            <div className="transition-opacity duration-300 ease-in-out">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>
      <div className="min-h-14 flex-none px-3 w-full gap-3 border-[#ECECEE] border-t flex items-center bg-[#FAFAFB]">
        <div className="">
          <FiPlus className="size-5" />
        </div>
        <div className="w-full flex py-2 relative items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full border pr-7 h-9 focus:outline-0 border-neutral-300 px-2 bg-white py-1 rounded-xl resize-none overflow-hidden"
          />
          <RiEmojiStickerLine
            className="absolute size-5 right-1 bottom-3.5 cursor-pointer hover:text-neutral-600 text-neutral-400 transition-colors"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          />
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 right-0 z-50"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={320}
                height={400}
                searchPlaceholder="Search emoji..."
              />
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          className="size-8 flex-none bg-[#357578] flex justify-center items-center rounded-full"
        >
          <IoSend className="text-white" />
        </button>
      </div>
    </div>
  );
}
