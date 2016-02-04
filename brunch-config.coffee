module.exports = config:
  files:
    javascripts: joinTo: 'main.js'
    stylesheets: joinTo: 'main.css'
  plugins:
    sass:
      mode: 'native'
    babel:
      presets: ['es2015']
      ignore: []
      pattern: /\.(js)$/
  server:
      run: yes
      port: 4001

