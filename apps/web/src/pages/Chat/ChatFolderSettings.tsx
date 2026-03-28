import { useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import styles from "./ChatFolderSettings.module.scss";

export function ChatFolderSettings() {
  const folders = useChatStore((s) => s.folders);
  const folderSettingsOpen = useChatStore((s) => s.folderSettingsOpen);
  const setFolderSettingsOpen = useChatStore((s) => s.setFolderSettingsOpen);
  const conversations = useChatStore((s) => s.conversations);
  const createFolder = useChatStore((s) => s.createFolder);
  const updateFolder = useChatStore((s) => s.updateFolder);
  const deleteFolder = useChatStore((s) => s.deleteFolder);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editConvIds, setEditConvIds] = useState<string[]>([]);

  if (!folderSettingsOpen) return null;

  const startEdit = (folder: { id: string; name: string; conversationIds: string[] }) => {
    setEditingId(folder.id);
    setEditName(folder.name);
    setEditConvIds([...folder.conversationIds]);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateFolder(editingId, { name: editName.trim() || undefined, conversationIds: editConvIds });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createFolder(newName.trim());
    setNewName("");
  };

  const toggleConv = (convId: string) => {
    setEditConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId],
    );
  };

  return (
    <div className={styles.overlay} onClick={() => setFolderSettingsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Chat Folders</h3>
          <button className={styles.closeBtn} onClick={() => setFolderSettingsOpen(false)}>
            &times;
          </button>
        </div>

        <div className={styles.createRow}>
          <input
            className={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New folder name..."
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button className={styles.createBtn} onClick={handleCreate} disabled={!newName.trim()}>
            Create
          </button>
        </div>

        <div className={styles.folderList}>
          {folders.map((folder) => (
            <div key={folder.id} className={styles.folderItem}>
              {editingId === folder.id ? (
                <div className={styles.editForm}>
                  <input
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.convList}>
                    {conversations.map((conv) => (
                      <label key={conv.id} className={styles.convCheckbox}>
                        <input
                          type="checkbox"
                          checked={editConvIds.includes(conv.id)}
                          onChange={() => toggleConv(conv.id)}
                        />
                        <span>{conv.userName}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.editActions}>
                    <button className={styles.saveBtn} onClick={saveEdit}>
                      Save
                    </button>
                    <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.folderRow}>
                  <span className={styles.folderName}>{folder.name}</span>
                  <span className={styles.folderCount}>{folder.conversationIds.length} chats</span>
                  <button className={styles.editBtn} onClick={() => startEdit(folder)}>
                    Edit
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteFolder(folder.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {folders.length === 0 && (
            <p className={styles.emptyText}>No folders yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
