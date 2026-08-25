import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

const EXTENSIONES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

let r2Client: S3Client | undefined;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 no esta configurado');
  }
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
  return r2Client;
}

function validateKey(key: string): string {
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\\'))
    throw new Error('Clave de almacenamiento invalida');
  return key;
}

function localPath(key: string): string {
  const base = resolve(env.UPLOAD_DIR);
  const target = resolve(base, validateKey(key));
  const relativePath = relative(base, target);
  if (relativePath.startsWith('..') || isAbsolute(relativePath))
    throw new Error('Ruta de almacenamiento invalida');
  return target;
}

function parseR2Reference(reference: string): { bucket: string; key: string } {
  const match = /^r2:\/\/([^/]+)\/(.+)$/.exec(reference);
  if (!match?.[1] || !match[2]) throw new Error('Referencia R2 invalida');
  return { bucket: match[1], key: validateKey(match[2]) };
}

export function createAttachmentKey(
  organizationId: string,
  ticketId: string,
  mimeType: string,
): string {
  return validateKey(
    `attachments/${organizationId}/${ticketId}/${randomUUID()}${EXTENSIONES[mimeType] ?? ''}`,
  );
}

export async function saveAttachment(key: string, data: Buffer, mimeType: string): Promise<string> {
  validateKey(key);
  if (env.STORAGE_DRIVER === 'r2') {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: env.R2_ATTACHMENTS_BUCKET,
        Key: key,
        Body: data,
        ContentLength: data.byteLength,
        ContentType: mimeType,
        Metadata: { application: 'soporteqr' },
      }),
    );
    return `r2://${env.R2_ATTACHMENTS_BUCKET}/${key}`;
  }

  const target = localPath(key);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  return `local://${key}`;
}

export async function loadAttachment(reference: string): Promise<Buffer> {
  if (reference.startsWith('r2://')) {
    const { bucket, key } = parseR2Reference(reference);
    const response = await getR2Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error('El adjunto no tiene contenido');
    return Buffer.from(await response.Body.transformToByteArray());
  }
  if (reference.startsWith('local://'))
    return readFile(localPath(reference.slice('local://'.length)));
  return readFile(reference); // Compatibilidad con adjuntos creados antes de la abstraccion de almacenamiento.
}

export async function deleteAttachment(reference: string): Promise<void> {
  if (reference.startsWith('r2://')) {
    const { bucket, key } = parseR2Reference(reference);
    await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }
  const target = reference.startsWith('local://')
    ? localPath(reference.slice('local://'.length))
    : reference;
  await unlink(target).catch(() => undefined);
}

export async function checkAttachmentStorage(): Promise<void> {
  if (env.STORAGE_DRIVER === 'r2') {
    await getR2Client().send(new HeadBucketCommand({ Bucket: env.R2_ATTACHMENTS_BUCKET }));
    return;
  }
  const base = resolve(env.UPLOAD_DIR);
  await mkdir(base, { recursive: true });
  const probe = localPath(`.readiness-${randomUUID()}`);
  await writeFile(probe, '', { flag: 'wx' });
  await unlink(probe);
}

export function attachmentStorageName(): 'local' | 'r2' {
  return env.STORAGE_DRIVER;
}
