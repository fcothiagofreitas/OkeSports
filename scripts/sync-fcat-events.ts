import { syncFcatRoadRaces } from '../src/lib/external-events/sync';

async function main() {
  const yearsArg = process.argv[2];
  const years = yearsArg
    ? yearsArg
        .split(',')
        .map((year) => Number(year.trim()))
        .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
    : undefined;

  const result = await syncFcatRoadRaces(years);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../src/lib/db');
    await prisma.$disconnect();
  });
