"use client";

import { useRef, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";

const MAX_TEXTAREA_HEIGHT = 150;

export default function Chat() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY =
      ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const messages = [
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    ,
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "you",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
    {
      sentFrom: "me",
      content: "Hey, Good monring",
      sentAt: "24 Feb 2026, 08:30PM",
      deliveredAt: "24 Feb 2026, 08:38PM",
      hasSeen: true,
      isDeleted: false,
      type: "user",
    },
  ];

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
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 w-full">
            <div></div>
          {messages.map((message, key) => (
            <div
              key={key}
              className={`backdrop-blur-sm flex flex-col ${message?.sentFrom === "me" ? "self-end rounded-bl-lg bg-[#357578] text-white" : "rounded-br-lg"} w-fit px-4 py-1 rounded-tl-lg rounded-tr-lg`}
            >
              <h1>{message?.content}</h1>
              <p className={`text-xs self-end ${message?.sentFrom === "me" ? "text-slate-300" : "text-slate-400"}`}>
                {message?.deliveredAt.split(", ")[1]}
              </p>
            </div>
          ))}
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
            onInput={handleInput}
            className="w-full border pr-7 h-9 focus:outline-0 border-neutral-300 px-2 bg-white py-1 rounded-xl resize-none overflow-hidden"
          />
          <RiEmojiStickerLine className="absolute size-5 right-1 bottom-3.5" />
        </div>
        <button className="size-8 flex-none bg-[#357578] flex justify-center items-center rounded-full">
          <IoSend className="text-white" />
        </button>
      </div>
    </div>
  );
}
