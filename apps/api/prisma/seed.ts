import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// Simple hash for seed data (not for production)
async function hashPassword(password: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await db.chatMessage.deleteMany();
  await db.conversation.deleteMany();
  await db.post.deleteMany();
  await db.vacancy.deleteMany();
  await db.user.deleteMany();

  const defaultHash = await hashPassword("password123");

  // Create users (merged from candidates + auth)
  const users = [
    {
      id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      phone: "+15551000001",
      passwordHash: defaultHash,
      username: "sarahchen",
      onboarded: true,
      email: "sarah.chen@email.com",
      name: "Sarah Chen",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "PostgreSQL"],
      experience: 6,
      videoUrl: "https://videos.pexels.com/video-files/4962731/4962731-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/4962731/pexels-photo-4962731.jpeg?auto=compress&cs=tinysrgb&w=400",
      resumeText: "SARAH CHEN\nSenior Full Stack Engineer\n\nPROFESSIONAL SUMMARY\nPassionate full-stack engineer with 6 years of experience building scalable web applications. Led cross-functional teams at two YC-backed startups, delivering products used by millions.\n\nEXPERIENCE\nSenior Engineer — Streamline (2023–Present)\n• Architected real-time collaboration platform serving 50K+ daily users\n• Reduced API response times by 40% through GraphQL optimization\n• Mentored 4 junior engineers through structured growth plans\n\nFull Stack Developer — CloudBase (2020–2023)\n• Built customer-facing dashboard from scratch using React and Node.js\n• Implemented CI/CD pipeline reducing deployment time by 60%\n\nEDUCATION\nB.S. Computer Science — UC Berkeley, 2019",
      location: "San Francisco, CA",
      title: "Senior Full Stack Engineer",
      bio: "Passionate about building scalable web applications with modern technologies. Led multiple high-impact projects from conception to deployment, focusing on performance and user experience.",
      availability: "2weeks",
    },
    {
      id: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
      phone: "+15551000002",
      passwordHash: defaultHash,
      username: "marcusjohnson",
      onboarded: true,
      email: "marcus.johnson@email.com",
      name: "Marcus Johnson",
      skills: ["Python", "Django", "AWS", "Docker", "Redis"],
      experience: 8,
      videoUrl: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3209828/free-video-3209828.jpg?auto=compress&cs=tinysrgb&w=400",
      resumeText: "MARCUS JOHNSON\nLead Backend Engineer\n\nPROFESSIONAL SUMMARY\n8 years of experience designing and scaling backend systems. Expert in Python/Django ecosystem with deep AWS and DevOps knowledge.\n\nEXPERIENCE\nLead Backend Engineer — DataPulse (2022–Present)\n• Designed microservices architecture handling 10M+ requests/day\n• Led migration from monolith to event-driven system on AWS\n• Reduced infrastructure costs by 35% through container optimization\n\nSenior Developer — TechFlow (2018–2022)\n• Built real-time data processing pipeline using Redis and Kafka\n• Implemented automated testing suite with 95% code coverage\n\nEDUCATION\nM.S. Computer Science — UT Austin, 2018",
      location: "Austin, TX",
      title: "Lead Backend Engineer",
      bio: "Specialized in building robust API services and microservices architecture. Strong focus on system reliability, security best practices, and cloud infrastructure optimization.",
      availability: "1month",
    },
    {
      id: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
      phone: "+15551000003",
      passwordHash: defaultHash,
      username: "emilyrodriguez",
      onboarded: true,
      email: "emily.rodriguez@email.com",
      name: "Emily Rodriguez",
      skills: ["Vue.js", "JavaScript", "Tailwind CSS", "Figma"],
      experience: 4,
      videoUrl: "https://videos.pexels.com/video-files/3255275/3255275-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3255275/free-video-3255275.jpg?auto=compress&cs=tinysrgb&w=400",
      resumeText: "EMILY RODRIGUEZ\nFrontend Developer\n\nPROFESSIONAL SUMMARY\nCreative frontend developer with 4 years of experience crafting pixel-perfect, accessible interfaces. Strong design sense with Figma proficiency.\n\nEXPERIENCE\nFrontend Developer — PixelCraft Studio (2022–Present)\n• Built component library used across 5 product teams\n• Achieved 98 Lighthouse accessibility score on main product\n• Collaborated directly with design team on design system\n\nJunior Developer — WebForge (2020–2022)\n• Developed responsive marketing sites for Fortune 500 clients\n• Implemented A/B testing framework increasing conversions by 22%\n\nEDUCATION\nB.A. Interactive Media — NYU, 2020",
      location: "New York, NY",
      title: "Frontend Developer",
      bio: "Creative developer with an eye for design and user interface. Love translating beautiful designs into pixel-perfect, accessible web experiences that users enjoy.",
      availability: "immediate",
    },
    {
      id: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
      phone: "+15551000004",
      passwordHash: defaultHash,
      username: "alexkim",
      onboarded: true,
      email: "alex.kim@email.com",
      name: "Alex Kim",
      skills: ["React Native", "Swift", "Kotlin", "Firebase", "GraphQL", "TypeScript"],
      experience: 5,
      videoUrl: "https://videos.pexels.com/video-files/5442623/5442623-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/5442623/pexels-photo-5442623.jpeg?auto=compress&cs=tinysrgb&w=400",
      location: "Seattle, WA",
      title: "Mobile Engineer",
      bio: "Cross-platform mobile development expert with a track record of shipping successful apps to millions of users. Strong advocate for mobile-first design and performance optimization.",
      availability: "2weeks",
    },
    {
      id: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
      phone: "+15551000005",
      passwordHash: defaultHash,
      username: "priyapatel",
      onboarded: true,
      email: "priya.patel@email.com",
      name: "Priya Patel",
      skills: ["Java", "Spring Boot", "Kubernetes", "MongoDB"],
      experience: 7,
      videoUrl: "https://videos.pexels.com/video-files/3251806/3251806-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3251806/free-video-3251806.jpg?auto=compress&cs=tinysrgb&w=400",
      location: "Boston, MA",
      title: "Senior Backend Developer",
      bio: "Enterprise software engineer with expertise in building scalable microservices. Experienced in leading technical initiatives and mentoring junior developers in agile environments.",
      availability: "1month",
    },
    {
      id: "f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c",
      phone: "+15551000006",
      passwordHash: defaultHash,
      username: "jordantaylor",
      onboarded: true,
      email: "jordan.taylor@email.com",
      name: "Jordan Taylor",
      skills: ["Go", "Rust", "gRPC", "Kafka"],
      experience: 9,
      videoUrl: "https://videos.pexels.com/video-files/5452799/5452799-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/5452799/pexels-photo-5452799.jpeg?auto=compress&cs=tinysrgb&w=400",
      location: "Denver, CO",
      title: "Staff Systems Engineer",
      bio: "Low-level systems programming specialist focused on high-performance distributed systems. Deep knowledge of network protocols, concurrency patterns, and infrastructure automation.",
      availability: "3months",
    },
    {
      id: "a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d",
      phone: "+15551000007",
      passwordHash: defaultHash,
      username: "lisaanderson",
      onboarded: true,
      email: "lisa.anderson@email.com",
      name: "Lisa Anderson",
      skills: ["Angular", "RxJS", "TypeScript", "Jest", "Cypress"],
      experience: 3,
      videoUrl: "https://videos.pexels.com/video-files/3209298/3209298-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3209298/free-video-3209298.jpg?auto=compress&cs=tinysrgb&w=400",
      location: "Chicago, IL",
      title: "Frontend Engineer",
      bio: "Detail-oriented developer passionate about writing clean, testable code. Strong focus on component architecture and building maintainable large-scale applications.",
      availability: "immediate",
    },
    {
      id: "b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e",
      phone: "+15551000008",
      passwordHash: defaultHash,
      username: "davidnguyen",
      onboarded: true,
      email: "david.nguyen@email.com",
      name: "David Nguyen",
      skills: ["React", "Next.js", "Vercel", "TailwindCSS", "Prisma", "PostgreSQL"],
      experience: 5,
      videoUrl: "https://videos.pexels.com/video-files/3195440/3195440-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3195440/free-video-3195440.jpg?auto=compress&cs=tinysrgb&w=400",
      location: "San Francisco, CA",
      title: "Full Stack Developer",
      bio: "Modern web developer specializing in the React ecosystem and serverless architectures. Experienced in building fast, SEO-friendly applications with excellent developer experience.",
      availability: "2weeks",
    },
    {
      id: "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
      phone: "+15551000009",
      passwordHash: defaultHash,
      username: "rachelbrooks",
      onboarded: true,
      email: "rachel.brooks@email.com",
      name: "Rachel Brooks",
      skills: ["Python", "TensorFlow", "PyTorch", "Pandas", "Scikit-learn"],
      experience: 6,
      videoUrl: "https://videos.pexels.com/video-files/4435751/4435751-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/4435751/pexels-photo-4435751.jpeg?auto=compress&cs=tinysrgb&w=400",
      location: "Palo Alto, CA",
      title: "Machine Learning Engineer",
      bio: "Data scientist turned ML engineer with experience deploying production models at scale. Passionate about applying AI to solve real-world business problems and improving model interpretability.",
      availability: "1month",
    },
    {
      id: "d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a",
      phone: "+15551000010",
      passwordHash: defaultHash,
      username: "kevinmartinez",
      onboarded: true,
      email: "kevin.martinez@email.com",
      name: "Kevin Martinez",
      skills: ["C#", ".NET", "Azure", "SQL Server"],
      experience: 10,
      videoUrl: "https://videos.pexels.com/video-files/3191887/3191887-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3191887/free-video-3191887.jpg?auto=compress&cs=tinysrgb&w=400",
      location: "Redmond, WA",
      title: "Principal Software Engineer",
      bio: "Veteran engineer with over a decade of experience in enterprise software development. Expert in cloud architecture, legacy system modernization, and leading cross-functional technical teams.",
      availability: "3months",
    },
    {
      id: "e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b",
      phone: "+15551000011",
      passwordHash: defaultHash,
      username: "ninawilliams",
      onboarded: true,
      email: "nina.williams@email.com",
      name: "Nina Williams",
      skills: ["Svelte", "SvelteKit", "TypeScript", "Supabase"],
      experience: 2,
      videoUrl: "https://videos.pexels.com/video-files/8426324/8426324-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/8426324/pexels-photo-8426324.jpeg?auto=compress&cs=tinysrgb&w=400",
      location: "Portland, OR",
      title: "Junior Full Stack Developer",
      bio: "Recent bootcamp graduate with a strong foundation in modern web technologies. Quick learner with a growth mindset, eager to contribute to innovative projects and expand technical skills.",
      availability: "immediate",
    },
    {
      id: "f2a3b4c5-d6e7-4f5a-9b0c-1d2e3f4a5b6c",
      phone: "+15551000012",
      passwordHash: defaultHash,
      username: "carlossantos",
      onboarded: true,
      email: "carlos.santos@email.com",
      name: "Carlos Santos",
      skills: ["PHP", "Laravel", "MySQL", "Redis", "Vue.js"],
      experience: 7,
      videoUrl: "https://videos.pexels.com/video-files/3209552/3209552-sd_640_360_25fps.mp4",
      thumbnailUrl: "https://images.pexels.com/videos/3209552/free-video-3209552.jpg?auto=compress&cs=tinysrgb&w=400",
      location: "Miami, FL",
      title: "Senior Web Developer",
      bio: "Full-stack developer with extensive experience in e-commerce and content management systems. Strong background in database optimization and building performant web applications.",
      availability: "2weeks",
    },
  ];

  for (const u of users) {
    await db.user.create({ data: u });
  }
  console.log(`  Created ${users.length} users`);

  // Create video posts from user videoUrls
  let videoPostCount = 0;
  for (const u of users) {
    if (u.videoUrl) {
      await db.post.create({
        data: {
          userId: u.id,
          type: "video",
          content: "",
          hashtags: [],
          videoUrl: u.videoUrl,
          thumbnailUrl: u.thumbnailUrl ?? null,
        },
      });
      videoPostCount++;
    }
  }
  console.log(`  Created ${videoPostCount} video posts`);

  // Create posts
  const posts = [
    {
      userId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      content: "Just shipped a real-time collaboration feature using WebSockets and React. The latency improvements were incredible — sub-50ms updates across all connected clients. #react #websockets #performance",
      hashtags: ["react", "websockets", "performance"],
      createdAt: new Date("2026-03-15T10:30:00Z"),
    },
    {
      userId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      content: "Open to new opportunities! Looking for a senior role where I can lead technical architecture decisions. Love working with modern stacks and mentoring teams. #opentowork #hiring #typescript",
      hashtags: ["opentowork", "hiring", "typescript"],
      createdAt: new Date("2026-03-10T14:20:00Z"),
    },
    {
      userId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
      content: "Migrated our monolith to microservices on AWS ECS. 35% cost reduction and 99.99% uptime. The key was incremental strangler fig pattern — never rewrite everything at once. #aws #microservices #devops",
      hashtags: ["aws", "microservices", "devops"],
      createdAt: new Date("2026-03-12T09:15:00Z"),
    },
    {
      userId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
      content: "Python tip: Use dataclasses with __slots__ for memory-efficient data models. Reduced our API memory footprint by 40% in production. #python #optimization #backend",
      hashtags: ["python", "optimization", "backend"],
      createdAt: new Date("2026-03-08T11:45:00Z"),
    },
    {
      userId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
      content: "Rebuilt our design system from scratch — 40 components, full a11y compliance, Storybook docs. The satisfaction of seeing it adopted across 5 teams is unmatched. #designsystem #accessibility #frontend",
      hashtags: ["designsystem", "accessibility", "frontend"],
      createdAt: new Date("2026-03-14T13:20:00Z"),
    },
    {
      userId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
      content: "Hot take: CSS-in-JS is dead. SCSS Modules + CSS custom properties give you everything you need with zero runtime cost. Fight me. #css #webdev #opentowork",
      hashtags: ["css", "webdev", "opentowork"],
      createdAt: new Date("2026-03-06T16:10:00Z"),
    },
    {
      userId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
      content: "Launched my side project on both App Store and Play Store this week! Built with React Native and Firebase — one codebase, two platforms. #reactnative #mobile #launch",
      hashtags: ["reactnative", "mobile", "launch"],
      createdAt: new Date("2026-03-13T08:00:00Z"),
    },
    {
      userId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
      content: "Performance tip for React Native: Use FlashList instead of FlatList. We went from 45fps to 60fps on our feed with 10K+ items. #reactnative #performance #hiring",
      hashtags: ["reactnative", "performance", "hiring"],
      createdAt: new Date("2026-03-05T10:30:00Z"),
    },
    {
      userId: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
      content: "Just passed the AWS Solutions Architect Professional exam! Kubernetes + Spring Boot + MongoDB is my bread and butter for enterprise backends. #aws #kubernetes #java",
      hashtags: ["aws", "kubernetes", "java"],
      createdAt: new Date("2026-03-11T12:45:00Z"),
    },
  ];

  for (const p of posts) {
    await db.post.create({ data: p });
  }
  console.log(`  Created ${posts.length} posts`);

  // Create vacancies
  const vacancies = [
    {
      userId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      title: "Senior Full Stack Engineer",
      description: "Looking for a role where I can own end-to-end feature development, mentor junior engineers, and drive technical architecture decisions in a fast-paced startup environment.",
      type: "fulltime",
      location: "San Francisco, CA / Remote",
      createdAt: new Date("2026-03-01T10:00:00Z"),
    },
    {
      userId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
      title: "Backend Architecture Consultant",
      description: "Available for short-term consulting on microservices migration, API design, and cloud infrastructure optimization. Specialize in Python/Django and AWS.",
      type: "contract",
      location: "Remote",
      createdAt: new Date("2026-02-28T09:00:00Z"),
    },
    {
      userId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
      title: "Frontend Developer — Design Systems",
      description: "Seeking opportunities to build and scale design systems. Passionate about accessibility, component architecture, and bridging the gap between design and engineering.",
      type: "fulltime",
      location: "New York, NY / Hybrid",
      createdAt: new Date("2026-03-05T13:00:00Z"),
    },
    {
      userId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
      title: "Mobile App Development",
      description: "Open to freelance mobile projects. Can deliver cross-platform apps using React Native with native performance. Experience with App Store and Play Store publishing.",
      type: "freelance",
      location: "Remote",
      createdAt: new Date("2026-03-03T08:00:00Z"),
    },
    {
      userId: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
      title: "Part-Time Backend Mentor",
      description: "Available for part-time mentoring and code review roles. Can help teams level up their Java/Spring Boot practices and adopt cloud-native patterns.",
      type: "parttime",
      location: "Boston, MA / Remote",
      createdAt: new Date("2026-02-25T12:00:00Z"),
    },
  ];

  for (const v of vacancies) {
    await db.vacancy.create({ data: v });
  }
  console.log(`  Created ${vacancies.length} vacancies`);

  // Create conversations with messages
  const baseTime = Date.now();
  const seedConversations = [
    {
      userId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      isPinned: true,
      messages: [
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Hi Sarah! I was really impressed by your video profile. Would you be interested in discussing a Senior React role?" },
        { senderRole: "user", senderId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", text: "Thank you! I'd love to hear more about the role. What's the team like?" },
        { senderRole: "recruiter", senderId: "recruiter-1", text: "It's a tight-knit team of 6 engineers working on our core product. Very collaborative culture with a focus on code quality." },
        { senderRole: "user", senderId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", text: "That sounds great! I'm definitely interested in learning more. When would be a good time for a quick call?" },
      ],
    },
    {
      userId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
      isPinned: false,
      messages: [
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Marcus, your backend experience is exactly what we're looking for. We have a Lead Backend Engineer position open." },
        { senderRole: "user", senderId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e", text: "Thanks for reaching out! I've been looking at Django and Python roles. What's the tech stack?" },
        { senderRole: "recruiter", senderId: "recruiter-1", text: "We use Python with FastAPI for microservices, PostgreSQL, and deploy on AWS with Kubernetes." },
      ],
    },
    {
      userId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
      isPinned: false,
      messages: [
        { senderRole: "user", senderId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f", text: "Hi! I saw the Frontend Developer posting and your platform looks amazing. I'd love to chat!" },
        { senderRole: "user", senderId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f", text: "I've been working with Vue.js for the past 4 years and I'm really passionate about UI/UX." },
      ],
    },
    {
      userId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
      isPinned: false,
      messages: [
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Alex, your mobile development portfolio is impressive. We're building a cross-platform app and need someone with your skillset." },
        { senderRole: "user", senderId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a", text: "That sounds exciting! I've been working with React Native and Swift. What platform are you targeting?" },
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Both iOS and Android. We're currently evaluating React Native vs Flutter. Your experience would be valuable." },
        { senderRole: "user", senderId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a", text: "I'd strongly recommend React Native given your web stack. Happy to discuss the tradeoffs in detail!" },
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Perfect. Let me set up a technical discussion with our CTO. Are you available this week?" },
      ],
    },
    {
      userId: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
      isPinned: false,
      messages: [
        { senderRole: "recruiter", senderId: "recruiter-1", text: "Hi Priya, I noticed your experience with Spring Boot and Kubernetes. We have a great opportunity for you." },
        { senderRole: "user", senderId: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b", text: "Hello! I'm always open to hearing about interesting opportunities. What's the role about?" },
      ],
    },
  ];

  for (let convIdx = 0; convIdx < seedConversations.length; convIdx++) {
    const seed = seedConversations[convIdx]!;
    const lastMsgRole = seed.messages[seed.messages.length - 1]!.senderRole;
    const unread = lastMsgRole !== "recruiter" ? 1 : 0;

    const conv = await db.conversation.create({
      data: {
        userId: seed.userId,
        isPinned: seed.isPinned,
        unreadCount: unread,
      },
    });

    for (let msgIdx = 0; msgIdx < seed.messages.length; msgIdx++) {
      const m = seed.messages[msgIdx]!;
      await db.chatMessage.create({
        data: {
          conversationId: conv.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          text: m.text,
          createdAt: new Date(baseTime - (seedConversations.length - convIdx) * 86400000 + msgIdx * 3600000),
        },
      });
    }
  }
  console.log(`  Created ${seedConversations.length} conversations with messages`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
