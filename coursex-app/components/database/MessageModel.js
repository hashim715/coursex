import { Model } from "@nozbe/watermelondb";
import { field, date, json, text } from "@nozbe/watermelondb/decorators";

export default class Message extends Model {
  static table = "messages";

  @field("_id") _id;
  @field("sender") sender;
  @field("group_id") group_id;
  @text("message") message;
  @date("time_stamp") time_stamp;
  @field("type") type;
  @json("status", (raw) => raw) status;
  @text("image") image;
  @json("images", (raw) => raw) images;
  @text("video") video;
  @text("document") document;
  @json("image_data", (raw) => raw) image_data;
  @json("video_data", (raw) => raw) video_data;
  @json("document_data", (raw) => raw) document_data;
  @text("cover_image") cover_image;
  @field("error") error;
  @field("grouped") grouped;
  @field("version") version;
}
