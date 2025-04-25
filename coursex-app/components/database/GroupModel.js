import { Model } from "@nozbe/watermelondb";
import { field, date, json, text } from "@nozbe/watermelondb/decorators";

export default class Group extends Model {
  static table = "groups";

  @field("group_id") group_id;
  @json("count", (raw) => raw) count;
  @json("admins", (raw) => raw) admins;
  @text("college") college;
  @text("description") description;
  @text("image") image;
  @text("name") name;
  @text("theme") theme;
  @text("type") type;
  @text("recent_message") recent_message;
  @text("sender") sender;
  @json("group_members", (raw) => raw) group_members;
}
