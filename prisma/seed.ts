import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config(); // loads .env file

const prisma = new PrismaClient();

const COLLEGES = [
  "R. N. College Hajipur",
  "Patna University",
  "Magadh University",
  "L.N. Mithila University",
  "Bhupendra Narayan Mandal University",
  "Ranchi University",
  "Nalanda Open University",
  "Tilka Manjhi Bhagalpur University",
];

const SESSIONS = ["2024-25", "2025-26", "2023-24"];

const NAMES = [
  "Ankit Kumar", "Priya Singh", "Rahul Sharma", "Pooja Devi",
  "Amit Yadav", "Kavita Kumari", "Rajesh Paswan", "Sunita Rani",
  "Vikash Kumar", "Nisha Gupta", "Deepak Jha", "Ritu Singh",
  "Santosh Kumar", "Meera Devi", "Suresh Pandey", "Rekha Sinha",
  "Manish Thakur", "Geeta Kumari", "Arun Mishra", "Puja Verma",
];

const STATUSES = ["NEW", "LEAD", "INTERESTED", "ENROLLED", "NOT_INTERESTED"] as const;
const INTERESTS = ["HIGH", "MID", "LOW"] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("agent123", 12);

  const agent = await prisma.agent.upsert({
    where: { mobile: "9876543210" },
    update: {},
    create: {
      name: "Demo Agent",
      mobile: "9876543210",
      password: hashedPassword,
    },
  });
  console.log(`✅ Agent created: ${agent.name} (mobile: 9876543210, password: agent123)`);

  const agent2 = await prisma.agent.upsert({
    where: { mobile: "9876543211" },
    update: {},
    create: {
      name: "Rajiv Kumar",
      mobile: "9876543211",
      password: await bcrypt.hash("agent123", 12),
    },
  });
  console.log(`✅ Agent created: ${agent2.name}`);

  for (let i = 0; i < 20; i++) {
    const sr = 1001 + i;
    const existing = await prisma.account.findUnique({ where: { sr } });
    if (existing) continue;

    const account = await prisma.account.create({
      data: {
        sr,
        name: NAMES[i] || `Student ${sr}`,
        college: randomItem(COLLEGES),
        number: randomPhone(),
        session: randomItem(SESSIONS),
        status: randomItem(STATUSES),
        interest: randomItem(INTERESTS),
        followUpDate:
          Math.random() > 0.6
            ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            : null,
      },
    });

    if (Math.random() > 0.5) {
      await prisma.callHistory.create({
        data: {
          accountId: account.id,
          agentId: agent.id,
          direction: "OUTGOING",
          notes: "Explained about the course. Student showed interest.",
        },
      });
    }
  }

  console.log("✅ 20 sample leads created");
  console.log("\n📋 Login credentials:");
  console.log("   Mobile: 9876543210");
  console.log("   Password: agent123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
