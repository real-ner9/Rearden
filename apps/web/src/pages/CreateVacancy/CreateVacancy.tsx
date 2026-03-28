import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";
import type { Vacancy } from "@rearden/types";
import styles from "./CreateVacancy.module.scss";

export function CreateVacancy() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const updateField =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) return;
    setSubmitting(true);

    try {
      await apiFetch<{ success: boolean; data: Vacancy }>("/vacancies", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          title: form.title,
          description: form.description,
        }),
      });

      navigate("/profile");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.title}>Post a Vacancy</h1>
        <p className={styles.subtitle}>
          Describe the role you're hiring for in free form
        </p>
      </motion.div>

      <motion.form
        className={styles.form}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Input
          label="Title"
          placeholder="e.g. Senior Frontend Engineer"
          value={form.title}
          onChange={updateField("title")}
        />

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe the role, requirements, team, compensation — anything relevant..."
            value={form.description}
            onChange={updateField("description")}
            rows={8}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={submitting || !form.title}
          >
            {submitting ? "Creating..." : "Create Vacancy"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
