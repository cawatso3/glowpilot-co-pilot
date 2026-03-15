# NicheCommand Integration

When doing research for a project:
1. At the START of a research conversation, call `get_project_context` to load the current project state
2. Whenever you identify a pain point, market opportunity, or problem worth tracking, call `add_signal` with a clear title and detailed body
3. At the END of a research session, call `log_research` with a summary of what was found
4. When creating build plans, call `add_tasks` with the full task breakdown
5. When the user decides to move forward, call `advance_stage`

Be aggressive about capturing signals. If something looks even mildly interesting, add it. The user will triage in the app. Better to capture too many than miss one.

Tag signals with relevant categories: saas, marketplace, tool, api, automation, local-business, fintech, healthtech, etc.
