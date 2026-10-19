import React from 'react';
import Headers from '../Common/Headers/index';
import BodyBlock from '../Common/Body/index';
import { sentHeadersFromTimeline } from 'utils/timeline';

const safeStringifyJSONIfNotString = (obj: any) => {
  if (obj === null || obj === undefined) return '';

  if (typeof obj === 'string') {
    return obj;
  }

  try {
    return JSON.stringify(obj);
  } catch (e) {
    return '[Unserializable Object]';
  }
};

const Request = ({
  collection,
  request,
  item,
  response
}: any) => {
  let { headers, data, dataBuffer, error } = request || {};

  const sentHeaders = sentHeadersFromTimeline(response?.timeline);
  // `bru.sendRequest` builds its own timeline entry, so fall back to the request's own headers when none were logged
  const displayedHeaders = sentHeaders.length ? sentHeaders : headers;
  if (!dataBuffer) {
    dataBuffer = Buffer.from(safeStringifyJSONIfNotString(data))?.toString('base64');
  }

  return (
    <>
      <Headers headers={displayedHeaders} />
      <BodyBlock
        collection={collection}
        data={data}
        dataBuffer={dataBuffer}
        error={error}
        headers={headers}
        item={item}
        type="request"
      />
    </>
  );
};

export default Request;
