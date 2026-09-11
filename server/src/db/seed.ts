import type Database from 'better-sqlite3';
import type { Difficulty } from '../models/problem';

interface SeedProblem {
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
}

const problems: SeedProblem[] = [
  {
    title: 'Parking Lot System',
    description: 'Design a parking lot that manages vehicles, parking spots, entrances, and exits. The system should assign suitable spots, track availability, and calculate fees when vehicles leave.',
    difficulty: 'Easy',
    tags: ['OOP', 'design-patterns', 'state-management']
  },
  {
    title: 'Elevator System',
    description: 'Design an elevator system that serves requests across multiple floors and elevators. It should coordinate scheduling, movement, door states, and emergency handling while keeping wait times reasonable.',
    difficulty: 'Medium',
    tags: ['OOP', 'state-machine', 'concurrency']
  },
  {
    title: 'Library Management System',
    description: 'Design a library system that manages books, physical copies, members, borrowing, returns, and reservations. The system should enforce lending rules and track overdue items and fines.',
    difficulty: 'Easy',
    tags: ['OOP', 'domain-modeling', 'SOLID']
  },
  {
    title: 'Rate Limiter',
    description: 'Design a rate limiter that controls how many requests a client can make within a time window. It should support concurrent requests, predictable rejection behavior, and a strategy that can scale across application instances.',
    difficulty: 'Hard',
    tags: ['concurrency', 'distributed-systems', 'algorithms']
  }
];

export function seedProblems(database: Database.Database): number {
  console.log('[seed] seedProblems called');

  try {
    const existing = database.prepare('SELECT COUNT(*) AS count FROM problems').get() as { count: number };
    console.log(`[seed] problems row count before seeding: ${existing.count}`);

    if (existing.count > 0) {
      console.log('[seed] skipping seed because problems table is not empty');
      return 0;
    }

    const insert = database.prepare(`
      INSERT INTO problems (title, description, difficulty, tags)
      VALUES (@title, @description, @difficulty, @tags)
    `);
    const insertMany = database.transaction((seedProblems: SeedProblem[]) => {
      for (const problem of seedProblems) {
        insert.run({
          ...problem,
          tags: JSON.stringify(problem.tags)
        });
      }
    });

    insertMany(problems);
    console.log(`[seed] inserted ${problems.length} problems successfully`);
    return problems.length;
  } catch (error) {
    console.error('[seed] SQL error while seeding problems:', error);
    throw error;
  }
}

if (require.main === module) {
  const { default: database } = require('./db') as { default: Database.Database };
  const inserted = seedProblems(database);
  console.log(inserted > 0 ? `Inserted ${inserted} problems.` : 'Problems already seeded.');
  database.close();
}
