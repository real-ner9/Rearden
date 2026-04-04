import { useNavigate } from "react-router-dom";
import { Play, Images, Heart, ChatCircle } from "@phosphor-icons/react";
import styles from "./ExploreGrid.module.scss";

export interface ExploreTilePost {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  imageUrl: string | null;
  imageUrls: string[];
  thumbnailUrl: string | null;
  likeCount?: number;
  commentCount?: number;
}

interface ExploreTileProps {
  post: ExploreTilePost;
  large?: boolean;
}

export function ExploreTile({ post, large }: ExploreTileProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const isMultiImage = post.type === "image" && post.imageUrls.length > 1;
  const thumbnailSrc =
    post.thumbnailUrl ||
    (post.type === "image" ? post.imageUrls[0] || post.imageUrl : null);

  const showOverlay =
    post.likeCount !== undefined || post.commentCount !== undefined;

  return (
    <div
      className={`${styles.tile} ${large ? styles.tileLarge : ""}`}
      onClick={handleClick}
    >
      {post.type === "text" ? (
        <div className={styles.textTile}>
          <p className={styles.textTileContent}>{post.content}</p>
        </div>
      ) : (
        <img
          src={thumbnailSrc || ""}
          alt=""
          className={styles.tileImg}
          loading="lazy"
        />
      )}

      {post.type === "video" && (
        <span className={styles.typeIcon}>
          <Play size={20} weight="fill" />
        </span>
      )}

      {isMultiImage && (
        <span className={styles.typeIcon}>
          <Images size={20} weight="fill" />
        </span>
      )}

      {showOverlay && (
        <div className={styles.hoverOverlay}>
          {post.likeCount !== undefined && (
            <span className={styles.overlayStat}>
              <Heart size={18} weight="fill" />
              {post.likeCount}
            </span>
          )}
          {post.commentCount !== undefined && (
            <span className={styles.overlayStat}>
              <ChatCircle size={18} weight="fill" />
              {post.commentCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
