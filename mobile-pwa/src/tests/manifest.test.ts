import { describe, it, expect } from 'vitest';
import manifest from '../../public/manifest.json';

describe('PWA Web App Manifest Compliance', () => {
  it('defines application name as Marine Seafoods', () => {
    expect(manifest.name).toBe('Marine Seafoods');
    expect(manifest.short_name).toBe('Marine POS');
  });

  it('configures standalone display and valid scope', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
  });

  it('defines theme and background colors aligned with brand system', () => {
    expect(manifest.theme_color).toBe('#0a2540');
    expect(manifest.background_color).toBe('#000f22');
  });

  it('contains 192, 512, and maskable icons', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    const has192 = manifest.icons.some((i) => i.sizes === '192x192');
    const has512 = manifest.icons.some((i) => i.sizes === '512x512');
    const hasMaskable = manifest.icons.some((i) => i.purpose === 'maskable');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable).toBe(true);
  });
});
