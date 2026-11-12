import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Users
  const alex = await prisma.user.upsert({
    where: { email: 'alex@asd.app' },
    update: {},
    create: { email: 'alex@asd.app', name: 'Alex', color: '#0F766E' },
  });
  const priya = await prisma.user.upsert({
    where: { email: 'priya@asd.app' },
    update: {},
    create: { email: 'priya@asd.app', name: 'Priya', color: '#B26A00' },
  });
  const sam = await prisma.user.upsert({
    where: { email: 'sam@asd.app' },
    update: {},
    create: { email: 'sam@asd.app', name: 'Sam', color: '#1F7A4D' },
  });

  // Agents
  const agents = [
    { id: 'researcher', name: 'Researcher', description: 'Researches and compares options', capabilities: ['Web', 'Summarise'] },
    { id: 'builder', name: 'Builder', description: 'Builds and deploys dashboards', capabilities: ['Code', 'Deploy'] },
    { id: 'planner', name: 'Planner', description: 'Manages your calendar and tasks', capabilities: ['Calendar', 'Reminders'] },
    { id: 'reviewer', name: 'Reviewer', description: 'Reads and summarizes documents', capabilities: ['Docs', 'Contracts'] },
  ];
  for (const a of agents) {
    await prisma.agent.upsert({
      where: { id: a.id },
      update: { name: a.name, description: a.description, capabilities: JSON.stringify(a.capabilities) },
      create: { id: a.id, name: a.name, description: a.description, capabilities: JSON.stringify(a.capabilities) },
    });
  }

  // Sessions
  const sessionDefs = [
    { id: 'vacuum', title: 'Vacuum research', leadAgentId: 'researcher', members: [alex.id] },
    { id: 'project', title: 'Project design', leadAgentId: 'researcher', members: [alex.id, priya.id, sam.id] },
    { id: 'weekend', title: 'Weekend plan', leadAgentId: 'planner', members: [alex.id] },
    { id: 'contract', title: 'Read the contract', leadAgentId: 'reviewer', members: [alex.id, priya.id] },
    { id: 'kitchen', title: 'Kitchen reno budget', leadAgentId: 'planner', members: [alex.id] },
  ];
  for (const s of sessionDefs) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        title: s.title,
        leadAgentId: s.leadAgentId,
        members: { create: s.members.map((userId) => ({ userId, role: userId === alex.id ? 'owner' : 'editor' })) },
      },
    });
  }

  // Artifact
  await prisma.artifact.upsert({
    where: { id: 'shortlist' },
    update: {},
    create: {
      id: 'shortlist',
      sessionId: 'vacuum',
      kind: 'table',
      name: 'Shortlist',
      authorId: 'builder',
      content: JSON.stringify({ kind: 'table', columns: ['Model', 'Price', 'Warranty'], rows: [['Shark RV1000', '£429', '2 yr']] }),
    },
  });

  // Jobs
  const jobs = [
    { id: 'build-dash', title: 'Build dashboard', agentId: 'builder', status: 'running', progress: 0.66, steps: ['Scaffold', 'Wire data', 'Deploy'] },
    { id: 'scrape', title: 'Scrape reviews', agentId: 'researcher', status: 'running', progress: 0.3, steps: ['Gather sources', 'Extract data', 'Summarize'] },
    { id: 'weekly', title: 'Weekly summary', agentId: 'researcher', status: 'scheduled', progress: 0, steps: ['Gather', 'Summarize', 'Email'] },
    { id: 'invoices', title: 'Import invoices', agentId: 'builder', status: 'failed', progress: 0, steps: ['Parse', 'Validate', 'Import'] },
  ];
  for (const j of jobs) {
    await prisma.job.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        title: j.title,
        agentId: j.agentId,
        status: j.status,
        progress: j.progress,
        recurring: j.id === 'weekly' ? 'Every Monday · 9:00' : null,
        steps: {
          create: j.steps.map((title, i) => ({
            title,
            status: j.status === 'running' && i < Math.floor(j.progress * j.steps.length) ? 'done' : j.status === 'running' && i === Math.floor(j.progress * j.steps.length) ? 'running' : 'queued',
          })),
        },
        logs: { create: [{ level: j.status === 'failed' ? 'error' : 'info', text: j.status === 'failed' ? '2 validation errors' : 'Started' }] },
      },
    });
  }

  // A seeded agent message + pending approval (so Home "Needs you" has data).
  const seedMessage = await prisma.message.upsert({
    where: { id: 'seed-msg-1' },
    update: {},
    create: {
      id: 'seed-msg-1',
      sessionId: 'vacuum',
      role: 'agent',
      authorId: 'researcher',
      body: 'Found three vacuums in budget. Builder is pulling live prices & specs.',
      status: 'complete',
    },
  });
  await prisma.approval.upsert({
    where: { messageId: seedMessage.id },
    update: {},
    create: {
      sessionId: 'vacuum',
      messageId: seedMessage.id,
      title: 'Send message to Priya',
      meta: 'Email · ready to send',
      kind: 'action',
      status: 'pending',
    },
  });

  console.log('Seed complete');
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
