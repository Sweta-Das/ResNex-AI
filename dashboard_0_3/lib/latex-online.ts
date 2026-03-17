import { gzipSync } from 'node:zlib'

type TarEntry = {
  name: string
  content: Uint8Array
}

function writeAscii(target: Uint8Array, offset: number, value: string, length: number) {
  for (let i = 0; i < length; i++) target[offset + i] = 0
  const bytes = Buffer.from(value, 'ascii')
  bytes.copy(target, offset, 0, Math.min(bytes.length, length))
}

function octal(value: number, length: number) {
  const raw = Math.max(0, value).toString(8)
  return raw.padStart(length - 1, '0') + '\0'
}

function tarHeader(name: string, size: number) {
  const header = new Uint8Array(512)

  if (Buffer.byteLength(name, 'utf8') > 100) {
    throw new Error(`Tar entry name too long: ${name}`)
  }

  writeAscii(header, 0, name, 100)
  writeAscii(header, 100, octal(0o644, 8), 8) // mode
  writeAscii(header, 108, octal(0, 8), 8) // uid
  writeAscii(header, 116, octal(0, 8), 8) // gid
  writeAscii(header, 124, octal(size, 12), 12) // size
  writeAscii(header, 136, octal(0, 12), 12) // mtime
  writeAscii(header, 148, '        ', 8) // checksum placeholder
  writeAscii(header, 156, '0', 1) // typeflag
  writeAscii(header, 257, 'ustar\0', 6)
  writeAscii(header, 263, '00', 2)

  let sum = 0
  for (let i = 0; i < 512; i++) sum += header[i]
  const checksum = sum.toString(8).padStart(6, '0') + '\0 '
  writeAscii(header, 148, checksum, 8)

  return header
}

export function createTarGz(entries: TarEntry[]) {
  const chunks: Buffer[] = []

  for (const entry of entries) {
    const content = Buffer.from(entry.content)
    chunks.push(Buffer.from(tarHeader(entry.name, content.length)))
    chunks.push(content)
    const pad = (512 - (content.length % 512)) % 512
    if (pad) chunks.push(Buffer.alloc(pad))
  }

  chunks.push(Buffer.alloc(1024)) // end-of-archive
  return gzipSync(Buffer.concat(chunks))
}

