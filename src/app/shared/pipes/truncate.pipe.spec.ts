import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null/empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
  });

  it('should not truncate short strings', () => {
    const short = 'Hello World';
    expect(pipe.transform(short, 50)).toBe('Hello World');
  });

  it('should truncate long strings at given limit', () => {
    const long = 'This is a very long string that exceeds the limit';
    const result = pipe.transform(long, 20);
    expect(result.length).toBe(23); // 20 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should use custom trail', () => {
    const result = pipe.transform('Hello World Test', 10, ' [more]');
    expect(result.endsWith(' [more]')).toBe(true);
  });

  it('should default to 50 character limit', () => {
    const str = 'a'.repeat(60);
    const result = pipe.transform(str);
    expect(result).toBe('a'.repeat(50) + '...');
  });

  it('should return exact string when length equals limit', () => {
    const str = 'a'.repeat(50);
    expect(pipe.transform(str, 50)).toBe(str);
  });
});
