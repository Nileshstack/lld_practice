# AI Usage

I used GitHub Copilot throughout this project, mostly for scaffolding and implementation once I'd already decided on the design. Here's where it helped and how I made the key calls.

## Where AI helped

- Setting up the SQLite schema for problems, attempts, and evaluations, and writing the TypeScript models around it (including mapping the DB's snake_case columns to camelCase in the API responses).
- Writing the boilerplate for the deterministic checks and drafting the system prompt sent to OpenAI for the design review.
- Wiring up the OpenAI Chat Completions call and making sure the JSON it returns is validated before it touches the database.
- Building out the React side — the problem list, the submission form, the polling-based feedback view, retry flow, and attempt history.
- A fair bit of back-and-forth debugging: chasing down a seeding bug where restarts kept duplicating rows, fixing a wrong database path, and generally getting the submit → evaluate → feedback loop to actually work end-to-end.

I stayed pretty involved at each step rather than accepting large generated chunks blindly — mainly because a couple of early passes added things I hadn't asked for (like an unrelated "Item" model that I ended up removing), so I got in the habit of reviewing before moving to the next piece.

## Why these five evaluation criteria

I picked five fixed criteria for the AI review instead of letting the model decide its own rubric each time:

1. **Requirement Understanding** — does the submission actually address what the problem asked for?
2. **Class Responsibilities** — are objects doing one clear thing, or are they vague/overloaded?
3. **Coupling/Cohesion** — do components talk to each other through narrow interfaces, or is everything tangled together?
4. **Extensibility** — could this design absorb a reasonable future change without a rewrite?
5. **Edge Cases** — did the person think about failure states, limits, and the messy inputs, not just the happy path?

Keeping the criteria fixed matters more than it might seem — it's what makes two attempts on the same problem actually comparable, instead of getting graded against a different rubric each time.

## Splitting deterministic checks from AI checks

Not everything needs an LLM call. Before anything gets sent to OpenAI, the service runs a couple of cheap checks: is the submission non-trivially long, and does it mention at least one concept tied to the problem's tags. This catches obviously incomplete submissions (empty text, or someone pasting an unrelated question) without burning an API call on them.

Everything past that point is judgment-heavy — understanding the proposed design, weighing coupling and cohesion, spotting missing edge cases — and that's squarely where the AI is useful and a rule-based check wouldn't be.

The attempt status tracks this pipeline directly: `Evaluating` while the AI call is in flight, `Completed` once a valid response is parsed and saved, `Failed` if either the deterministic check or the AI call fails. On failure the client just gets a generic message; the actual error gets logged server-side so it's still debuggable.

## What I deliberately left out

A few things I chose not to build, since they weren't needed to prove out the core loop:

- **Auth / accounts** — every attempt is tagged `anonymous`. Building out an identity system wasn't the point of this MVP.
- **Diagram submissions** — the schema allows for a diagram submission type, but the client only handles text/code right now. Rendering and parsing diagrams felt like a separate problem.
- **Multiple evaluators or model fallback** — one model, one reviewer prompt. Running a consensus across models would add real complexity for very little benefit at this stage.
- **A job queue for evaluation** — the client just polls the attempt endpoint after triggering evaluation. That's enough for a local MVP; a proper background worker felt like solving a problem I don't have yet.
- **Semantic validation for the deterministic checks** — right now it's a keyword match against the problem's tags. It's not smart, but it's fast and does the job of filtering out obviously empty submissions.
- **Production-grade logging/rate limiting** — there's console logging and basic error handling, but no metrics, tracing, or cost controls on the OpenAI calls. That's a reasonable next step, not a day-one one.