import { useCallback, useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { List, Play, Images, ArrowLeft } from "@phosphor-icons/react";
import type { User, VideoPost, Vacancy } from "@rearden/types";

import { ProfileTabs, type ProfileTab } from "@/components/ProfileTabs/ProfileTabs";
import { FeedPost } from "@/components/FeedPost/FeedPost";
import { CommentSheet } from "@/components/CommentSheet/CommentSheet";
import { ShareSheet } from "@/components/ShareSheet/ShareSheet";
import { PostDetailModal } from "@/components/PostDetailModal/PostDetailModal";
import { VideoGrid } from "@/components/VideoGrid/VideoGrid";
import { ReelModal } from "@/components/ReelModal/ReelModal";
import { VacancyCard } from "@/components/VacancyCard/VacancyCard";
import { SkillTag } from "@/components/SkillTag/SkillTag";
import { Button } from "@/components/Button/Button";
import { useApi } from "@/hooks/useApi";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useProfilePostsStore } from "@/stores/profilePostsStore";
import { useFollowStore } from "@/stores/followStore";
import { useHeaderStore } from "@/stores/headerStore";
import styles from "./MyProfile.module.scss";

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MyProfile() {
  const { id: paramId, postId, tab: tabParam } = useParams<{ id?: string; postId?: string; tab?: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const startConversation = useChatStore((s) => s.startConversation);

  const [modalState, setModalState] = useState<{ postId: string; focusComments: boolean } | null>(null);
  const [mobileCommentPostId, setMobileCommentPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [feedViewPostId, setFeedViewPostId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    posts: profilePosts,
    loading: postsLoading,
    toggleLike,
    toggleBookmark,
    fetchPosts,
    reset: resetPosts,
  } = useProfilePostsStore();

  const { setFollowing, isFollowing: checkIsFollowing, isLoading: checkFollowLoading, toggleFollow } = useFollowStore();

  const urlToTab: Record<string, ProfileTab> = { videos: "video", vacancies: "vacancies" };
  const tabToUrl: Record<string, string> = { video: "videos", vacancies: "vacancies" };
  const activeTab: ProfileTab = tabParam && urlToTab[tabParam]
    ? urlToTab[tabParam]
    : postId ? "video" : "posts";

  const basePath = paramId ? `/user/${paramId}` : "/profile";
  const setActiveTab = useCallback(
    (tab: ProfileTab) => {
      const slug = tabToUrl[tab];
      navigate(slug ? `${basePath}/${slug}` : basePath, { replace: true });
    },
    [basePath, navigate],
  );

  // Own profile if no param id, or param id matches current user
  const isOwn = !paramId || paramId === authUser?.id;
  const apiUrl = isOwn ? "/me/profile" : `/users/${paramId}`;

  const { data: profile, loading, error } = useApi<User>(apiUrl);

  const userId = profile?.id ?? paramId;
  const { data: videoPosts } = useApi<VideoPost[]>(
    userId ? `/posts?userId=${userId}&type=video` : "",
  );
  const { data: vacancies } = useApi<Vacancy[]>(
    userId ? `/vacancies?userId=${userId}` : "",
  );

  // Set mobile header title to username
  const setHeaderTitle = useHeaderStore((s) => s.setTitle);
  useEffect(() => {
    if (profile) {
      setHeaderTitle(profile.username || profile.name || null);
    }
    return () => setHeaderTitle(null);
  }, [profile, setHeaderTitle]);

  // Seed follow state from profile API response
  useEffect(() => {
    if (profile && !isOwn && profile.isFollowing !== undefined) {
      setFollowing(profile.id, profile.isFollowing);
    }
  }, [profile, isOwn, setFollowing]);

  const following = profile ? checkIsFollowing(profile.id) : false;
  const followLoading = profile ? checkFollowLoading(profile.id) : false;

  // Fetch profile posts via feed store
  useEffect(() => {
    if (userId) {
      fetchPosts(userId);
    }
    return () => {
      resetPosts();
    };
  }, [userId]);

  const handleOpenComments = (postId: string) => {
    if (isMobile) {
      setMobileCommentPostId(postId);
    } else {
      setModalState({ postId, focusComments: true });
    }
  };

  const handleShare = (postId: string) => {
    setSharePostId(postId);
  };

  const handleOpenPost = (postId: string) => {
    if (!isMobile) {
      setModalState({ postId, focusComments: false });
    }
  };

  const handleCloseModal = () => setModalState(null);
  const handleCloseSheet = () => setMobileCommentPostId(null);

  const handleGridTileClick = (postId: string) => {
    setFeedViewPostId(postId);
  };

  // Scroll to the clicked post when feed view opens
  useEffect(() => {
    if (!feedViewPostId) return;
    const delay = isMobile ? 350 : 50;
    const timer = setTimeout(() => {
      const el = postRefs.current.get(feedViewPostId);
      el?.scrollIntoView({ block: "start" });
    }, delay);
    return () => clearTimeout(timer);
  }, [feedViewPostId, isMobile]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    if (!isOwn) {
      return (
        <div className={styles.error}>
          <h2>User not found</h2>
          <p>The user you're looking for doesn't exist.</p>
          <Button variant="secondary" onClick={() => navigate("/search")}>
            Back to Search
          </Button>
        </div>
      );
    }
    return null;
  }

  const displaySkills =
    profile.topSkills.length > 0 ? profile.topSkills : profile.skills;

  const displayName = profile.name || profile.username || "User";
  const metaItems = [
    profile.title,
    profile.location,
    profile.experience ? `${profile.experience} yr${profile.experience !== 1 ? "s" : ""} exp` : null,
  ].filter(Boolean);

  return (
    <div className={styles.profile}>
      {!isOwn && (
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      {isOwn && (
        <button
          className={styles.settingsBtn}
          onClick={() => navigate("/profile/settings")}
          title="Settings"
        >
          <List size={24} weight="bold" />
        </button>
      )}

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={styles.profileTop}>
          <div className={styles.avatar}>
            {profile.thumbnailUrl ? (
              <img
                src={profile.thumbnailUrl}
                alt={displayName}
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(displayName)}
              </span>
            )}
          </div>
          <div className={styles.profileTopRight}>
            <h1 className={styles.name}>{displayName}</h1>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statCount}>{profilePosts.length}</span>
                <span className={styles.statLabel}>posts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statCount}>{profile.followerCount}</span>
                <span className={styles.statLabel}>followers</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statCount}>{profile.followingCount}</span>
                <span className={styles.statLabel}>following</span>
              </div>
            </div>
          </div>
        </div>

        {profile.name && (
          <p className={styles.fullName}>{profile.name}</p>
        )}
        {metaItems.length > 0 && (
          <div className={styles.meta}>
            {metaItems.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className={styles.dot} />}
                {item}
              </span>
            ))}
          </div>
        )}

        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

        {displaySkills.length > 0 && (
          <div className={styles.skills}>
            {displaySkills.slice(0, 13).map((skill) => (
              <SkillTag key={skill} skill={skill} size="sm" />
            ))}
          </div>
        )}

        <div className={styles.actions}>
          {isOwn ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </Button>
              {profile.resumeText && (
                <Link to={`/user/${profile.id}/resume`} className={styles.resumeLink}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Resume
                </Link>
              )}
            </>
          ) : (
            <>
              <Button
                variant={following ? "secondary" : "primary"}
                size="md"
                disabled={followLoading}
                onClick={() => toggleFollow(profile.id, profile.username || profile.name || "User")}
              >
                {following ? "Following" : "Follow"}
              </Button>
              {profile.resumeText && (
                <Link to={`/user/${profile.id}/resume`} className={styles.resumeLink}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Resume
                </Link>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  if (!authUser) {
                    navigate("/auth", { state: { from: `/user/${profile.id}` } });
                    return;
                  }
                  try {
                    const convId = await startConversation(profile.id, profile.name ?? profile.username ?? "User");
                    if (convId) navigate("/chat");
                  } catch {
                    // silently fail
                  }
                }}
              >
                Contact
              </Button>
            </>
          )}
        </div>
      </motion.div>

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        className={styles.tabContent}
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {activeTab === "posts" && (
          postsLoading ? (
            <div className={styles.emptyTab}>
              <div className={styles.spinner} />
            </div>
          ) : profilePosts.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>No posts yet</p>
            </div>
          ) : feedViewPostId ? (
            isMobile ? null : (
              <div className={styles.postList}>
                <button
                  className={styles.feedBackBtn}
                  onClick={() => setFeedViewPostId(null)}
                >
                  <ArrowLeft size={18} />
                  Back to grid
                </button>
                {profilePosts.map((post) => (
                  <div
                    key={post.id}
                    ref={(el) => {
                      if (el) postRefs.current.set(post.id, el);
                      else postRefs.current.delete(post.id);
                    }}
                  >
                    <FeedPost
                      post={post}
                      onOpenComments={handleOpenComments}
                      onClickMedia={handleOpenPost}
                      onLike={toggleLike}
                      onBookmark={toggleBookmark}
                      onShare={handleShare}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className={styles.postGrid}>
              {profilePosts.map((post) => (
                <button
                  key={post.id}
                  className={styles.gridTile}
                  onClick={() => handleGridTileClick(post.id)}
                >
                  {post.type === "video" && post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt="" className={styles.tileImg} />
                  ) : post.type === "image" && (post.imageUrl || post.imageUrls[0]) ? (
                    <img src={post.imageUrl || post.imageUrls[0]} alt="" className={styles.tileImg} />
                  ) : (
                    <div className={styles.textTile}>
                      <p className={styles.textTileContent}>{post.content}</p>
                    </div>
                  )}
                  {post.type === "video" && (
                    <div className={styles.tileIcon}>
                      <Play size={16} weight="fill" />
                    </div>
                  )}
                  {post.type === "image" && post.imageUrls.length > 1 && (
                    <div className={styles.tileIcon}>
                      <Images size={16} weight="fill" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )}
        {activeTab === "video" && (
          <VideoGrid
            posts={videoPosts ?? []}
            onVideoClick={(pid) => navigate(`/user/${profile.id}/reel/${pid}`)}
          />
        )}
        {activeTab === "vacancies" && (
          <div className={styles.vacancyList}>
            <div className={styles.vacancyHeader}>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/create?tab=vacancy")}
              >
                Post Vacancy
              </Button>
            </div>
            {vacancies && vacancies.length > 0 ? (
              vacancies.map((v) => <VacancyCard key={v.id} vacancy={v} />)
            ) : (
              <div className={styles.emptyTab}>
                <p>No vacancies posted</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {postId && (
        <ReelModal
          initialPostId={postId}
          userId={profile.id}
          onClose={() => navigate(`/user/${profile.id}/videos`)}
        />
      )}

      {/* Mobile fullscreen feed view */}
      <AnimatePresence>
        {isMobile && feedViewPostId && (
          <motion.div
            className={styles.mobileFeedOverlay}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            <header className={styles.mobileFeedHeader}>
              <button
                className={styles.mobileFeedBackBtn}
                onClick={() => setFeedViewPostId(null)}
              >
                <ArrowLeft size={22} />
              </button>
              <div className={styles.mobileFeedHeaderCenter}>
                <span className={styles.mobileFeedTitle}>Posts</span>
                <span className={styles.mobileFeedUsername}>
                  {profile.username || profile.name || "User"}
                </span>
              </div>
              <div className={styles.mobileFeedHeaderRight} />
            </header>
            <div className={styles.mobileFeedScroll}>
              {profilePosts.map((post) => (
                <div
                  key={post.id}
                  ref={(el) => {
                    if (el) postRefs.current.set(post.id, el);
                    else postRefs.current.delete(post.id);
                  }}
                >
                  <FeedPost
                    post={post}
                    onOpenComments={handleOpenComments}
                    onClickMedia={() => {}}
                    onLike={toggleLike}
                    onBookmark={toggleBookmark}
                    onShare={handleShare}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post detail modal (desktop) + Comment sheet (mobile) */}
      <AnimatePresence>
        {!isMobile && modalState && (() => {
          const modalPost = profilePosts.find((p) => p.id === modalState.postId);
          return modalPost ? (
            <PostDetailModal
              key={modalPost.id}
              post={modalPost}
              focusComments={modalState.focusComments}
              onClose={handleCloseModal}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
              onShare={handleShare}
            />
          ) : null;
        })()}
        {isMobile && mobileCommentPostId && (
          <CommentSheet
            key={mobileCommentPostId}
            postId={mobileCommentPostId}
            onClose={handleCloseSheet}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet */}
      <AnimatePresence>
        {sharePostId && (
          <ShareSheet
            postId={sharePostId}
            onClose={() => setSharePostId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
