const rfc2047Encode = (dataIn: any) => {
  const data = `${dataIn}`;
  if (/^[\x00-\x7F]*$/.test(data)) return data;
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=`;
};

export const rfc2047EncodeMetadata = (metadata: any) =>
  Object.fromEntries(
    Object.entries(metadata).map((entry) => entry.map(rfc2047Encode)),
  );
