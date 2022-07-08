const defaultConfig = {
  cookie: {
    domain: '',
    httpOnly: true,
    maxAge: null,
    name: '_csrfSecret',
    path: '/',
    sameSite: 'strict',
    secure: true
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  saltByteLength: 8,
  secretByteLength: 18,
  token: {
    responseHeader: 'x-csrf-token',
    value: null
  }
};

function mergeShallow(values, defaults) {
  values = values || {};

  let output = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    output[key] = (values[key] !== undefined) ? values[key] : defaultValue;
  }
  return output;
}

/**
 * Initialize config (only applies basic validation for edge runtime)
 */
export function initConfig(options) {
  options = options || {};
  
  // build config
  let config = mergeShallow(options, defaultConfig);
  config.cookie = mergeShallow(options.cookie, defaultConfig.cookie);
  config.token = mergeShallow(options.token, defaultConfig.token);

  // basic validation
  if (config.saltByteLength < 1 || config.saltByteLength > 255) {
    throw Error('saltBytLength must be greater than 0 and less than 256');
  }

  if (config.secretByteLength < 1 || config.secretByteLength > 255) {
    throw Error('secretBytLength must be greater than 0 and less than 256');
  }
  
  return config;
}
