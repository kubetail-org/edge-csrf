import { Config } from './config'

describe('Config tests', () => {
  const initConfigFn = (opts) => {
    return () => {
      return new Config(opts)
    }
  }
  
  it('returns default config when options are absent', () => {
    const config = new Config()
    expect(config.cookie.domain).toEqual('')
    expect(config.cookie.httpOnly).toEqual(true)
    expect(config.cookie.maxAge).toEqual(undefined)
    expect(config.cookie.name).toEqual('_csrfSecret')
    expect(config.cookie.path).toEqual('/')
    expect(config.cookie.sameSite).toEqual('strict')
    expect(config.cookie.secure).toEqual(true)
    expect(config.ignoreMethods).toEqual(['GET', 'HEAD', 'OPTIONS'])
    expect(config.saltByteLength).toEqual(8)
    expect(config.secretByteLength).toEqual(18)
    expect(config.token.responseHeader).toEqual('X-CSRF-Token')
    expect(config.token.value).toEqual(undefined)
  })

  it('saltByteLength must be greater than 0', () => {
    expect(initConfigFn({saltByteLength: 0})).toThrow(Error)
    expect(initConfigFn({saltByteLength: 1})).not.toThrow(Error)
  })

  it('saltByteLength must be less than 256', () => {
    expect(initConfigFn({saltByteLength: 256})).toThrow(Error)
    expect(initConfigFn({saltByteLength: 255})).not.toThrow(Error)
  })
  
  it('secretByteLength must be greater than 0', () => {
    expect(initConfigFn({secretByteLength: 0})).toThrow(Error)
    expect(initConfigFn({secretByteLength: 1})).not.toThrow(Error)
  })

  it('secretByteLength must be less than 256', () => {
    expect(initConfigFn({secretByteLength: 256})).toThrow(Error)
    expect(initConfigFn({secretByteLength: 255})).not.toThrow(Error)
  })
})
