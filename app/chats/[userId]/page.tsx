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
import { IoSend, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import {
  RiEmojiStickerLine,
  RiCheckDoubleFill,
  RiCheckFill,
} from "react-icons/ri";
import { HiOutlineSparkles } from "react-icons/hi2";
import { Id, Doc } from "@/convex/_generated/dataModel";
import ChatPageSkeleton from "@/components/skeletons/ChatPageSkeleton";
import TypingIndicator from "@/components/TypingIndicator";
import { EmojiClickData } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { useLongPress } from "@/hooks/useLongPress";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";

const suggestionsSchema = z.object({
  suggestions: z.array(z.string()).min(1).max(3),
});

function cleanSuggestion(raw: string): string {
  return raw
    .replace(/^\s*(me|you)\s*[:\-–—]\s*/i, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
}

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
  currentUser: { _id: Id<"users"> } | null;
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
          className={`size-5 rounded-md flex items-center justify-center cursor-pointer flex-none transition-colors
            ${isSelected ? "bg-accent border border-accent" : "border border-line-strong bg-surface-2"}`}
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
            className="oc-icon-btn oc-focus size-8 rounded-full"
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
          className={`chat-bubble oc-bubble relative flex flex-col select-none cursor-pointer ${
            isMe ? "oc-bubble-me self-end" : "oc-bubble-them"
          } ${
            isSelected
              ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
              : "hover:-translate-y-[1px]"
          }`}
        >
          {!isMe && isGroup && message.senderName && (
            <span className="text-[11px] font-semibold tracking-wide text-accent mb-0.5">
              {message.senderName}
            </span>
          )}
          {message.isDeleted ? (
            <p className="italic text-ink-faint opacity-90 flex items-center gap-1.5 text-[13.5px]">
              <FiTrash2 className="text-[13px]" /> This message was deleted
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          <div className="flex items-center gap-1 self-end mt-1.5 -mb-0.5">
            <p
              className={`text-[10px] font-mono-num ${
                isMe ? "text-white/60" : "text-ink-faint"
              }`}
            >
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {isMe &&
              (message.status === "sent" ? (
                <RiCheckFill className="text-[12px] text-white/60" />
              ) : (
                <RiCheckDoubleFill
                  className={`text-[12px] ${
                    message.status === "seen" ? "text-white" : "text-white/60"
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
                    : "bg-surface-2 border-line text-ink-muted shadow-sm"
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
            className="oc-icon-btn oc-focus size-8 rounded-full"
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

  const [suggestKey, setSuggestKey] = useState("");
  const submittedSuggestKeyRef = useRef("");
  const {
    object: suggestObject,
    submit: submitSuggest,
    isLoading: suggestLoading,
  } = useObject({
    api: "/api/messages/suggest",
    schema: suggestionsSchema,
  });

  const handleToggleReaction = useCallback(
    (messageId: Id<"messages">, emoji: string) => {
      toggleReaction({ messageId, emoji });
    },
    [toggleReaction],
  );

  useEffect(() => {
    if (!activeConversationId || !messages || !currentUser) return;
    const hasUnreadIncoming = messages.some(
      (message) =>
        message.sender !== currentUser._id &&
        (message.status === "sent" || message.status === "delivered"),
    );
    if (!hasUnreadIncoming) return;
    markAsSeen({ conversationId: activeConversationId });
  }, [activeConversationId, currentUser, messages, markAsSeen]);

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

  useEffect(() => {
    if (!activeConversationId || messages === undefined || !currentUser) return;
    if (messageText.trim() || pendingMessage) return;
    const last = messages[messages.length - 1];
    const myTurn =
      messages.length === 0 || (last && last.sender !== currentUser._id);
    if (!myTurn) return;
    const key = `${activeConversationId}:${last?._id ?? "none"}`;
    if (submittedSuggestKeyRef.current === key) return;
    submittedSuggestKeyRef.current = key;
    const raf = requestAnimationFrame(() => {
      setSuggestKey(key);
      submitSuggest({ conversationId: activeConversationId });
    });
    return () => cancelAnimationFrame(raf);
  }, [
    activeConversationId,
    messages,
    currentUser,
    messageText,
    pendingMessage,
    submitSuggest,
  ]);

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

  const lastDisplayMessage = displayMessages[displayMessages.length - 1];
  const suggestCurrentKey = activeConversationId
    ? `${activeConversationId}:${lastDisplayMessage?._id ?? "none"}`
    : "";
  const suggestBelongsToCurrent =
    suggestKey !== "" && suggestKey === suggestCurrentKey;
  const smartSuggestions =
    suggestBelongsToCurrent && !suggestLoading
      ? Array.from(
          new Set(
            (suggestObject?.suggestions ?? [])
              .filter((s): s is string => typeof s === "string")
              .map(cleanSuggestion)
              .filter(Boolean),
          ),
        ).slice(0, 3)
      : [];
  const myTurnToReply =
    !!currentUser &&
    (displayMessages.length === 0 ||
      (!!lastDisplayMessage && lastDisplayMessage.sender !== currentUser._id));
  const canShowSuggestions =
    !!activeConversationId &&
    !messageText.trim() &&
    !pendingMessage &&
    myTurnToReply;
  const showSuggestShimmer =
    canShowSuggestions && suggestBelongsToCurrent && suggestLoading;
  const showSuggestBar =
    canShowSuggestions &&
    suggestBelongsToCurrent &&
    (suggestLoading || smartSuggestions.length > 0);

  const applySuggestion = (text: string) => {
    setMessageText(text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      handleInput();
    });
  };

  return (
    <div className="h-full relative flex flex-col overflow-hidden">
      {selectionMode && (
        <div className="oc-frost absolute top-0 inset-x-0 h-16 z-20 flex items-center justify-between px-4 animate-in slide-in-from-top-2 border-b border-line">
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="oc-icon-btn oc-focus size-9 rounded-full"
            >
              <FiX className="text-xl" />
            </button>
            <span className="font-semibold text-[15px] text-ink font-mono-num">
              {selectedMessages.size} selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 h-9 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <FiTrash2 className="text-base" /> Delete
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 oc-frost shadow-[var(--shadow-pop)] border border-line rounded-2xl p-1.5 w-56 flex flex-col gap-0.5 text-sm text-ink animate-in fade-in zoom-in-95 origin-top-left"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 280)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
          }}
        >
          {contextMenu.showReactions && (
            <>
              <div className="px-1 pb-1">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-semibold font-mono mb-1.5 px-2">
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
              <div className="h-px bg-line my-1 relative -mx-1.5" />
            </>
          )}
          <button
            onClick={() => handleCopy(contextMenu.content)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-3 rounded-xl transition-colors font-medium"
          >
            <FiCopy className="text-ink-faint text-base" /> Copy
          </button>
          <button
            onClick={() => handleSummarize(contextMenu.content)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent-soft rounded-xl transition-colors font-medium text-accent"
          >
            <FiFileText className="text-base" /> Summarize
          </button>
          <button
            onClick={() => {
              handleToggleSelect(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-3 rounded-xl transition-colors font-medium"
          >
            <FiCheck className="text-ink-faint text-base" /> Select
          </button>

          {contextMenu.messageId &&
            contextMenuMessage?.sender === currentUser?._id && (
              <>
                <div className="h-px bg-line my-1 relative -mx-1.5" />
                <button
                  onClick={() => handleDeleteSingle(contextMenu.messageId)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors font-medium"
                >
                  <FiTrash2 className="text-base" /> Delete
                </button>
              </>
            )}
        </div>
      )}

      {summaryData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="oc-panel bg-surface-1 rounded-3xl p-6 w-[90%] max-w-md shadow-[var(--shadow-pop)] relative semantic-search-panel">
            <button
              onClick={() => setSummaryData((s) => ({ ...s, isOpen: false }))}
              className="oc-icon-btn oc-focus absolute top-4 right-4 size-8 rounded-full"
            >
              <FiX />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-accent-soft text-accent rounded-xl">
                <FiFileText className="text-xl" />
              </div>
              <h2 className="text-lg font-semibold text-ink tracking-tight">
                AI Summary
              </h2>
            </div>
            <div className="min-h-[100px] flex items-center justify-center text-ink leading-relaxed">
              {summaryData.isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="size-7 border-[3px] border-accent-soft border-t-accent rounded-full animate-spin" />
                  <p className="text-sm text-ink-faint">
                    Summarizing message…
                  </p>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[14.5px]">{summaryData.text}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-0 relative">
        <div className="oc-canvas h-full absolute -z-10 inset-0 w-full" />
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="oc-scroll flex-1 overflow-y-auto flex flex-col gap-2 px-4 md:px-6 w-full py-4 max-w-3xl mx-auto"
        >
          {isMessagesLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="size-7 border-[3px] border-line border-t-accent rounded-full animate-spin" />
              <p className="text-ink-faint text-sm">Loading messages…</p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="oc-avatar size-12 rounded-2xl grid place-items-center text-ink-faint">
                <IoChatbubbleEllipsesOutline className="size-6" />
              </div>
              <p className="text-ink-faint text-sm">
                No messages yet — say hello 👋
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
                  className="text-xs text-red-500 hover:text-red-600 font-medium px-2.5 py-1 rounded-lg bg-red-500/10 transition-colors"
                >
                  Retry
                </button>
              )}
              <div className="oc-bubble oc-bubble-me flex flex-col select-none self-end max-w-[78%] opacity-70">
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                  {pendingMessage.content}
                </p>
                <div className="flex items-center gap-1 self-end mt-1.5 -mb-0.5">
                  <p className="text-[10px] text-white/70 font-mono-num">
                    {pendingMessage.error ? "Failed to send" : "Sending…"}
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
          className="oc-btn-accent oc-focus absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-full px-4 py-2 text-xs font-semibold"
        >
          ↓ New messages
        </button>
      )}

      <div className="oc-frost flex-none px-3 md:px-6 pt-2.5 pb-3 w-full border-line border-t z-10">
        {showSuggestBar && (
          <div className="max-w-3xl mx-auto mb-2.5 flex items-center gap-2 overflow-x-auto oc-scroll pb-0.5">
            <span className="flex-none flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint pr-0.5">
              <HiOutlineSparkles
                className={`size-3 ${showSuggestShimmer ? "text-accent" : ""}`}
              />
              {showSuggestShimmer ? "Thinking" : "Reply"}
            </span>
            {showSuggestShimmer
              ? [88, 128, 104].map((w, i) => (
                  <span
                    key={i}
                    className="flex-none h-[30px] rounded-full bg-surface-3 animate-pulse"
                    style={{ width: w, animationDelay: `${i * 120}ms` }}
                  />
                ))
              : smartSuggestions.map((s, i) => (
                  <button
                    key={`${s}-${i}`}
                    onClick={() => applySuggestion(s)}
                    className="oc-row oc-reveal oc-focus flex-none text-[13px] px-3.5 py-1.5 rounded-full bg-surface-2 border-line text-ink-muted hover:text-ink whitespace-nowrap"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    {s}
                  </button>
                ))}
          </div>
        )}
        <div className="oc-composer max-w-3xl mx-auto flex items-end gap-2 pl-2 pr-2 py-1.5">
          <button className="oc-icon-btn oc-focus size-9 flex-none rounded-full self-center">
            <FiPlus className="size-5" />
          </button>
          <div className="w-full flex relative items-end">
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
              placeholder="Type a message…"
              className="w-full bg-transparent pr-8 focus:outline-0 text-ink placeholder:text-ink-faint py-1.5 resize-none overflow-hidden text-[15px] leading-relaxed"
            />
            <RiEmojiStickerLine
              className="absolute size-5 right-1 bottom-2 cursor-pointer hover:text-ink text-ink-faint transition-colors"
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
            disabled={!messageText.trim()}
            className="oc-btn-accent oc-focus size-9 flex-none flex justify-center items-center rounded-full self-center disabled:cursor-not-allowed"
          >
            <IoSend className="text-[15px] ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
