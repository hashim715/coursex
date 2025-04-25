import { tableSchema, appSchema } from "@nozbe/watermelondb/Schema";

export const MessageSchema = tableSchema({
  name: "messages",
  columns: [
    { name: "_id", type: "string" },
    { name: "sender", type: "string" },
    { name: "group_id", type: "number", isOptional: true },
    { name: "message", type: "string", isOptional: true },
    { name: "time_stamp", type: "string", isIndexed: true },
    { name: "type", type: "string" },
    { name: "status", type: "string", isOptional: true },
    { name: "image", type: "string", isOptional: true },
    { name: "images", type: "string", isOptional: true }, // Serialize object as JSON
    { name: "video", type: "string", isOptional: true },
    { name: "document", type: "string", isOptional: true },
    { name: "image_data", type: "string", isOptional: true }, // Serialize object as JSON
    { name: "video_data", type: "string", isOptional: true },
    { name: "document_data", type: "string", isOptional: true },
    { name: "cover_image", type: "string", isOptional: true },
    { name: "error", type: "boolean", isOptional: true },
    { name: "grouped", type: "boolean", isOptional: true },
    { name: "version", type: "string", isOptional: true },
  ],
});

export const GroupSchema = tableSchema({
  name: "groups",
  columns: [
    { name: "group_id", type: "number" },
    { name: "count", type: "string", isOptional: true },
    { name: "admins", type: "string", isOptional: true },
    { name: "college", type: "string" },
    { name: "description", type: "string" },
    { name: "image", type: "string", isOptional: true },
    { name: "name", type: "string" },
    { name: "theme", type: "string", isOptional: true },
    { name: "type", type: "string" },
    { name: "recent_message", type: "string", isOptional: true },
    { name: "sender", type: "string", isOptional: true },
    { name: "group_members", type: "string", isOptional: true },
  ],
});

export const GroupDetailsSchema = tableSchema({
  name: "group_details",
  columns: [
    { name: "group_id", type: "number" },
    { name: "admins", type: "string" }, // Serialize object as JSON
    { name: "college", type: "string" },
    { name: "description", type: "string" },
    { name: "image", type: "string", isOptional: true },
    { name: "name", type: "string" },
    { name: "theme", type: "string", isOptional: true },
    { name: "type", type: "string" },
    { name: "group_members", type: "string" }, // Serialize object as JSON
  ],
});

export const databaseSchema = appSchema({
  version: 1,
  tables: [MessageSchema, GroupSchema, GroupDetailsSchema],
});
