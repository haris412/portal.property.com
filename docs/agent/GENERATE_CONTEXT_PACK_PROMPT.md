# Generate LocateHome Admin Context Pack Prompt

Copy/paste this prompt into an AI coding agent when the admin repository changes and the documentation context pack should be regenerated.

```text
You are working inside the LocateHome Admin repository.

Task:
Inspect the current repository and update the AI documentation/context-pack based only on the code that actually exists in this admin repo.

This is documentation-only.

Do not modify app source code.
Do not modify Angular, TypeScript, SCSS, route, service, package, or config files.
Do not invent features.
Do not copy content from the user-facing LocateHome app.
Keep the docs repo-specific.
Clearly mark uncertainty where behavior is not visible from the files.

Preserve this exact file/folder structure:

docs/
  agent/
    context-pack/
      00_OVERVIEW.md
      01_ARCHITECTURE.md
      02_IMPLEMENTED_FEATURES.md
      03_REUSABLE_COMPONENTS.md
      04_DEVELOPMENT_RULES.md
      05_API_AND_DATA_FLOW.md
      06_SECURITY_AND_SSR.md
    BROWSER_AGENT_CONTEXT.md
    GENERATE_CONTEXT_PACK_PROMPT.md
  scss-system.md

Update all files under docs/agent/context-pack/.
Update docs/agent/BROWSER_AGENT_CONTEXT.md.
Update docs/scss-system.md if styling changed.
Keep docs/agent/GENERATE_CONTEXT_PACK_PROMPT.md aligned with this structure.

Inspection requirements:
- Read package.json, angular.json, tsconfig files, app config, app routes, admin routes, environment files.
- Inspect admin pages, layout, components, resolver, guards, interceptor, services, models, shared UI, dialogs, and styles.
- Inspect global styles and relevant component SCSS.
- Determine whether SSR exists. If not found, explicitly say SSR was not identified.
- Document only implemented features.
- Do not claim backend behavior beyond service URLs, request payloads, response normalizers, guards, and frontend code.

Final verification:
- Confirm the exact docs structure exists.
- Confirm docs/ai-context/ was not created.
- Confirm no admin-* standalone doc filenames were created.
- Confirm no app source files were modified.
- Confirm docs contain finalized, repo-specific content.
- Provide a short summary of what was updated.
```
