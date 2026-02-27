"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useRef, useCallback, useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiCopy,
  FiFileText,
  FiX,
  FiCheck,
  FiMoreVertical,
} from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import {
  RiEmojiStickerLine,
  RiCheckDoubleFill,
  RiCheckFill,
} from "react-icons/ri";
import { Id, Doc } from "@/convex/_generated/dataModel";
import ChatPageSkeleton from "@/components/skeletons/ChatPageSkeleton";
import TypingIndicator from "@/components/TypingIndicator";
import { EmojiClickData } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { useLongPress } from "@/hooks/useLongPress";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

const MAX_TEXTAREA_HEIGHT = 150;
const SCROLL_BOTTOM_THRESHOLD = 96;
const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢"] as const;

const MessageItem = ({
  message,
  currentUser,
  isSelected,
  selectionMode,
  onToggleSelect,
  onContextMenuOpen,
  onToggleReaction,
  isGroup,
}: {
  message: Doc<"messages"> & { senderName?: string; senderImage?: string };
  currentUser: Doc<"users"> | null;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onContextMenuOpen: (
    e: React.MouseEvent | React.TouchEvent,
    messageId: Id<"messages">,
    content: string,
    coords?: { x: number; y: number },
    showReactions?: boolean,
  ) => void;
  onToggleReaction: (messageId: Id<"messages">, emoji: string) => void;
  isGroup?: boolean;
}) => {
  const isMe = message.sender === currentUser?._id;
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const reactionAnimationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (reactionAnimationTimeoutRef.current) {
        window.clearTimeout(reactionAnimationTimeoutRef.current);
      }
    };
  }, []);

  const handlers = useLongPress(
    (e, coords) => {
      if (!message.isDeleted) {
        onContextMenuOpen(
          e,
          message._id,
          message.content,
          coords,
          "touches" in e || e.type.startsWith("touch"),
        );
      }
    },
    () => {
      if (selectionMode && !message.isDeleted) {
        onToggleSelect();
      }
    },
  );

  const handleReaction = useCallback(
    (emoji: string) => {
      if (message.isDeleted) return;
      onToggleReaction(message._id, emoji);
      setActiveReaction(emoji);
      if (reactionAnimationTimeoutRef.current) {
        window.clearTimeout(reactionAnimationTimeoutRef.current);
      }
      reactionAnimationTimeoutRef.current = window.setTimeout(() => {
        setActiveReaction(null);
      }, 260);
    },
    [message._id, message.isDeleted, onToggleReaction],
  );

  const currentUserReaction =
    message.reactions?.find(
      (reaction) => currentUser?._id && reaction.users.includes(currentUser._id),
    )?.emoji ?? null;

  const quickReactionBar = (
    <div className="chat-reaction-tray">
      {REACTION_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className={`chat-reaction-btn ${currentUserReaction === emoji ? "chat-reaction-btn-selected" : ""} ${
            activeReaction === emoji ? "chat-reaction-btn-active" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={`flex items-start gap-2 w-full group ${isMe ? "justify-end" : "justify-start"}`}
    >
      {selectionMode && (
        <div
          onClick={() => {
            if (!message.isDeleted) onToggleSelect();
          }}
          className={`size-5 rounded flex items-center justify-center cursor-pointer flex-none transition-colors
            ${isSelected ? "bg-zinc-800 dark:bg-blue-600 border border-zinc-800 dark:border-blue-600" : "border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"}`}
        >
          {isSelected && <FiCheck className="text-white text-sm" />}
        </div>
      )}

      {!selectionMode && isMe && !message.isDeleted && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 md:flex hidden">
          {quickReactionBar}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenuOpen(e, message._id, message.content, undefined, false);
            }}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full text-neutral-500 dark:text-neutral-400"
          >
            <FiMoreVertical className="text-lg" />
          </button>
        </div>
      )}

      <div
        className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%]`}
      >
        <div
          {...handlers}
          style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          className={`chat-bubble relative flex flex-col select-none ${
            isMe
              ? "self-end rounded-[18px] rounded-br-md bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-blue-500 dark:to-blue-700 text-white shadow-[0_8px_20px_rgba(15,23,42,0.28)]"
              : "rounded-[18px] rounded-bl-md bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] text-zinc-900 dark:text-zinc-100"
          } w-fit max-w-full px-3.5 py-2 cursor-pointer transition-all duration-200 ${
            isSelected
              ? "opacity-95 scale-[0.98] ring-2 ring-zinc-400 dark:ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900"
              : "hover:-translate-y-[1px]"
          }`}
        >
          {!isMe && isGroup && message.senderName && (
            <span className="text-[11px] font-semibold tracking-wide text-blue-600 mb-0.5">
              {message.senderName}
            </span>
          )}
          {message.isDeleted ? (
            <p className="italic text-neutral-400 opacity-80 flex items-center gap-1.5">
              <FiTrash2 className="text-[13px]" /> This message was deleted
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          <div className="flex items-center gap-1 self-end mt-2">
            <p
              className={`text-[10px] ${
                isMe ? "text-slate-300" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {isMe &&
              (message.status === "sent" ? (
                <RiCheckFill className="text-[12px] text-slate-300" />
              ) : (
                <RiCheckDoubleFill
                  className={`text-[12px] ${
                    message.status === "seen"
                      ? "text-blue-300"
                      : "text-slate-300"
                  }`}
                />
              ))}
          </div>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`mt-1.5 flex w-full flex-wrap gap-1 ${isMe ? "justify-end pr-1" : "justify-start pl-1"}`}
          >
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={`chat-reaction-pill flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border ${
                  currentUser?._id && r.users.includes(currentUser._id)
                    ? "chat-reaction-pill-active chat-reaction-pill-selected"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shadow-sm"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="font-medium">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectionMode && !isMe && !message.isDeleted && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 md:flex hidden">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenuOpen(e, message._id, message.content, undefined, false);
            }}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full text-neutral-500 dark:text-neutral-400"
          >
            <FiMoreVertical className="text-lg" />
          </button>
          {quickReactionBar}
        </div>
      )}
    </div>
  );
};

