import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { Button } from "@/components/Button/Button";
import { Logo } from "@/components/Logo/Logo";
import styles from "./Landing.module.scss";

const features = [
  {
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    title: "Video-First Profiles",
    description:
      "Showcase your skills through short video introductions, giving others a real sense of who you are.",
  },
  {
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    title: "AI-Powered Search",
    description:
      "Describe who you're looking for in natural language and our AI finds the best matches instantly.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Lightning Fast",
    description:
      "Skip the resume pile. Watch video profiles, assess fit, and reach out — all in minutes.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.landing}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <motion.div
              className={styles.badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              The future of hiring
            </motion.div>

            <motion.h1
              className={styles.heading}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
            >
              Hire talent through
              <span className={styles.gradient}> video</span>, not
              <span className={styles.strikethrough}> resumes</span>
            </motion.h1>

            <motion.p
              className={styles.subheading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            >
              Rearden connects people through AI-powered video
              profiles. See beyond the resume — discover personality, communication,
              and culture fit.
            </motion.p>

            <motion.div
              className={styles.ctas}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.4 }}
            >
              <Button variant="primary" size="lg" onClick={() => navigate("/search")}>
                Start Searching
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Create Profile
              </Button>
            </motion.div>
          </div>

          <div className={styles.heroGlow} />
        </section>

        <section className={styles.features}>
          <motion.div
            className={styles.featuresGrid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className={styles.featureCard}
                variants={itemVariants}
              >
                <div className={styles.featureIcon}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className={styles.stats}>
          <motion.div
            className={styles.statsGrid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { value: "500+", label: "Video Profiles" },
              { value: "85%", label: "Faster Hiring" },
              { value: "3x", label: "Better Match Rate" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className={styles.stat}
                variants={itemVariants}
              >
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className={styles.cta}>
          <motion.div
            className={styles.ctaContent}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Logo size="lg" />
            <h2 className={styles.ctaHeading}>Ready to transform your hiring?</h2>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/search")}
            >
              Explore Profiles
            </Button>
          </motion.div>
        </section>
    </div>
  );
}
