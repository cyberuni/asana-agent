---
"cyber-asana": minor
---

Make stored OAuth credentials ambient, and show the authorize URL during login.

Every command now resolves stored credentials before dispatch and refreshes the
access token when it is within a minute of expiring, so `auth login` is
something you do once rather than something each later command has to know
about. Without this, `auth login` wrote a credentials file that nothing ever
read. Precedence is `--token` > `ASANA_ACCESS_TOKEN` > `ASANA_TOKEN` > stored
credentials; a stored token occupies its own slot so `auth status` still names
the true source instead of reporting it as `--token`.

`auth status` now reports stored credentials, including the granting account
and the expiry, and lists `credentials.json` among the ignored sources when an
env var shadows it.

Credential resolution never fails a command: unreadable or unrefreshable
credentials produce a warning on stderr rather than an exception, since
`auth login` and `auth logout` are exactly what you reach for when the
credential is the problem.

`auth login` prints the authorize URL to stderr before opening the browser. On
WSL and headless machines the opener is often a no-op, and without the URL the
command simply appeared to hang.
