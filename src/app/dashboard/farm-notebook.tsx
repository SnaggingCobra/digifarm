"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "@/utils/supabase/auth";
import {
  farmerDetails,
  metadataText,
  readTasks,
  taskLimit,
  type NotebookTask,
} from "@/utils/supabase/farm";
import { FarmerFields } from "@/components/auth/farm-fields";
import { Icon } from "@/components/icon";

type FarmProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  farm_name: string | null;
  farm_location: string | null;
  farm_size: number | null;
  land_unit: string | null;
  profile_picture_url: string | null;
};

type FarmNotebookProps = {
  userId: string;
  email: string;
  initialMetadata: Record<string, unknown>;
  initialProfile: FarmProfile | null;
};

export function FarmNotebook({
  userId,
  email,
  initialMetadata,
  initialProfile,
}: FarmNotebookProps) {
  const [profile, setProfile] = useState<FarmProfile | null>(
    initialProfile
  );

  const [metadata, setMetadata] = useState(initialMetadata);

  const [tasks, setTasks] = useState(() =>
    readTasks(initialMetadata.notebook_tasks)
  );

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function saveProfile(
    form: FormData
  ) {
    if (busy) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const details = farmerDetails(form);

      const supabase = createClient();

      const { data: current, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      if (!current.user || current.user.id !== userId) {
        setError(
          "Your account session changed. Sign in again before saving."
        );
        return;
      }

      const { data: updatedProfile, error: profileError } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name: details.full_name,
              phone: details.phone,
              farm_name: details.farm_name,
              farm_location: details.farm_location,
              farm_size: details.farm_size,
              land_unit: details.land_unit,
            },
            {
              onConflict: "id",
            }
          )
          .select(
            "id, full_name, phone, farm_name, farm_location, farm_size, land_unit, profile_picture_url"
          )
          .single();

      if (profileError) throw profileError;

      setProfile(updatedProfile);

      setSuccess("Farm details saved to your account.");
    } catch (saveError) {
      setError(authErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function saveTaskMetadata(
    change: (
      current: Record<string, unknown>
    ) => Record<string, unknown>,
    message: string
  ) {
    if (busy) return false;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const { data: current, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      if (!current.user || current.user.id !== userId) {
        setError(
          "Your account session changed. Sign in again before saving."
        );
        return false;
      }

      const data = change(current.user.user_metadata);

      const { data: updated, error: updateError } =
        await supabase.auth.updateUser({
          data,
        });

      if (updateError) throw updateError;

      if (!updated.user) {
        throw new Error("Missing user");
      }

      setMetadata(updated.user.user_metadata);

      setTasks(
        readTasks(updated.user.user_metadata.notebook_tasks)
      );

      setSuccess(message);

      return true;
    } catch (saveError) {
      setError(authErrorMessage(saveError));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = title.trim();

    if (!trimmed || trimmed.length > 120) {
      setError("Enter a task using 1 to 120 characters.");
      return;
    }

    const saved = await saveTaskMetadata(
      (current) => {
        const currentTasks = readTasks(
          current.notebook_tasks
        );

        if (currentTasks.length >= taskLimit) {
          throw new Error(
            "Your notebook is full. Delete a task before adding another."
          );
        }

        return {
          notebook_tasks: [
            ...currentTasks,
            {
              id: crypto.randomUUID(),
              title: trimmed,
              done: false,
            },
          ],
        };
      },
      "Task saved to your account."
    );

    if (saved) {
      setTitle("");
    }
  }

  async function updateTask(
    task: NotebookTask,
    remove: boolean
  ) {
    await saveTaskMetadata(
      (current) => {
        const currentTasks = readTasks(
          current.notebook_tasks
        );

        return {
          notebook_tasks: remove
            ? currentTasks.filter(
                (entry) => entry.id !== task.id
              )
            : currentTasks.map((entry) =>
                entry.id === task.id
                  ? {
                      ...entry,
                      done: !task.done,
                    }
                  : entry
              ),
        };
      },
      remove
        ? "Task deleted."
        : task.done
          ? "Task marked as open."
          : "Task completed."
    );
  }

  const completed = tasks.filter(
    (task) => task.done
  ).length;

  const farmName =
    profile?.farm_name ||
    metadataText(metadata.farm_name);

  const fullName =
    profile?.full_name ||
    metadataText(metadata.full_name);

  const farmLocation =
    profile?.farm_location ||
    metadataText(metadata.farm_location);

  const displayEmail = email || "No email available";

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Your farm notebook</p>

          <h1
            className="break-words"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {farmName ||
              "A new chapter for your farm."}
          </h1>

          <p className="muted break-words">
            {fullName
              ? `Welcome, ${fullName}.`
              : "Welcome to your farm."}
          </p>
        </div>

        <span className="tag">
          <Icon name="sprout" />
          My farm
        </span>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="muted">Open tasks</span>
          <strong>
            {tasks.length - completed}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">Completed</span>
          <strong>{completed}</strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Farm location
          </span>

          <strong className="break-words text-lg">
            {farmLocation || "Not added yet"}
          </strong>
        </div>
      </div>

      {error && (
        <p
          className="form-message error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="form-message success"
          role="status"
        >
          {success}
        </p>
      )}

      <div className="dashboard-grid">
        <section
          className="dashboard-card min-w-0"
          aria-labelledby="tasks-heading"
          aria-busy={busy}
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="tasks-heading"
              className="font-serif text-2xl"
            >
              On the farm
            </h2>

            <Icon name="notebook" />
          </div>

          <p className="muted my-3 text-sm">
            Account notebook: {tasks.length} of{" "}
            {taskLimit} tasks.
          </p>

          <form
            className="auth-form"
            onSubmit={addTask}
          >
            <div className="field">
              <label htmlFor="task-title">
                New task
              </label>

              <input
                id="task-title"
                name="task"
                placeholder="e.g. Check the irrigation lines"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                maxLength={120}
                required
                disabled={
                  busy ||
                  tasks.length >= taskLimit
                }
              />
            </div>

            <button
              className="button button-primary button-small self-start"
              disabled={
                busy ||
                tasks.length >= taskLimit
              }
              type="submit"
            >
              <Icon name="plus" />

              {busy
                ? "Saving..."
                : "Add task"}
            </button>
          </form>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <Icon name="leaf" />

              <h3>No tasks yet.</h3>

              <p className="muted">
                Your next farm task belongs here.
              </p>
            </div>
          ) : (
            <ul className="task-list mt-5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${
                    task.done
                      ? "task-done"
                      : ""
                  }`}
                >
                  <label className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() =>
                        updateTask(
                          task,
                          false
                        )
                      }
                      disabled={busy}
                      className="mt-1 size-4 shrink-0 accent-[#254e3c]"
                    />

                    <span className="break-words [overflow-wrap:anywhere]">
                      {task.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="button button-light button-small shrink-0"
                    onClick={() =>
                      updateTask(
                        task,
                        true
                      )
                    }
                    disabled={busy}
                    aria-label={`Delete task: ${task.title}`}
                    title="Delete task"
                  >
                    <Icon name="close" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="dashboard-card min-w-0"
          aria-labelledby="farm-heading"
        >
          <h2
            id="farm-heading"
            className="font-serif text-2xl"
          >
            Farm details
          </h2>

          <p className="muted my-3 break-words text-sm">
            {displayEmail}
          </p>

          <form
            className="auth-form"
            onSubmit={(event) => {
                event.preventDefault();
                saveProfile(new FormData(event.currentTarget));
            }}
          >
            <fieldset
              disabled={busy}
              className="auth-form min-w-0 border-0 p-0"
            >
              <FarmerFields
                metadata={profile ?? metadata}
              />

              <button
                type="submit"
                className="button button-secondary"
              >
                <Icon name="check" />

                {busy
                  ? "Saving..."
                  : "Save farm details"}
              </button>
            </fieldset>
          </form>
        </section>
      </div>
    </>
  );
}