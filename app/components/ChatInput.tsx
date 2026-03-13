"use client";

/**
 * Bottom chat input with placeholder and send button. Calls onSubmit with the trimmed message.
 */

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask for book recommendations, compare prices, find genres.",
  disabled = false,
}: ChatInputProps) {
  return (
    <div className="bookbot-chat-input-wrap">
      <form className="bookbot-chat-form" onSubmit={onSubmit}>
        <input
          type="text"
          className="bookbot-chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message"
        />
        <button
          type="submit"
          className="bookbot-chat-send"
          disabled={disabled}
          aria-label="Send"
        >
          <span className="bookbot-send-icon">▶</span>
        </button>
      </form>
      <p className="bookbot-chat-disclaimer">
        BookBot can make mistakes. Check with retailers for the latest deals.
      </p>
    </div>
  );
}
