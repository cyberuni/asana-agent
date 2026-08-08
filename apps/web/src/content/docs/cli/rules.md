---
title: Rules
description: Fire an Asana automation rule from a script or CI job.
sidebar:
  order: 16
---

`cyber-asana rule trigger` fires an Asana automation rule. It is the outbound half of
what the rest of the package does: instead of a script reaching into Asana and hard-coding
what should happen, it fires a rule and whoever maintains the board owns the logic — the
rule advances the task, notifies the channel, and sets the field.

```sh
cyber-asana rule trigger <rule-trigger-gid>
cyber-asana rule trigger <rule-trigger-gid> --resource <task-gid>
cyber-asana rule trigger <rule-trigger-gid> --action-data-json '{"deploy":"v2","build":"1841"}'
```

## Where the rule trigger GID comes from

The rule has to be configured in Asana with an **incoming web request** trigger. Asana
generates the `rule_trigger_gid` when you add that trigger, and it can only be copied out
of the Asana UI — **nothing in the API discovers or lists it**. Store it the way you store
any other CI secret; anyone holding it can fire the rule.

## Options

| Option | Meaning |
| --- | --- |
| `--resource <gid>` | Task GID the rule acts on. Optional — a rule that does not read a resource can be fired without one |
| `--action-data-json <json>` | Free-form JSON object of variables the rule's action can read. Must be an object, in the same style as `task create --custom-fields-json` |

## Limits

- Asana documents this endpoint as **beta**, with `task` the only supported resource type.
- Asana answers **`402`** when the operation is above the workspace's plan level.
  cyber-asana surfaces that as a plan limitation with its own exit code (`7`) rather than a
  generic failure, so CI can tell "wrong plan" from "wrong GID".
- A successful trigger returns no payload of its own, so the command acknowledges what
  fired:

```sh
$ cyber-asana rule trigger 1204567890 --resource 1209876543
Triggered  1204567890
Resource   1209876543
```

`--json` and `--toon` are honored like every other command:

```sh
$ cyber-asana rule trigger 1204567890 --resource 1209876543 --json
{
  "triggered": true,
  "rule_trigger_gid": "1204567890",
  "resource": "1209876543"
}
```

## MCP

The same operation is `asana_rule_trigger`, taking `rule_trigger_gid`, `resource`, and
`action_data`.
