/**
 * Google Cloud Pub/Sub client for bidirectional communication
 * with the GPU image generation service.
 *
 * Flow:
 *   CMS --publish--> [image-gen-tasks] --> Service API (GPU)
 *   CMS <--webhook-- [image-gen-results] <-- Service API (GPU)
 */

import { PubSub } from "@google-cloud/pubsub";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "flexme-now";
export const TASKS_TOPIC = process.env.PUBSUB_TASKS_TOPIC || "image-gen-tasks";
export const RESULTS_TOPIC =
  process.env.PUBSUB_RESULTS_TOPIC || "image-gen-results";

let _pubsub: PubSub | null = null;

function getPubSub(): PubSub {
  if (!_pubsub) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      _pubsub = new PubSub({ projectId: PROJECT_ID, credentials });
    } else {
      // Local dev: uses Application Default Credentials (gcloud CLI)
      _pubsub = new PubSub({ projectId: PROJECT_ID });
    }
  }
  return _pubsub;
}

// ── Message types ──

export interface TaskMetadata {
  source: "cms" | "api" | "frontend";
  template_id?: string;
  story_id?: string;
  chapter_index?: number;
  content_type?: "template" | "story";
  slug?: string;
  version?: string;
  tags?: string[];
  category?: string;
  created_by?: string;
  output_gcs_path?: string;
  input_gcs_path?: string;
  [key: string]: unknown;
}

export interface GenTaskMessage {
  task_id: string;
  type: "template" | "story";
  content_id: string;
  chapter_index?: number;
  model: string;
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  seed: number;
  input_gcs_path: string;
  output_gcs_path: string;
  // Full metadata for tracking & querying on service side
  slug?: string;
  version?: string;
  tags?: string[];
  category?: string;
  created_by?: string;
  metadata?: TaskMetadata;
}

export interface GenResultMessage {
  task_id: string;
  status: "done" | "error" | "loading" | "generating";
  output_gcs_path?: string;
  image_url?: string;
  error?: string;
  model?: string;
  elapsed_seconds?: number;
  finished_at?: number;
  metadata?: TaskMetadata;
}

// ── Publish ──

export async function publishGenTask(task: GenTaskMessage): Promise<string> {
  const pubsub = getPubSub();
  const topic = pubsub.topic(TASKS_TOPIC);

  const messageId = await topic.publishMessage({
    json: task,
    attributes: {
      task_id: task.task_id,
      type: task.type,
      model: task.model,
      content_id: task.content_id,
    },
  });

  console.log(
    `[PubSub] Published task ${task.task_id.slice(0, 8)} to ${TASKS_TOPIC} (msg=${messageId})`
  );
  return messageId;
}
