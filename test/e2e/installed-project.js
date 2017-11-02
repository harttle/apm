'use strict'
const chai = require('chai')
const Workspace = require('../stub/workspace')
const expect = chai.expect
const registry = require('../stub/registry.js')

describe('installed project with package.json and node_modules', function () {
  this.timeout(5000)
  before(cb => registry.startServer(cb))
  after(cb => registry.stopServer(cb))

  describe('install lower version', function () {
    var workspace
    before(() => Workspace
      .create({
        'package.json': JSON.stringify({
          name: 'index',
          amdDependencies: { bar: '^1.1.0' }
        }),
        'amd_modules/bar/package.json': JSON.stringify({
          name: 'bar',
          version: '1.1.0'
        })
      })
      .tap(ws => (workspace = ws))
      .then(ws => ws.run('$APM install bar@1.0.1 --loglevel silly'))
    )
    it('should make install successful', function () {
      return workspace.readJson(`amd_modules/bar/package.json`).then(bar => {
        expect(bar).to.have.property('name', 'bar')
        expect(bar).to.have.property('version', '1.0.1')
      })
    })
    it('should change package.json accordingly', function () {
      return workspace.readJson(`package.json`).then(index => {
        expect(index.amdDependencies).to.have.property('bar', '^1.0.1')
      })
    })
  })
  describe('installing higher version', function () {
    var workspace
    before(() => Workspace
      .create({
        'package.json': JSON.stringify({
          name: 'index',
          amdDependencies: { bar: '1.0.1' }
        }),
        'amd_modules/bar/package.json': JSON.stringify({
          name: 'bar',
          version: '1.0.1'
        })
      })
      .tap(ws => (workspace = ws))
      .then(ws => ws.run('$APM install bar@1.1.0 --loglevel silly'))
    )
    it('should make install successful', function () {
      return workspace.readJson(`amd_modules/bar/package.json`).then(bar => {
        expect(bar).to.have.property('name', 'bar')
        expect(bar).to.have.property('version', '1.1.0')
      })
    })
    it('should change package.json accordingly', function () {
      return workspace.readJson(`package.json`).then(index => {
        expect(index.amdDependencies).to.have.property('bar', '^1.1.0')
      })
    })
  })
  describe('install incompatible version', function () {
    let workspace
    let result
    before(() => Workspace
      .create({
        'package.json': JSON.stringify({
          name: 'index',
          amdDependencies: { coo: '1.0.0' }
        }),
        'amd_modules/coo/package.json': JSON.stringify({
          name: 'coo',
          version: '1.0.0'
        }),
        'amd_modules/bar/package.json': JSON.stringify({
          name: 'bar',
          version: '1.0.0'
        })
      })
      .tap(ws => (workspace = ws))
      .then(ws => ws.run('$APM install bar@1.1.0 --loglevel silly'))
      .then(x => (result = x))
    )
    it('should make install successful', function () {
      return workspace.readJson(`amd_modules/bar/package.json`).then(bar => {
        expect(bar).to.have.property('name', 'bar')
        expect(bar).to.have.property('version', '1.1.0')
      })
    })
    it('should print incompatible error', function () {
      var msg = 'version conflict: upgrade bar@<=1.0.0 (in coo@1.0.0) to match 1.1.0 (as required by index)'
      return expect(result.stderr).to.include(msg)
    })
    it('should not change package.json', function () {
      return workspace.readJson(`package.json`).then(index => {
        expect(index.amdDependencies).to.not.have.property('bar')
      })
    })
  })
  describe('install incompatible version with save', function () {
    var workspace
    before(() => Workspace
      .create({
        'package.json': JSON.stringify({
          name: 'index',
          amdDependencies: { coo: '1.0.0' }
        }),
        'amd_modules/coo/package.json': JSON.stringify({
          name: 'coo',
          version: '1.0.0'
        }),
        'amd_modules/bar/package.json': JSON.stringify({
          name: 'bar',
          version: '1.0.0'
        })
      })
      .tap(ws => (workspace = ws))
      .then(ws => ws.run('$APM install bar@~1.1.0 --save --loglevel info'))
    )
    it('should make install successful', function () {
      return workspace.readJson(`amd_modules/bar/package.json`).then(bar => {
        expect(bar).to.have.property('name', 'bar')
        expect(bar).to.have.property('version', '1.1.0')
      })
    })
    it('should change package.json accordingly', function () {
      return workspace.readJson(`package.json`).then(index => {
        expect(index.amdDependencies).to.have.property('bar', '^1.1.0')
      })
    })
  })
})
