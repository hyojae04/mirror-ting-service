import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { workplaceClips } from '../../web/src/lib/workplaceMedia.js';
for (const clip of workplaceClips) {
  test(`${clip.file}: speech retained and music tail silent`, () => {
    const volume = (start, end) => {
      const result = spawnSync('ffmpeg', ['-hide_banner', '-i', `web/public/demo-workplace/${clip.file}`, '-af', `atrim=start=${start}:end=${end},volumedetect`, '-vn', '-f', 'null', '-'], {encoding:'utf8'});
      assert.equal(result.status, 0, result.stderr);
      const match = result.stderr.match(/max_volume: ([\d.-]+) dB/);
      assert.ok(match, result.stderr);
      return Number(match[1]);
    };
    assert.ok(volume(0, clip.speechEnd) > -30, 'speech should remain audible');
    assert.ok(volume(clip.speechEnd + 0.15, 8) <= -80, 'post-response music should be silent');
  });
}
