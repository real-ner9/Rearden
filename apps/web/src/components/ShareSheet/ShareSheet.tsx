import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Link as LinkIcon, CheckCircle } from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar/Avatar";
import { useChatStore } from "@/stores/chatStore";
import { apiFetch } from "@/lib/api";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import styles from "./ShareSheet.module.scss";

interface ShareSheetProps {
  postId: string;
  onClose: () => void;
}

export function ShareSheet({ postId, onClose }: ShareSheetProps) {
  const conversations = useChatStore((s) => s.conversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { sheetDragProps, backdropOpacity, startDrag } = useBottomSheet({ onClose });

  const shareUrl = `${window.location.origin}/feed/${postId}`;

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.userName.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const toggleSelect = (convId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || sending) return;
    setSending(true);

    const text = message.trim()
      ? `${shareUrl}\n\n${message.trim()}`
      : shareUrl;

    try {
      await Promise.all(
        Array.from(selectedIds).map((convId) =>
          apiFetch(`/chat/${convId}/messages`, {
            method: "POST",
            body: JSON.stringify({ text }),
          })
        )
      );
      setSent(true);
      setTimeout(() => onClose(), 1000);
    } catch {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ opacity: backdropOpacity }}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        {...sheetDragProps}
      >
        <div className={styles.handleArea} onPointerDown={startDrag}>
          <div className={styles.handle} />
        </div>

        <header className={styles.header}>
          <h2 className={styles.title}>Share</h2>
        </header>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.scrollArea}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>
              {conversations.length === 0
                ? "No conversations yet"
                : "No matching conversations"}
            </div>
          ) : isSearching ? (
            <div className={styles.userList}>
              {filteredConversations.map((conv) => {
                const isSelected = selectedIds.has(conv.id);
                return (
                  <button
                    key={conv.id}
                    className={`${styles.userListItem} ${isSelected ? styles.selected : ""}`}
                    onClick={() => toggleSelect(conv.id)}
                  >
                    <Avatar
                      src={conv.userAvatar}
                      name={conv.userName}
                      className={styles.listAvatar}
                    />
                    <span className={styles.listUserName}>{conv.userName}</span>
                    <div className={`${styles.selectCircle} ${isSelected ? styles.selectCircleActive : ""}`}>
                      {isSelected && <CheckCircle size={24} weight="fill" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.userGrid}>
              {filteredConversations.map((conv) => {
                const isSelected = selectedIds.has(conv.id);
                return (
                  <button
                    key={conv.id}
                    className={styles.userCard}
                    onClick={() => toggleSelect(conv.id)}
                  >
                    <div className={styles.avatarWrap}>
                      <Avatar
                        src={conv.userAvatar}
                        name={conv.userName}
                        className={styles.gridAvatar}
                      />
                      {isSelected && (
                        <div className={styles.avatarCheck}>
                          <CheckCircle size={22} weight="fill" />
                        </div>
                      )}
                    </div>
                    <span className={styles.userName}>{conv.userName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom: message input + send / copy link */}
        <div className={styles.bottomSection}>
          {selectedIds.size > 0 && (
            <>
              <div className={styles.messageWrapper}>
                <input
                  type="text"
                  className={styles.messageInput}
                  placeholder="Write a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || sent}
              >
                {sent ? "Sent!" : sending ? "Sending..." : `Send${selectedIds.size > 1 ? ` (${selectedIds.size})` : ""}`}
              </button>
            </>
          )}

          <div className={styles.bottomActions}>
            <button className={styles.actionItem} onClick={handleCopyLink}>
              <div className={styles.actionCircle}>
                <LinkIcon size={24} weight="bold" />
              </div>
              <span className={styles.actionText}>
                {copiedLink ? "Copied!" : "Copy link"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
