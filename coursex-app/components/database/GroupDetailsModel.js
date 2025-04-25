import { Model } from "@nozbe/watermelondb";
import { field, date, json, text } from "@nozbe/watermelondb/decorators";

export default class GroupDetails extends Model {
  static table = "group_details";

  @field("group_id") group_id;
  @json("admins", (raw) => raw) admins;
  @text("college") college;
  @text("description") description;
  @text("image") image;
  @text("name") name;
  @text("theme") theme;
  @text("type") type;
  @json("group_members", (raw) => raw) group_members;
}
