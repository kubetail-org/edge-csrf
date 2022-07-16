"use strict";
exports.__esModule = true;
function handler(req, res) {
    res.status(403).json({ status: 'invalid csrf token' });
}
exports["default"] = handler;
