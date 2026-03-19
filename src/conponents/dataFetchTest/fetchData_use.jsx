import { Component, Suspense, use, useMemo } from 'react';

const dataPrefix = import.meta.env.VITE_C19_C_DATA;
// cache url -> promise mapping
const metaPromiseCache = new Map();

//overall this function generate the complete url link that used to fetch
function buildMetaUrl() {
  //check if the url is existing
  if (!dataPrefix) {
    throw new Error('Missing VITE_C19_C_DATA in .env');
  }
  //add the rest part of url
  return `${dataPrefix.replace(/\/$/, '')}/c_data/world/c_meta.json`;
}

//this function use the url and return the promise value in json format. 
function getMetaPromise(url) {
  //check have the url been requested?
  if (!metaPromiseCache.has(url)) {
    //if it has not been requested,set the url and the promise in tothe cache. 
    metaPromiseCache.set(
      url,
      //fetch the url, and process the response to json fromat
      fetch(url).then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
      })
    );
  }
  //out put the url's promise
  return metaPromiseCache.get(url);
}

//this funciton read the promise from cache to shows the data
function MetaContent({ date, region }) {
  //give the final url link to meatUrl
  const metaUrl = buildMetaUrl();
  //useMemo working as when the 'url' in [] changed, the function will run again, which is  getMetaPromise(metaUrl) righthere.
  //In fact, the useMemo is unnecessary here because the url will not be changed.
  const metaPromise = useMemo(() => getMetaPromise(metaUrl), [metaUrl]);
  //use is a react funciton to read an async result. 
  const meta = use(metaPromise);

  //return the json data
  return (
    <>
      <div>Date: {date || 'Not provided'}</div>
      <div>Region: {region || 'Not provided'}</div>
      <div>Meta URL: {metaUrl}</div>
      <div>Note: c_meta.json is shared metadata, so these props do not change the request.</div>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {JSON.stringify(meta, null, 2)}
      </pre>
    </>
  );
}

//this function shows the content when data is loading
function MetaFallback({ date, region }) {
  return (
    <>
      <div>Date: {date || 'Not provided'}</div>
      <div>Region: {region || 'Not provided'}</div>
      <div>Loading c_meta.json...</div>
    </>
  );
}
//catch the error and render.
class MetaErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div>Error: {this.state.error.message}</div>;
    }

    return this.props.children;
  }
}

const FetchData_use = ({ date, region }) => {
  return (
    <MetaErrorBoundary>
      {/* if the state use checks the promise state is pending, shows <MetaFallback> */}
      {/* MetaContent 里 use(metaPromise) 遇到 pending promise -> React 暂停这个子树 -> 最近的 Suspense 渲染 fallback。 */}
      <Suspense fallback={<MetaFallback date={date} region={region} />}>
      {/* or shows the MetaContent */}
        <MetaContent date={date} region={region} />
      </Suspense>
    </MetaErrorBoundary>
  );
};

export default FetchData_use;
