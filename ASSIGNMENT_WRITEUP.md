# BookLeaf Author Support Portal — Assignment Write-up

## Priorities

The primary goal was to build a usable support workflow for authors and administrators. Authors can sign in, view their own book and royalty information, create support tickets, and follow ticket conversations and statuses. Administrators can review tickets, manage categories, priorities and statuses, add internal notes, and use AI-generated response drafts to assist support operations.

Security and usability were important priorities. The backend uses JWT authentication, password hashing, role-based access control, request validation, and author-scoped data access. The interface separates author and administrator workflows, while the API and MongoDB models keep the application modular.

## Technical and Product Trade-offs

I chose React with Vite for the frontend, Express for the REST API, and MongoDB with Mongoose for flexible ticket and book records. This stack supports rapid development and straightforward deployment. AI classification and response drafting use a dedicated backend module so that provider configuration and prompt logic remain separate from the API routes.

The AI is an assistant rather than an autonomous decision-maker: administrators can review and edit drafted responses before sending them. If classification fails, ticket creation can continue with fallback values. Local Ollama inference supports development without per-request model API fees, although it requires a machine capable of running the model. Hosted AI providers may improve deployment convenience but can introduce usage costs.

To keep the scope manageable, some production concerns remain simplified, including advanced ticket analytics, richer audit history, and more comprehensive operational monitoring.

## Production Evolution

Before a full production launch, I would add automated unit, integration, and end-to-end tests; enforce strict category and priority validation; improve urgent-ticket ordering and date filters; and implement structured audit logs and monitoring. I would also add rate limiting, stronger attachment scanning and storage controls, automated backups, and a formal retention policy.

For AI, I would evaluate classification accuracy against representative tickets, version prompts, validate structured outputs, limit sensitive context, and track latency, failure rates, and costs. I would add human feedback to improve the knowledge base and ensure AI responses never promise unsupported outcomes. Finally, I would introduce CI/CD checks, environment-specific configuration, and load testing before scaling to more authors and support staff.

The implementation focuses on delivering the core author-to-support workflow while keeping the architecture extensible for these future improvements.