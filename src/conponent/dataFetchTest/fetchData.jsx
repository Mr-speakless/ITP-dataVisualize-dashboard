import { useEffect, useMemo, useState } from 'react';

//ger prefix url
const dataPrefix = import.meta.env.VITE_C19_C_DATA;
//an other prefix for checking the country data all of the world?
const worldDataPath = 'c_data/world';

function buildBaseUrl() {
  if (!dataPrefix) {
    throw new Error('Missing VITE_C19_C_DATA in .env');
  }

  return `${dataPrefix.replace(/\/$/, '')}/${worldDataPath}`;
}

// don't understand what this function working for...
function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

//match the regions input with the regions name in the data base
function findRegionMatch(regions, regionName) {
  //get rid of space and transform to lowercase
  const normalizedRegion = regionName.trim().toLowerCase();
  return regions.find((item) => item.c_ref.toLowerCase() === normalizedRegion);
}


const FetchData = ({ date, region }) => {
  const [meta, setMeta] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [error, setError] = useState('');

  // Memoize the trimmed inputs so every effect reads the same normalized values.
  //request is a object, like {date:date(userInput),region:region(userInput)}, it will automatically update
  //as there is a new user input come in. 
  const request = useMemo(
    () => ({
      date: date.trim(),
      region: region.trim(),
    }),
    [date, region]
  );

  useEffect(() => {
    //what is this used for...?
    const controller = new AbortController();

    async function loadMeta() {
      setIsMetaLoading(true);
      setError('');

      try {
        //fetch the final url
        //waht is signal: controller.signal, mean?
        const response = await fetch(`${buildBaseUrl()}/c_meta.json`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Meta request failed with status ${response.status}`);
        }

        const json = await response.json();
        setMeta(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Unknown error while loading meta data'
          );
        }
      } finally {
        setIsMetaLoading(false);
      }
    }

    loadMeta();

    return () => {
      //offload the function
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!meta || !request.date || !request.region) {
      setQueryResult(null);
      return;
    }

    const controller = new AbortController();
    //check is there's a region in meta matches the request.region?
    const regionMatch = findRegionMatch(meta.c_regions || [], request.region);


    //没懂这个函数返回的是 所有城市在request.date的数据 还是request.region筛选之后 request.date的数据？
    async function loadDaySnapshot() {
      setIsDayLoading(true);
      setError('');
      setQueryResult(null);

      try {
        // Validate the requested date before hitting the daily snapshot file.
        if (!(meta.c_dates || []).includes(request.date)) {
          throw new Error(
            `Date ${request.date} is not available in the world-level dataset`
          );
        }

        if (!regionMatch) {
          throw new Error(
            `Region "${request.region}" was not found in c_meta.json`
          );
        }

        // Use metadata to detect obvious data gaps before requesting the snapshot.
        if (regionMatch.last_date && request.date > regionMatch.last_date) {
          throw new Error(
            `Region "${regionMatch.c_ref}" has no data after ${regionMatch.last_date}`
          );
        }

        const response = await fetch(
          //这里fetch的数据是在那一特定日期的所有国家的数据？
          `${buildBaseUrl()}/c_days/${request.date}.json`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Daily request failed with status ${response.status}`);
        }

        const json = await response.json();
        //这里彻底没懂
        const items = Array.isArray(json) ? json : json.value || [];
        const dayEntry = findRegionMatch(items, regionMatch.c_ref);

        if (!dayEntry) {
          throw new Error(
            `No daily snapshot exists for "${regionMatch.c_ref}" on ${request.date}`
          );
        }

        setQueryResult({
          region: regionMatch,
          dayEntry,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Unknown error while loading day data'
          );
        }
      } finally {
        setIsDayLoading(false);
      }
    }

    loadDaySnapshot();

    return () => {
      controller.abort();
    };
  }, [meta, request.date, request.region]);

  return (
    <>
      <div>Date: {request.date || 'Not provided'}</div>
      <div>Region: {request.region || 'Not provided'}</div>

      {isMetaLoading && <div>Loading c_meta.json...</div>}
      {!isMetaLoading && isDayLoading && <div>Loading daily snapshot...</div>}
      {error && <div>Error: {error}</div>}

      {!isMetaLoading && !isDayLoading && !error && queryResult && (
        <div>
          {/* Render a readable summary first, then expose the raw values below it. */}
          <p>
            On {request.date}, {queryResult.region.c_ref} reported{' '}
            {formatNumber(queryResult.dayEntry.totals?.Cases)} total cases and{' '}
            {formatNumber(queryResult.dayEntry.totals?.Deaths)} total deaths.
          </p>
          <p>
            The daily change on that date was{' '}
            {formatNumber(queryResult.dayEntry.daily?.Cases)} cases and{' '}
            {formatNumber(queryResult.dayEntry.daily?.Deaths)} deaths.
          </p>
          <p>
            Population reference: {formatNumber(queryResult.region.c_people)}.
          </p>
          <p>
            First reported cases: {queryResult.region.c_first?.Cases || 'N/A'}.
            {' '}First reported deaths: {queryResult.region.c_first?.Deaths || 'N/A'}.
          </p>
          {queryResult.region.last_date && (
            <p>Last available date in metadata: {queryResult.region.last_date}.</p>
          )}
        </div>
      )}
    </>
  );
};

export default FetchData;
