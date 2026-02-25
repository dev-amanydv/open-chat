export default function TypingIndicator() {
  return (
    <div className="self-start flex items-end gap-1 px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-br-lg bg-neutral-100 w-fit">
      <span className="typing-dot size-2 rounded-full bg-neutral-400" />
      <span
        className="typing-dot size-2 rounded-full bg-neutral-400"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="typing-dot size-2 rounded-full bg-neutral-400"
        style={{ animationDelay: "0.3s" }}
      />
    </div>
  );
}
