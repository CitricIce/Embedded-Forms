# Sheet Forms

Embed your own HTML forms on any website and send submissions straight to a Google Sheet. No Google Forms, no paid service, no server to run.

## How it works

1. A small Google Apps Script attached to your sheet acts as the backend (`Code.gs`).
2. One script tag on your site (`sheet-forms.js`) takes over any form marked `data-sheet-form` and posts it to that backend.
3. Each submission becomes a new row. Column headers come from your input `name`s, and new fields add new columns automatically.

## Setup (about 5 minutes)

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**. Delete the starter code and paste in `Code.gs`.
3. Edit the config at the top if you need to:
   - `ALLOWED_SHEETS`: the tabs forms can write to (for example `['Contact', 'Newsletter']`)
   - `NOTIFY_EMAIL`: an email address that gets a message for every submission
4. Click **Deploy > New deployment**, pick type **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Approve the permissions prompt and copy the **Web app URL** (it ends in `/exec`).
6. On your site:

```html
<form data-sheet-form="https://script.google.com/macros/s/XXXX/exec" data-sheet="Contact">
  <input name="Name" required>
  <input name="Email" type="email" required>
  <textarea name="Message"></textarea>
  <button type="submit">Send</button>
</form>
<script src="/sheet-forms.js"></script>
```

Host `sheet-forms.js` with your site, or paste its contents into a `<script>` tag. It works with Webflow, Squarespace, WordPress, Framer or plain HTML. Anywhere you can add custom code works.

## Form options

| Attribute | What it does |
|---|---|
| `data-sheet-form` | Apps Script URL (required) |
| `data-sheet` | Tab name to write to. Defaults to `Submissions` |
| `data-success` | Message shown after a good submit |
| `data-error` | Message shown after a failed submit |
| `data-redirect` | URL to send people to after a good submit |

Style the result with `form[data-state="sending" | "success" | "error"]`, or listen for the `sheetform:success` and `sheetform:error` events (for analytics, for example).

Checkboxes that share a name get joined into one cell ("A, B, C"). The script skips file uploads.

## What's built in

- **Spam protection:** a hidden honeypot field plus a minimum fill time. Bots get a fake "ok" and nothing gets saved.
- **Formula injection protection:** values starting with `=`, `+`, `-` or `@` get stored as text.
- **Safe concurrency:** a script lock stops simultaneous submissions from overwriting each other.
- **Tab allowlist:** nobody can create random tabs in your sheet.
- **Extra columns:** every row also gets a timestamp and the page URL it came from.

## Updating the script

After editing `Code.gs`, go to **Deploy > Manage deployments > Edit > Version: New version**. That keeps the same URL. Making a brand new deployment gives you a new URL.

## Limits

Google allows roughly 20k script runs a day on free accounts, which covers most sites easily. Each submission takes about 1 to 2 seconds.
