# Channels

Channel workflows can list, create, update, reorder, move between categories, uncategorize, and delete channels when the bot has the required permissions. Text, announcement, forum, stage, and voice channels share the resource model, but their valid fields differ.

Provisioning scripts should create categories first, create children with a `parent` or category ID, then apply names, topics, positions, and permission overwrites. A channel can be moved by updating its parent; setting the parent to null makes it uncategorized. Use dry-run for a preview and explicit approval for deletion.

See the [examples index](../../examples/README.md), especially the safe [channel workflow](../../examples/safe-channel-workflow.ds).
