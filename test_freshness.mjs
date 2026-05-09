import { checkImageFreshness } from './src/lib/exifExtractor.js';

const exifData = { hasExif: false };
const result = checkImageFreshness(exifData);
console.log(result);
