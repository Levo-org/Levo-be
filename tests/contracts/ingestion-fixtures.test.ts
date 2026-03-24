import fs from 'fs';
import path from 'path';

function readFixture(fileName: string): string {
  const fixturePath = path.resolve(__dirname, '../fixtures/ingestion', fileName);
  return fs.readFileSync(fixturePath, 'utf-8');
}

describe('ingestion fixture scaffold', () => {
  it('provides a parseable OEWN sample fixture', () => {
    const content = readFixture('oewn-small.json');
    const rows = JSON.parse(content) as Array<{ id: string; lemma: string }>;

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveProperty('id');
    expect(rows[0]).toHaveProperty('lemma');
  });

  it('provides a parseable JMdict sample fixture', () => {
    const content = readFixture('jmdict-small.json');
    const rows = JSON.parse(content) as Array<{ id: number; r: Array<{ text: string }> }>;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveProperty('id');
    expect(rows[0].r[0]).toHaveProperty('text');
  });

  it('provides CEDICT and Tatoeba plain-text fixtures with expected line counts', () => {
    const cedictLines = readFixture('cedict-small.txt').split('\n').filter((line) => line.trim().length > 0);
    const tatoebaLines = readFixture('tatoeba-cc0-small.tsv').split('\n').filter((line) => line.trim().length > 0);

    expect(cedictLines.length).toBeGreaterThanOrEqual(4);
    expect(tatoebaLines).toHaveLength(7);
  });
});
