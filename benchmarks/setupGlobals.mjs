import primitives from '@edge-runtime/primitives';

global.crypto = primitives.default.crypto;
global.Request = primitives.default.Request;
global.Response = primitives.default.Response;
global.Headers = primitives.default.Headers;
