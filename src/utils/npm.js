const registry = require('../registry.js')
const error = require('./error.js')
const rp = require('request-promise')
const Promise = require('bluebird')
const debug = require('debug')('apmjs:npm')
const path = require('path')
const npm = require('npm')
const fs = require('fs-extra')
const tarball = require('tarball-extract')
const _ = require('lodash')

function downloadPackage (url, dir) {
  var name = path.basename(url)
  var tarfile = `/tmp/${name}.tgz`
  var untardir = `/tmp/${name}`
  var pkgdir = `${untardir}/package`
  // TODO: tarball cache
  return Promise.all([fs.remove(untardir), fs.remove(tarfile)])
    .then(() => Promise.fromCallback(
      cb => tarball.extractTarballDownload(url, tarfile, untardir, {}, cb)
    ))
    .then(() => fs.move(pkgdir, dir, {overwrite: true}))
}

var infoCache = {}

function getPackageInfo (name, parent) {
  if (infoCache[name]) {
    return infoCache[name]
  }
  var infoUrl = registry.packageUrl(name)
  debug('retrieving package info from', infoUrl)
  infoCache[name] = rp({
    url: infoUrl,
    json: true
  })
  .promise()
  .catch(e => {
    if (e.statusCode === 404) {
      throw new error.PackageNotFound(name, parent)
    } else {
      throw e
    }
  })
  .tap(desc => {
    var versionList = Object.keys(desc.versions).join(',')
    debug('package info retrieved:', `${desc.name}@${versionList}`)
  })
  return infoCache[name]
}

function load (conf) {
  var config = {}
  _.assign(config, conf)
  return Promise.fromCallback(cb => npm.load(config, cb))
}

module.exports = {downloadPackage, getPackageInfo, load}