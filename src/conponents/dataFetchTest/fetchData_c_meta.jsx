import { useEffect, useState } from 'react';

//get the data prefix
//Q1: why it writen as import.meta... what is import.meta mean?
const dataPrefix = import.meta.env.VITE_C19_C_DATA;


function buildMetaUrl() {
  //check if getting dataPrefix
  if (!dataPrefix) {
    throw new Error('Missing VITE_C19_C_DATA in .env');
  }
  //adding the rest link '/c_data/world/c_meta.json'
  return `${dataPrefix}/c_data/world/c_meta.json`;
}

const FetchData_c_meta = ({ date, region }) => {
  //the date and region paramater are not used for checking data
  ///c_data/world/c_meta.json is more like the table of content of datasets.

  //set meta, isLoading, error states
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  //use effect to fetch the data
  useEffect(() => {
    //To prevent components from still updating after uninstallation
    let isCancelled = false;

    // set LoadMeta()function
    async function loadMeta() {
      //enter loading state
      setIsLoading(true);
      //clear the error
      setError('');

      
      try {
        //fetch the url
        const response = await fetch(buildMetaUrl());

        if (!response.ok) {
          // throw an error to catch
          throw new Error(`Request failed with status ${response.status}`);
        }
        //form the data in json
        const json = await response.json();

        //check did the function have been cleaned up
        if (!isCancelled) {
          //set Meta as json data
          setMeta(json);
        }
      } catch (err) {
        //catch any error
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown fetch error');
        }
      } finally {
        //ending loading state
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    //run the funcion to fetch
    loadMeta();

    return () => {
      //offload the function
      isCancelled = true;
    };
    //[] means it only run for one time.
  }, []);

  return (
    <>
      <div>{date}</div>
      <div>{region}</div>
      {/* showing the url, or alerting not found the link frefix */}
      <div>Meta URL: {dataPrefix ? buildMetaUrl() : 'env not configured'}</div>
      {/* if isloading is true, showing Loading c_meta.json... */}
      {isLoading && <div>Loading c_meta.json...</div>}
      {/* if error is true, shows the error message */}
      {/* if not loading or error, which meas the data fetch has been done */}
      {error && <div>Error: {error}</div>}
      {!isLoading && !error && (
        // return the json file,First line indentation 2 space
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </>
  );
};

export default FetchData_c_meta;
