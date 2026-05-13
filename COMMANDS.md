# Commands Reference

A complete reference of all Slash Commands and Context Menus available in this bot.

> [!TIP]
> Each section is collapsible. Click the **▶** arrow next to a command name to expand and view its details.

---

## Slash Commands

<details>
<summary><h3><code>/ping</code></h3></summary>

**Description:** Ping pong Command with latency measurement.

Responds with the current round-trip latency in milliseconds.

| Availability | Value |
| ------------ | ----- |
| Guild        | ✅    |
| Bot DM       | ✅    |
| User Install | ✅    |

</details>

---

<details>
<summary><h3><code>/endfield</code></h3> (contains subcommands)</summary>

**Description:** A related endfield commands.

A command group containing subcommands for managing your Endfield account, profile, and daily check-in.

| Availability | Value |
| ------------ | ----- |
| Guild        | ✅    |
| Bot DM       | ✅    |
| User Install | ✅    |

#### Subcommands

<details>
<summary><h5><code>/endfield profile [target]</code></h5></summary>

**Description:** Show the Endfield in-game profile and check-in.

Displays the Endfield profile and check-in status for yourself or another user.

| Option   | Type | Required | Description                                                                    |
| -------- | ---- | -------- | ------------------------------------------------------------------------------ |
| `target` | User | No       | Specifies the user that you want to see. Defaults to yourself if not provided. |

</details>

---

<details>
<summary><h5><code>/endfield checkin</code></h5></summary>

**Description:** Manually do check-in.

Triggers a manual daily check-in for your Endfield account immediately.

</details>

---

<details>
<summary><h5><code>/endfield set-account-token &lt;token&gt;</code></h5></summary>

**Description:** Set the account token for Endfield (Automatically daily once after successful set).

Links your Endfield account to your Discord account using the account token.

_Note: You can follow [Retrieving Your Endfield Account Token](./README.md/#retrieving-your-endfield-account-token) guide to obtain the account token to set._

| Option  | Type                 | Required | Description                   |
| ------- | -------------------- | -------- | ----------------------------- |
| `token` | String (0–100 chars) | Yes      | The account token you've got. |

</details>

---

<details>
<summary><h5><code>/endfield delete-account-token</code></h5></summary>

**Description:** Delete/Remove account token from your Discord account.

Removes your linked Endfield account token from your Discord account.

</details>

---

<details>
<summary><h5><code>/endfield set-visibility &lt;visibility&gt;</code></h5></summary>

**Description:** Set the visibility of your Endfield profile if you want the other users to see it.

Controls whether your Endfield profile is visible to other users via `/endfield profile` or the **Endfield Profile** context menu. Supports autocomplete — your current state is shown in the option list.

| Option       | Type                  | Required | Description                                                                 |
| ------------ | --------------------- | -------- | --------------------------------------------------------------------------- |
| `visibility` | String (autocomplete) | Yes      | `public` or `private`. The autocomplete list highlights your current state. |

</details>

</details>

---

## Context Menus

<details>
<summary><h3>User Context Menu — <code>Endfield Profile</code></h3></summary>

**Type:** User  
**Description:** View the Endfield in-game profile and check-in status of any user directly from their profile context menu.

Right-click (or long-press on mobile) on any user → **Apps** → **Endfield Profile**.  
Equivalent to running `/endfield profile target:<user>`.

| Availability | Value |
| ------------ | ----- |
| Guild        | ✅    |
| Bot DM       | ✅    |
| User Install | ✅    |

</details>
