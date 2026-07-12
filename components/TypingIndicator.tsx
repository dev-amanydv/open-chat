export default function TypingIndicator() {
  return (
    <div className="oc-bubble oc-bubble-them self-start flex items-end gap-1 !py-3 w-fit">
      <span className="typing-dot size-2 rounded-full bg-ink-faint" />
      <span
        className="typing-dot size-2 rounded-full bg-ink-faint"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="typing-dot size-2 rounded-full bg-ink-faint"
        style={{ animationDelay: "0.3s" }}
      />
    </div>
  );
}
