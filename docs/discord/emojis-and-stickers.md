# Emojis and stickers

Emoji and sticker operations are guild-scoped. Discript can inventory available assets and, where Discord permissions and asset limits allow, create, update, and delete them. Names, image formats, roles, and availability rules are validated by Discord.

Treat uploaded asset data as sensitive input: keep files local, avoid embedding credentials in scripts, and use dry-run to validate metadata before upload. Deleting an asset is destructive and requires explicit approval.

Use the [CRUD matrix](crud-matrix.md) for current operation coverage and the [resource model](resource-model.md) for normalized result conventions.
