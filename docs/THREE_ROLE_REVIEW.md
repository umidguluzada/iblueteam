# Three-role rule review

This edition uses the original HTML/CSS/JavaScript and FastAPI platform. No AI, Ollama, React, CSRF module, or V11 Evidence Center is included.

Roles:
- Admin: manages users and rules; can approve or reject another user's pending review.
- Analyst: creates and edits draft rules, submits rules for review, cannot approve or reject.
- Reviewer: views rules and approves/rejects pending reviews; cannot create rules.

Workflow:
1. Sign in as admin and create an analyst and a reviewer in user management.
2. Sign in as analyst, create a draft rule, and choose 'Yoxlamaya göndər'.
3. Sign in as reviewer or admin, navigate to Rules > Qayda yoxlamaları.
4. Choose 'Təsdiqlə' to activate the rule or 'Rədd et' with a reason to return it to draft.

'Pending' is not timed: it remains until an authorized user decides. A user cannot approve their own submission.

This is a demonstration build, not a production security certification. The original token-based login system is retained.
