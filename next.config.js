/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
})

const nextConfig = withPWA({
  compiler: {
    removeConsole: process.env.APP_ENV == 'production' ? true : false,
  },
})

module.exports = nextConfig
