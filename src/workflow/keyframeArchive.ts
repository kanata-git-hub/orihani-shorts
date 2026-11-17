import { episodeImageName, imageFile, sceneImageName } from './share';

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP STORE preserves already-compressed image bytes without a compressor or server upload. */
export async function keyframeArchive(
  title: string,
  keyframes: ReadonlyArray<{ imageTitle: string }>,
  images: Record<string, string>,
  sourceTitle = '',
): Promise<File> {
  if (!keyframes.length || keyframes.length > 10) throw Error('다운로드할 키프레임을 확인해주세요.');
  if (keyframes.some(frame => !Object.hasOwn(images, frame.imageTitle) || !images[frame.imageTitle])) {
    throw Error('모든 키프레임 이미지가 준비된 뒤 다시 다운로드해주세요.');
  }

  const encoder = new TextEncoder();
  const entries: BlobPart[] = [], directory: BlobPart[] = [];
  let offset = 0, directorySize = 0;

  for (let index = 0; index < keyframes.length; index++) {
    // Yield between originals so mobile browsers can keep the progress UI responsive.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    let file: File;
    try {
      file = imageFile(images[keyframes[index].imageTitle], sceneImageName(title, index + 1, sourceTitle));
    } catch {
      throw Error(`${index + 1}번 키프레임 이미지를 다시 불러와주세요.`);
    }
    if (!file.size) throw Error(`${index + 1}번 키프레임 이미지가 비어 있습니다.`);
    const name = encoder.encode(file.name);
    if (name.length > 0xffff || offset + 30 + name.length + file.size >= 0xffffffff) {
      throw Error('이미지 용량이 너무 큽니다. 키프레임을 개별 다운로드해주세요.');
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checksum = crc32(bytes);
    const local = new Uint8Array(30 + name.length), localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true); // UTF-8 filename, including Korean.
    localView.setUint16(12, 0x0021, true); // Valid DOS date: 1980-01-01.
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, bytes.length, true);
    localView.setUint32(22, bytes.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    entries.push(local, bytes);

    const central = new Uint8Array(46 + name.length), centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(14, 0x0021, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, bytes.length, true);
    centralView.setUint32(24, bytes.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + bytes.length;
    directorySize += central.length;
  }

  if (offset + directorySize + 22 >= 0xffffffff) throw Error('이미지 용량이 너무 큽니다. 키프레임을 개별 다운로드해주세요.');
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, keyframes.length, true);
  endView.setUint16(10, keyframes.length, true);
  endView.setUint32(12, directorySize, true);
  endView.setUint32(16, offset, true);
  return new File([...entries, ...directory, end], `${episodeImageName(title, sourceTitle)} 키프레임 전체.zip`, { type: 'application/zip' });
}
