import { Datetime } from "aws-sdk/clients/costoptimizationhub";
import { DateTime } from "aws-sdk/clients/devicefarm";

export type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  password: string;
  college: string;
  year: string;
  image: string;
  cover_image: string;
  courses: string;
  theme: string;
  fraternity: string;
  relationship_status: string;
  major: string;
  createdAt: Date;
  updatedAt: Date;
  token: string | null;
  verification_token: string | null;
  verification_token_expiry: string | null;
  verification_secret: string | null;
  isUserVerified: boolean;
  resetPasswordVerification: boolean;
  groups: Group[] | null;
  clubs: string;
  theme_color: string;
};

export type User2 = {
  id: number;
  username: string;
  name: string;
  email: string;
  password: string;
  college: string;
  year: string;
  image: string;
  cover_image: string;
  courses: string;
  theme: string;
  fraternity: string;
  relationship_status: string;
  major: string;
  createdAt: Date;
  updatedAt: Date;
  token: string | null;
  verification_token: string | null;
  verification_token_expiry: string | null;
  verification_secret: string | null;
  isUserVerified: boolean;
  resetPasswordVerification: boolean;
  clubs: string;
  theme_color: string;
};

export type Group = {
  id: number;
  name: string;
  image: string;
  admins: number[];
  college: string;
  description: string;
  createdAt: Datetime;
  updatedAt: Datetime;
};

type counts = {
  users: number;
};

export type Group2 = {
  id: number;
  name: string;
  image: string;
  admins: number[];
  college: string;
  description: string;
  createdAt: Datetime;
  updatedAt: Datetime;
  _count: counts;
};

export type Event = {
  id: number;
  adminId: number;
  name: string;
  location: string;
  description: string;
  startTime: string;
  endTime: string;
  image: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  type?: string;
};

export type Album = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  theme_name: string;
  album_cover: string;
  album_photos: string[];
  createdAt: DateTime;
  updatedAt: DateTime;
  type?: string;
};
