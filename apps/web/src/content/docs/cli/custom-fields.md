---
title: Custom fields
description: Discover the custom field and enum-option GIDs that task writes are keyed by.
sidebar:
  order: 16
---

Asana keys custom field writes by GID — `task create` and `task update` take
`--custom-field <gid>=<value>` and `--custom-fields-json '{"<gid>":"<value>"}'`. This group
is how you find those GIDs without leaving the CLI.

It is read-only. Defining or editing fields is workspace administration and is not wrapped —
see [API coverage](/cyber-asana/reference/api-coverage/).

## Commands

```sh
cyber-asana custom-field list
cyber-asana custom-field get <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--workspace-gid <gid>` / `--workspace <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |

`list` requests `gid,name,resource_subtype` by default. The subtype is the part that matters
when you go to write: it tells you whether the value you send is text, a number, or an enum
option GID.

```
NAME      TYPE    ID
--------  ------  ----------
Priority  enum    1201234567
Estimate  number  1201234568
```

## Enum options

Enum options are nested inside the field, so `get` covers option discovery:

```sh
cyber-asana custom-field get 1201234567
```

```
Name  Priority
ID    1201234567
Type  enum

OPTION  ID          ENABLED
------  ----------  -------
High    1209876543  yes
Medium  1209876544  yes
Low     1209876545  yes
```

## Setting a value

Feed the GIDs straight into a task write:

```sh
# enum — the value is the option GID
cyber-asana task update <task-gid> --custom-field 1201234567=1209876543

# number or text — the value is literal
cyber-asana task update <task-gid> --custom-field 1201234568=5
```

See [Tasks](/cyber-asana/cli/tasks/) for the full set of write options.
