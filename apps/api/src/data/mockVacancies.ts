import type { Vacancy } from "@rearden/types";

export const mockVacancies: Vacancy[] = [
  {
    id: "vac-001",
    candidateId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    title: "Senior Full Stack Engineer",
    description:
      "Looking for a role where I can own end-to-end feature development, mentor junior engineers, and drive technical architecture decisions in a fast-paced startup environment.",
    type: "fulltime",
    location: "San Francisco, CA / Remote",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "vac-002",
    candidateId: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
    title: "Backend Architecture Consultant",
    description:
      "Available for short-term consulting on microservices migration, API design, and cloud infrastructure optimization. Specialize in Python/Django and AWS.",
    type: "contract",
    location: "Remote",
    createdAt: "2026-02-28T09:00:00Z",
  },
  {
    id: "vac-003",
    candidateId: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
    title: "Frontend Developer — Design Systems",
    description:
      "Seeking opportunities to build and scale design systems. Passionate about accessibility, component architecture, and bridging the gap between design and engineering.",
    type: "fulltime",
    location: "New York, NY / Hybrid",
    createdAt: "2026-03-05T13:00:00Z",
  },
  {
    id: "vac-004",
    candidateId: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
    title: "Mobile App Development",
    description:
      "Open to freelance mobile projects. Can deliver cross-platform apps using React Native with native performance. Experience with App Store and Play Store publishing.",
    type: "freelance",
    location: "Remote",
    createdAt: "2026-03-03T08:00:00Z",
  },
  {
    id: "vac-005",
    candidateId: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
    title: "Part-Time Backend Mentor",
    description:
      "Available for part-time mentoring and code review roles. Can help teams level up their Java/Spring Boot practices and adopt cloud-native patterns.",
    type: "parttime",
    location: "Boston, MA / Remote",
    createdAt: "2026-02-25T12:00:00Z",
  },
];
