import { ModalOverlay } from "@/components/ModalOverlay/ModalOverlay";
import { Feed } from "@/pages/Feed/Feed";

interface ReelModalProps {
  initialPostId: string;
  userId?: string;
  onClose: () => void;
}

export function ReelModal({ initialPostId, userId, onClose }: ReelModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <Feed initialPostId={initialPostId} userId={userId} />
    </ModalOverlay>
  );
}
