# HackTok

Use Bun. This is a React + Vite feed served by a Cloudflare Worker.

- The user manages dev services. Reuse the server on port 5173. Do not start,
  restart, or switch ports yourself. Check outside the sandbox before reporting
  a server unavailable. A worktree may run a separate port if explicitly needed.
- Use the in-app browser for previews; use Microsoft Edge if a separate browser
  is needed. Do not launch Chromium from the restricted shell sandbox.
- No tests, test framework, or test scripts. Verify with the existing static
  checks, build, and manual browser interaction.
- Keep videos full-screen and the interface as overlays. Preserve the original
  framing; rotation is explicit. Mount one YouTube player at a time.
- Custom-hook edits trigger a full page reload through Vite's config. Keep this
  safeguard while the React transform omits refresh tracking for hook modules.
- Keep the full catalog in the Worker. Return pages through `/api/feed`.
- Do not download or rehost videos. Preserve source attribution and original links.
- Regenerate `worker-configuration.d.ts` with `bun run cf:types` after changing
  Wrangler bindings. Never maintain a duplicate Env interface by hand.
- `package.json` is the command source of truth. Run `bun run check` and
  `bun run build` before handing off changes. Local policy lives in `.pokayoke`.

Keep explanations brief and concrete. Signed Git operations may need to run
outside the sandbox so the user can complete 1Password signing.
