import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PhotosService {
  readonly photosDir = join(process.cwd(), '..', 'data', 'photos');

  constructor() {
    mkdirSync(this.photosDir, { recursive: true });
  }

  save(id: string, buffer: Buffer) {
    writeFileSync(join(this.photosDir, `${id}.jpg`), buffer);
    return { id };
  }

  get(id: string): Buffer {
    const path = join(this.photosDir, `${id}.jpg`);
    if (!existsSync(path)) throw new NotFoundException();
    return readFileSync(path);
  }

  delete(id: string) {
    const path = join(this.photosDir, `${id}.jpg`);
    if (existsSync(path)) unlinkSync(path);
    return { ok: true };
  }

  getMgPhoto(filename: string): Buffer {
    const path = join(this.photosDir, filename);
    if (!existsSync(path)) throw new NotFoundException();
    return readFileSync(path);
  }

  getExt(filename: string) {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }
}
