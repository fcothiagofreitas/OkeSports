import { createHash } from 'node:crypto';

const FCAT_BASE_URL = 'https://fcat.org.br';
const FCAT_ROAD_RACE_SOURCE_URL = 'https://fcat.org.br/?pagina=competicoes&t=c';
const FCAT_AJAX_URL = 'https://fcat.org.br/ajax/ajax_competicoes_read.php';

type FcatRow = {
  Id: number;
  Titulo: string;
  Cidade?: string | null;
  DataIni?: string | null;
  DataFim?: string | null;
  DataInicial?: string | null;
};

type FcatApiResponse = {
  aaData?: FcatRow[];
};

export type NormalizedExternalEvent = {
  sourceExternalId: string;
  title: string;
  city: string | null;
  state: string;
  startDate: Date;
  endDate: Date | null;
  displayPeriod: string | null;
  officialUrl: string;
  sourceUrl: string;
  dataHash: string;
  rawPayload: Record<string, unknown>;
};

function toDate(value?: string | null): Date | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  const parts = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (parts) {
    const [, dd, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildDataHash(title: string, startDate: Date, city: string | null) {
  return createHash('sha256')
    .update(
      `${title.trim().toLowerCase()}|${startDate.toISOString().slice(0, 10)}|${(city ?? '').trim().toLowerCase()}`
    )
    .digest('hex');
}

export async function fetchFcatRoadRacesByYear(year: number): Promise<NormalizedExternalEvent[]> {
  const url = `${FCAT_AJAX_URL}?ano=${year}&pagina=c`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'OkeSportsBot/1.0 (+https://okesports.com.br)',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`FCAt request failed (${response.status}) for year ${year}`);
  }

  const payload = (await response.json()) as FcatApiResponse;
  const rows = Array.isArray(payload.aaData) ? payload.aaData : [];

  return rows
    .map((row) => {
      const startDate = toDate(row.DataInicial ?? row.DataIni);
      if (!startDate) return null;

      const endDate = toDate(row.DataFim ?? row.DataIni);
      const id = String(row.Id);
      const title = (row.Titulo ?? '').trim();
      const city = row.Cidade?.trim() ?? null;
      const officialUrl = `${FCAT_BASE_URL}/?pagina=competicao&id=${id}&tipo=c`;
      const displayPeriod =
        row.DataIni && row.DataFim && row.DataIni !== row.DataFim
          ? `${row.DataIni} a ${row.DataFim}`
          : (row.DataIni ?? null);

      if (!title || !id) return null;

      return {
        sourceExternalId: id,
        title,
        city,
        state: 'CE',
        startDate,
        endDate,
        displayPeriod,
        officialUrl,
        sourceUrl: FCAT_ROAD_RACE_SOURCE_URL,
        dataHash: buildDataHash(title, startDate, city),
        rawPayload: row as unknown as Record<string, unknown>,
      } satisfies NormalizedExternalEvent;
    })
    .filter((row): row is NormalizedExternalEvent => Boolean(row));
}
