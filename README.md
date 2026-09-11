# lld-practice-platform

A monolithic full-stack platform for practicing low-level design, submitting solutions, and receiving structured AI-assisted feedback.

## Live-Demo: https://drive.google.com/file/d/1blbLb1cZoLHC8qVPOY5lsS7klopHpy0R/view?usp=sharing

## Setup

- Node.js 18 or newer
- npm

Install dependencies in both applications:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env` from the example and add an OpenAI API key:

```bash
cd server
cp .env.example .env      # Mac/Linux
copy .env.example .env    # Windows
```

Set `OPENAI_API_KEY` in `server/.env`. The server creates `server/data.sqlite` and seeds four problems automatically on first start.

Start the server:

```bash
cd server
npm run dev
```

The API runs at `http://localhost:3000`.

In a second terminal, start the client:

```bash
cd client
npm run dev
```

The client runs at the URL printed by Vite, usually `http://localhost:5173`.

For a server on another port, set `PORT`. For local development against that port, set the Vite proxy target before starting the client:

```powershell
$env:PORT="3010"
npm run dev
```

```powershell
$env:VITE_API_PROXY_TARGET="http://localhost:3010"
npm run dev
```

## Architecture

The project is a single repository with an Express and TypeScript server, a React/Vite client, and a local SQLite database accessed through `better-sqlite3`. The server owns schema initialization, problem seeding, REST routes, deterministic checks, and OpenAI evaluation; the client uses React Router and plain `fetch` to browse problems, submit attempts, poll evaluation status, display feedback, and compare retry history. There are no separate services or external database requirements.

## API examples

Check the server:

```bash
curl http://localhost:3000/api/health
```

List seeded problems:

```bash
curl http://localhost:3000/api/problems
```

Get one problem:

```bash
curl http://localhost:3000/api/problems/1
```

Submit an attempt. The response is immediate and has status `Submitted`:

```bash
curl -X POST http://localhost:3000/api/attempts \
	-H "Content-Type: application/json" \
	-d '{"problemId":1,"submissionText":"Use OOP classes for vehicles, parking spots, and state-management strategies.","submissionType":"text"}'
```

Trigger evaluation separately, replacing `1` with the `id` returned by the submit response:

```bash
curl -X POST http://localhost:3000/api/attempts/1/evaluate
```

Poll that same attempt until its status is `Completed` or `Failed`:

```bash
curl http://localhost:3000/api/attempts/1
```

List retry history for a problem:

```bash
curl "http://localhost:3000/api/attempts?problemId=1"
```

The evaluation response contains an overall score and five criteria results, each with a criterion, score, evidence, and suggestion.

SQLite data is stored in `server/data.sqlite` and is created automatically on first start.

See [AI_USAGE.md](AI_USAGE.md) for implementation decisions, evaluation criteria, and MVP scope exclusions.
