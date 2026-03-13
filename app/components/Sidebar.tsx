"use client";

const RECENT = [
  { id: "1", title: "Fantasy Book Picks", description: "Recommended some trending fantasy novels", time: "Yesterday, 3:30 PM", active: true, icon: "F" },
  { id: "2", title: "Mystery Novels", description: "Found mystery novels with good ratings", time: "Yesterday, 2:15 PM", active: false, icon: null },
  { id: "3", title: "Classic Literature", description: "Classic literature recommendations", time: "2 days ago", active: false, icon: null },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <aside className={`bookbot-sidebar ${isOpen ? "open" : ""}`}>
      <div className="bookbot-sidebar-brand">
        <div className="bookbot-logo">B</div>
        <div>
          <span className="bookbot-name">BookBot</span>
          <p className="bookbot-tagline">Your reading guide</p>
        </div>
        {/* Close button — mobile only */}
        <button type="button" className="bookbot-sidebar-close-btn" onClick={onClose} aria-label="Close menu">×</button>
      </div>
      <button type="button" className="bookbot-btn-new">
        <span className="bookbot-btn-icon">+</span>
        New Conversation
      </button>
      <div className="bookbot-search-wrap">
        <span className="bookbot-search-icon" aria-hidden>⌕</span>
        <input type="search" className="bookbot-search" placeholder="Search conversations..." aria-label="Search conversations" />
      </div>
      <div className="bookbot-recent">
        <h2 className="bookbot-recent-title">RECENT</h2>
        <ul className="bookbot-conversation-list">
          {RECENT.map((c) => (
            <li key={c.id}>
              <button type="button" className={`bookbot-conversation-item ${c.active ? "active" : ""}`}>
                <span className={`bookbot-conv-icon ${c.icon ? "custom" : ""}`}>{c.icon || "👤"}</span>
                <div className="bookbot-conv-body">
                  <span className="bookbot-conv-title">{c.title}</span>
                  <span className="bookbot-conv-desc">{c.description}</span>
                  <span className="bookbot-conv-time">{c.time}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="bookbot-sidebar-footer">
        <button type="button" className="bookbot-reader-link">
          <span className="bookbot-reader-icon">👤</span>
          Reader
          <span className="bookbot-arrow">→</span>
        </button>
      </div>
    </aside>
  );
}
