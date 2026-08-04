---
"cyber-asana": minor
---

Add `auth login --manual` for the out-of-band flow, `--redirect-uri` for an
explicitly registered redirect URL, and a clear message when the callback port
is taken.

Asana requires redirect URLs to be `https` and documents
`urn:ietf:wg:oauth:2.0:oob` for native and command-line apps, so a loopback
`http://localhost` URL is not always registrable — the flow then fails with
"The redirect_uri parameter does not match a valid url for the application".
`--manual` runs the documented path instead: Asana displays the code, you paste
it, and no local port is opened. It also works over SSH.

`--redirect-uri` covers apps registered against some other URL, and the
callback listener binds the port named by that URL.

A callback port already held by an earlier login previously crashed with an
unhandled EADDRINUSE stack trace; it now explains what is holding the port and
what to do about it.