export default function ChatPage() {
  const params = useParams();
  const chatTargetId = params.userId as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [selectedMessages, setSelectedMessages] = useState<Set<Id<"messages">>>(
    new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{
    messageId: Id<"messages">;
    content: string;
    x: number;
    y: number;
    showReactions: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [summaryData, setSummaryData] = useState<{
    text: string | null;
    isLoading: boolean;
    isOpen: boolean;
  }>({ text: null, isLoading: false, isOpen: false });

  const [pendingMessage, setPendingMessage] = useState<{
    content: string;
    error: boolean;
  } | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnseenMessages, setHasUnseenMessages] = useState(false);
  const previousMessageCountRef = useRef(0);
  const previousPendingMessageRef = useRef(false);
  const hasInitializedScrollRef = useRef(false);

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

  const currentUser = useQuery(api.chats.getCurrentUser) ?? null;
  const chatHeaderInfo = useQuery(api.chats.getChatHeaderInfo, {
    id: chatTargetId,
  });
  const resolvedConversationId = useQuery(api.chats.resolveConversationId, {
    id: chatTargetId,
  });
  const isGroupChat = chatHeaderInfo?.isGroup === true;
  const conversation = useQuery(
    api.chats.getConversationByUsers,
    chatHeaderInfo && !isGroupChat
      ? { otherUserId: chatTargetId as Id<"users"> }
      : "skip",
  );
  const activeConversationId = conversation?._id ?? resolvedConversationId;
  const messages = useQuery(
    api.chats.getMessagesByConversation,
    activeConversationId ? { conversationId: activeConversationId } : "skip",
  );
  const getOrCreateConversation = useMutation(
    api.chats.getOrCreateConversation,
  );
  const sendMessage = useMutation(api.chats.sendMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const markAsSeen = useMutation(api.chats.markAsSeen);
  const deleteMessages = useMutation(api.chats.deleteMessages);
  const toggleReaction = useMutation(api.chats.toggleReaction);

  const handleToggleReaction = useCallback(
    (messageId: Id<"messages">, emoji: string) => {
      toggleReaction({ messageId, emoji });
    },
    [toggleReaction],
  );

  useEffect(() => {
    if (!activeConversationId) return;
    markAsSeen({ conversationId: activeConversationId });
  }, [activeConversationId, messages, markAsSeen]);

  const otherUserLastTyped = useQuery(
    api.typing.getTypingStatus,
    activeConversationId && chatHeaderInfo && !isGroupChat
      ? {
          conversationId: activeConversationId,
          otherUserId: chatTargetId as Id<"users">,
        }
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
    if (!activeConversationId || isGroupChat) return;
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      setTyping({ conversationId: activeConversationId });
    }
  }, [activeConversationId, isGroupChat, setTyping]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY =
      ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const checkIsAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    setIsAtBottom(true);
    setHasUnseenMessages(false);
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const atBottom = checkIsAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasUnseenMessages(false);
    }
  }, [checkIsAtBottom]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
    previousMessageCountRef.current = 0;
    previousPendingMessageRef.current = false;
    setIsAtBottom(true);
    setHasUnseenMessages(false);
  }, [chatTargetId]);

  useEffect(() => {
    if (messages === undefined && !pendingMessage) return;

    const currentMessageCount = messages?.length ?? 0;
    const hasPendingMessage = Boolean(pendingMessage);

    if (!hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      previousMessageCountRef.current = currentMessageCount;
      previousPendingMessageRef.current = hasPendingMessage;

      if (currentMessageCount > 0 || hasPendingMessage) {
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
      return;
    }

    const hasNewMessage = currentMessageCount > previousMessageCountRef.current;
    const hasNewPendingMessage =
      hasPendingMessage && !previousPendingMessageRef.current;

    previousMessageCountRef.current = currentMessageCount;
    previousPendingMessageRef.current = hasPendingMessage;

    if (!hasNewMessage && !hasNewPendingMessage) return;

    if (checkIsAtBottom()) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
      return;
    }

    setHasUnseenMessages(true);
  }, [messages, pendingMessage, checkIsAtBottom, scrollToBottom]);

  const handleSend = async (retryContent?: string | React.MouseEvent) => {
    const isRetryString = typeof retryContent === "string";
    const content = isRetryString ? retryContent : messageText.trim();
    if (!content) return;
    if (!activeConversationId && !chatHeaderInfo) return;

    if (!isRetryString) {
      setMessageText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }

    setPendingMessage({ content, error: false });

    try {
      let convoId: Id<"conversations">;
      if (activeConversationId) {
        convoId = activeConversationId;
      } else {
        if (!chatHeaderInfo || chatHeaderInfo.isGroup) return;
        convoId = await getOrCreateConversation({
          otherUserId: chatTargetId as Id<"users">,
        });
      }

      await sendMessage({ conversationId: convoId, content });
      setPendingMessage(null);
    } catch (error) {
      console.error(error);
      setPendingMessage({ content, error: true });
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSelect = useCallback((messageId: Id<"messages">) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set());
  }, []);

  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;
    try {
      await deleteMessages({ messageIds: Array.from(selectedMessages) });
      clearSelection();
      toast.success("Messages deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete messages");
    }
  };

  const openContextMenu = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      messageId: Id<"messages">,
      content: string,
      coords?: { x: number; y: number },
      showReactions?: boolean,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      let x = coords?.x ?? 0;
      let y = coords?.y ?? 0;

      if (!coords) {
        if ("touches" in e && e.touches.length > 0) {
          x = e.touches[0].clientX;
          y = e.touches[0].clientY;
        } else if ("clientX" in e) {
          x = (e as React.MouseEvent).clientX;
          y = (e as React.MouseEvent).clientY;
        } else {
          const target = (e.target as HTMLElement).getBoundingClientRect();
          x = target.left + target.width / 2;
          y = target.top + target.height / 2;
        }
      }
      setContextMenu({ messageId, content, x, y, showReactions: Boolean(showReactions) });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    if (contextMenu) setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClose = (e: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return; 
      }
      closeContextMenu();
    };

    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", handleClose);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handleClose);
    };
  }, [contextMenu, closeContextMenu]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setContextMenu(null);
    toast.success("Message copied!");
  };

  const handleSummarize = async (content: string) => {
    setContextMenu(null);
    setSummaryData({ text: null, isLoading: true, isOpen: true });
    try {
      const res = await fetch("/api/messages/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize");
      setSummaryData({ text: data.summary, isLoading: false, isOpen: true });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Error summarizing message.";
      setSummaryData({
        text: errorMessage,
        isLoading: false,
        isOpen: true,
      });
    }
  };

  const handleDeleteSingle = async (messageId: Id<"messages">) => {
    try {
      await deleteMessages({ messageIds: [messageId] });
      setContextMenu(null);
      toast.success("Message deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete message");
    }
  };

  const isConversationLoading =
    chatHeaderInfo === undefined ||
    resolvedConversationId === undefined ||
    (chatHeaderInfo && !isGroupChat && conversation === undefined);

  if (isConversationLoading) {
    return <ChatPageSkeleton />;
  }

  const selectionMode = selectedMessages.size > 0;
  const isMessagesLoading =
    Boolean(activeConversationId) && messages === undefined;
  const displayMessages = activeConversationId ? (messages ?? []) : [];
  const contextMenuMessage = contextMenu
    ? messages?.find((message) => message._id === contextMenu.messageId)
    : null;
  const currentContextReaction =
    contextMenuMessage?.reactions?.find(
      (reaction) =>
        currentUser?._id && reaction.users.includes(currentUser._id),
    )?.emoji ?? null;

  return (
    <div className="h-full relative flex flex-col overflow-hidden">
      {selectionMode && (
        <div className="absolute top-0 inset-x-0 h-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-20 flex items-center justify-between px-4 shadow-sm animate-in slide-in-from-top-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <FiX className="text-xl text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="font-semibold text-lg text-zinc-800 dark:text-zinc-200">
              {selectedMessages.size}
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
          >
            <FiTrash2 className="text-xl" />
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 w-56 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 origin-top-left"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 280)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
          }}
        >
          {contextMenu.showReactions && (
            <>
              <div className="px-1 pb-1">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 px-2">
                  React
                </div>
                <div className="chat-reaction-tray">
                  {REACTION_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleToggleReaction(contextMenu.messageId, emoji);
                        setContextMenu(null);
                      }}
                      className={`chat-reaction-btn ${currentContextReaction === emoji ? "chat-reaction-btn-selected" : ""}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-neutral-100 dark:bg-zinc-800 my-1 relative -mx-2" />
            </>
          )}
          <button
            onClick={() => handleCopy(contextMenu.content)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium"
          >
            <FiCopy className="text-neutral-500 dark:text-neutral-400" /> Copy
          </button>
          <button
            onClick={() => handleSummarize(contextMenu.content)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium text-blue-600 dark:text-blue-500"
          >
            <FiFileText /> Summarize
          </button>
          <button
            onClick={() => {
              handleToggleSelect(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium"
          >
            <FiCheck className="text-neutral-500 dark:text-neutral-400" />{" "}
            Select
          </button>

          {contextMenu.messageId &&
            contextMenuMessage?.sender === currentUser?._id && (
              <>
                <div className="h-px bg-neutral-100 dark:bg-zinc-800 my-1 relative -mx-2" />
                <button
                  onClick={() => handleDeleteSingle(contextMenu.messageId)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl transition-colors font-medium"
                >
                  <FiTrash2 className="text-red-500" /> Delete
                </button>
              </>
            )}
        </div>
      )}

      {summaryData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-3xl p-6 w-[90%] max-w-md shadow-2xl border border-white/50 dark:border-zinc-800/50 relative">
            <button
              onClick={() => setSummaryData((s) => ({ ...s, isOpen: false }))}
              className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400"
            >
              <FiX />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                <FiFileText className="text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                AI Summary
              </h2>
            </div>
            <div className="min-h-[100px] flex items-center justify-center text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              {summaryData.isLoading ? (
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <div className="size-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-sm text-neutral-500">
                    Summarizing message...
                  </p>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{summaryData.text}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-0 relative">
        <div className="h-full absolute -z-10 inset-0 w-full bg-zinc-50/50 dark:bg-[#0a0a0a]/50 text-zinc-900 dark:text-zinc-100">
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
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 w-full py-3"
        >
          {isMessagesLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="size-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-600 dark:border-t-zinc-500 rounded-full animate-spin" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Loading messages...
              </p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            displayMessages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                currentUser={currentUser}
                isSelected={selectedMessages.has(message._id)}
                selectionMode={selectionMode}
                onToggleSelect={() => handleToggleSelect(message._id)}
                onContextMenuOpen={openContextMenu}
                onToggleReaction={handleToggleReaction}
                isGroup={isGroupChat}
              />
            ))
          )}

          {pendingMessage && (
            <div className="flex items-center gap-2 w-full justify-end group">
              {pendingMessage.error && (
                <button
                  onClick={() => handleSend(pendingMessage.content)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded bg-red-50 transition-colors"
                >
                  Retry
                </button>
              )}
              <div
                className={`chat-bubble flex flex-col select-none self-end rounded-[18px] rounded-br-md bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-blue-500 dark:to-blue-700 text-white w-fit max-w-[78%] px-3.5 py-2 opacity-70 shadow-[0_8px_20px_rgba(15,23,42,0.28)]`}
              >
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                  {pendingMessage.content}
                </p>
                <div className="flex items-center gap-1 self-end mt-2">
                  <p className="text-[10px] text-slate-300">
                    {pendingMessage.error ? "Failed to send" : "Sending..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOtherUserTyping && (
            <div className="transition-opacity duration-300 ease-in-out">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>

      {hasUnseenMessages && !isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 rounded-full bg-zinc-900 text-white px-3.5 py-2 text-xs font-medium shadow-lg hover:bg-zinc-800 transition-colors"
        >
          ↓ New messages
        </button>
      )}

      <div className="min-h-14 flex-none px-3 w-full gap-3 border-zinc-200 dark:border-zinc-800 border-t flex items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 transition-colors">
        <div className="">
          <FiPlus className="size-5 text-neutral-600 dark:text-neutral-400" />
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
            className="w-full border pr-7 h-9 focus:outline-0 border-neutral-300 dark:border-zinc-700 px-2 bg-white dark:bg-zinc-800 dark:text-zinc-100 py-1 rounded-xl resize-none overflow-hidden text-[15px] shadow-sm transition-colors"
          />
          <RiEmojiStickerLine
            className="absolute size-5 right-1 bottom-3.5 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 text-neutral-400 dark:text-neutral-500 transition-colors"
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
          className="size-8 flex-none bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 transition-colors flex justify-center items-center rounded-full shadow-md"
        >
          <IoSend className="text-white ml-0.5" />
        </button>
      </div>
    </div>
  );
}
