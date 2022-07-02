import { initConfig } from '../config';

describe('initConfig', () => {
  const initConfigFn = (opts) => {
    return () => {
      return initConfig(opts);
    };
  };
  
  it('returns default config when options are absent', () => {
    const config = initConfig();
    expect(config.saltByteLength).toEqual(8);
  });

  it('saltByteLength must be greater than 0', () => {
    expect(initConfigFn({saltByteLength: 0})).toThrow(Error);
    expect(initConfigFn({saltByteLength: 1})).not.toThrow(Error);
  });

  it('saltByteLength must be less than 256', () => {
    expect(initConfigFn({saltByteLength: 256})).toThrow(Error);
    expect(initConfigFn({saltByteLength: 255})).not.toThrow(Error);
  });
  
  it('secretByteLength must be greater than 0', () => {
    expect(initConfigFn({secretByteLength: 0})).toThrow(Error);
    expect(initConfigFn({secretByteLength: 1})).not.toThrow(Error);
  });

  it('secretByteLength must be less than 256', () => {
    expect(initConfigFn({secretByteLength: 256})).toThrow(Error);
    expect(initConfigFn({secretByteLength: 255})).not.toThrow(Error);
  });
});
