import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_IMAGE_BYTES, pageNumber, seasonFilter, uniformSchema, validateImage } from '../lib/validation';

test('pagination handles invalid, negative and excessively large input', () => {
  assert.equal(pageNumber(undefined), 1);
  assert.equal(pageNumber('-1'), 1);
  assert.equal(pageNumber('1.5'), 1);
  assert.equal(pageNumber('0'), 1);
  assert.equal(pageNumber('2'), 2);
  assert.equal(pageNumber('9999999999999999999'), 100000);
  assert.equal(seasonFilter('winter'), 'winter');
  assert.equal(seasonFilter('invalid'), undefined);
});
test('image validation rejects active content, empty files and oversized uploads', () => {
  assert.ok(validateImage({ type: 'image/svg+xml', size: 100 }));
  assert.ok(validateImage({ type: 'text/html', size: 100 }));
  assert.ok(validateImage({ type: 'image/png', size: 0 }));
  assert.ok(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }));
  assert.equal(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES }), null);
});
test('content validation prevents empty text, unsafe image paths and invalid states', () => {
  const valid = { title: ' 校服 ', description: '说明', season: 'autumn', status: 'draft', image_path: '00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002.png', image_width: 1000, image_height: 600 };
  assert.equal(uniformSchema.parse(valid).title, '校服');
  for (const change of [{ title: '   ' }, { description: '' }, { status: 'private' }, { image_width: 0 }, { image_path: '../another-user/photo.png' }, { image_path: 'https://example.com/a.png' }]) {
    assert.equal(uniformSchema.safeParse({ ...valid, ...change }).success, false);
  }
});
