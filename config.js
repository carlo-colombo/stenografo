class Config {
  constructor(runtimeConfig, configName, prefix) {
    this.runtimeConfig = runtimeConfig
    this.configName = configName
    this.prefix = prefix
  }

  get(key, envVar, defaultValue) {
    if (process.env.NODE_ENV == 'production') {
      console.log('get', this.configName, this.prefix, key)

      return this.runtimeConfig
        .getVariable(this.configName, [this.prefix, key].join('/'))
        .catch(_ => defaultValue)
    }
    return Promise.resolve(process.env[envVar] || defaultValue)
  }
}

module.exports = Config
