import { Static, t } from "elysia";

const UserSchema = t.Object({
  id: t.String(),
  username: t.String(),
  discriminator: t.String(),
  avatar: t.Nullable(t.String()),
  global_name: t.Optional(t.Nullable(t.String())),
});

const GuildSchema = t.Object({
  id: t.String(),
  name: t.String(),
  icon: t.Nullable(t.String()),
  owner: t.Boolean(),
  permissions: t.String(),
  iconUrl: t.Optional(t.Nullable(t.String())),
  botInGuild: t.Optional(t.Nullable(t.Boolean())),
  inviteUrl: t.Optional(t.Nullable(t.String())),
});

export const SessionSchema = t.Object({
  oauthState: t.Optional(t.String()),
  discordAuth: t.Optional(
    t.Object({
      accessToken: t.String(),
      user: UserSchema,
      guilds: t.Array(GuildSchema),
    }),
  ),
});

export type SessionData = Static<typeof SessionSchema>;
