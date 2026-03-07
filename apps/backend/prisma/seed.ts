import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const family = await prisma.family.create({
    data: {
      name: "演示家庭-0001",
      parents: {
        create: {
          phone: "13800000001",
          nickname: "家长0001",
          role: "PRIMARY"
        }
      }
    }
  });

  await prisma.child.create({
    data: {
      familyId: family.id,
      name: "小明",
      gender: "MALE",
      birthDate: new Date("2016-01-01"),
      grade: 4,
      k12Stage: "MIDDLE_PRIMARY",
      profile: {
        create: {
          learningStyle: { visual: 0.7, auditory: 0.5, kinesthetic: 0.4 },
          attentionSpan: 18,
          interests: ["动物", "太空"]
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
