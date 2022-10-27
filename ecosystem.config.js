module.exports = {
  "apps": [
    {
      "name": "control",
      "script": "./index.js",
      "watch": true,
      "watch_delay": 1000,
      "ignore_watch": ["node_modules"],
      "env": {
        "HTTP_PORT": 3000,
        "HTTPS_PORT": 3001
      }
    }
  ]
}
