import prisma from '@/lib/db';
import { ExternalEventSource } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { fetchFcatRoadRacesByYear } from './fcat';

export type SyncExternalEventsResult = {
  fetched: number;
  upserted: number;
  years: number[];
  source: ExternalEventSource;
};

export async function syncFcatRoadRaces(years?: number[]): Promise<SyncExternalEventsResult> {
  const currentYear = new Date().getUTCFullYear();
  const yearsToSync = years && years.length > 0 ? years : [currentYear, currentYear + 1];

  const batches = await Promise.all(yearsToSync.map((year) => fetchFcatRoadRacesByYear(year)));
  const normalized = batches.flat();

  await prisma.$transaction(
    normalized.map((event) =>
      prisma.externalEvent.upsert({
        where: {
          source_sourceExternalId: {
            source: ExternalEventSource.FCAT,
            sourceExternalId: event.sourceExternalId,
          },
        },
        update: {
          title: event.title,
          city: event.city,
          state: event.state,
          startDate: event.startDate,
          endDate: event.endDate,
          displayPeriod: event.displayPeriod,
          officialUrl: event.officialUrl,
          sourceUrl: event.sourceUrl,
          dataHash: event.dataHash,
          rawPayload: event.rawPayload as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        },
        create: {
          source: ExternalEventSource.FCAT,
          sourceExternalId: event.sourceExternalId,
          title: event.title,
          city: event.city,
          state: event.state,
          startDate: event.startDate,
          endDate: event.endDate,
          displayPeriod: event.displayPeriod,
          officialUrl: event.officialUrl,
          sourceUrl: event.sourceUrl,
          dataHash: event.dataHash,
          rawPayload: event.rawPayload as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        },
      })
    )
  );

  return {
    fetched: normalized.length,
    upserted: normalized.length,
    years: yearsToSync,
    source: ExternalEventSource.FCAT,
  };
}
