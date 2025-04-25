import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { migrations } from "./migrations";

import Message from "./MessageModel";
import Group from "./GroupModel";
import GroupDetails from "./GroupDetailsModel";
import { databaseSchema } from "./schema";

const adapter = new SQLiteAdapter({
  schema: databaseSchema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.log(error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Message, Group, GroupDetails],
});
