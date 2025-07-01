import fs from 'fs/promises';

const baseUrl = process.env.AXIOM_URL || 'https://api.axiom.co/v2';
const auth = `Bearer ${process.env.AXIOM_TOKEN}`;
const namespace = 'NOT_IMPLEMENTED';

export const listAllVersions = async (objectId: string) => {
  const response = await fetch(`${baseUrl}/vobjects/${objectId}/versions`, {
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'x-apex-namespace': namespace,
      'x-axiom-client': 'axiom-ai-cli',
    },
  });
  const data = await response.json();
  return data;
};

export const createObject = async (path: string, metadata: Record<string, any> = {}) => {
  const { name, type, format } = extractFileNameAndType(path);
  const uuid = crypto.randomUUID();
  const newID = `${type}_${uuid}`;

  console.debug('Creating object', { name, id: newID });
  // attach filename to metadata
  metadata.name = name;
  metadata.format = format;
  metadata.source = 'axiom-ai-cli';

  // get file content
  const content = await fs.readFile(path, 'utf8');

  const response = await fetch(`${baseUrl}/vobjects/${newID}/versions`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'x-apex-namespace': namespace,
      'x-axiom-client': 'axiom-ai-cli',
    },
    body: JSON.stringify({ content, metadata, contentType: 'text/plain' }),
  });
  const data = await response.json();
  return data;
};

export const getLatestVersion = async (objectId: string) => {
  const response = await fetch(`${baseUrl}/vobjects/${objectId}/versions/latest`, {
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'x-apex-namespace': namespace,
      'x-axiom-client': 'axiom-ai-cli',
    },
  });
  const data = await response.json();
  return data;
};

export const deleteVersion = async (objectId: string, versionId: string) => {
  const response = await fetch(`${baseUrl}/vobjects/${objectId}/versions/${versionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'x-apex-namespace': namespace,
      'x-axiom-client': 'axiom-ai-cli',
    },
  });
  return response.ok;
};

export const deleteObject = async (objectId: string) => {
  const response = await fetch(`${baseUrl}/vobjects/${objectId}?confirm=true`, {
    method: 'DELETE',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'x-apex-namespace': namespace,
      'x-axiom-client': 'axiom-ai-cli',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to delete object:', response.statusText, error);
    return false;
  }
  console.log('Object deleted:', response.ok);
  return response.ok;
};

const extractFileNameAndType = (path: string) => {
  const name = path.split('/').pop();
  const nameParts = name?.split('.');
  const format = nameParts?.pop();
  const type = nameParts?.pop();
  return { name, format, type };
};
