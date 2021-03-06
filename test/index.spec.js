'use strict'
/* global describe, Given, When, Then */
const expect = require('chai').expect
const proxyquire = require('proxyquire')
const config = {
  url: 'ldap://mediasuite.local',
  baseDN: 'dc=mediasuite, dc=local',
  username: 'manager@mediasuite.local',
  password: 'password'
}
const adStub = require('./stubs/activedirectory')
const activedirectoryuserobject = proxyquire('../index', {activedirectory: adStub})
let req, middleware, options, next

describe('activedirectoryuserobject middleware', () => {
  describe('called with no connection details', () => {
    Then(function () { expect(activedirectoryuserobject).to.throw(Error) })
  })

  describe('called with no options', () => {
    Given(() => req = {username: 'andrew'})
    When(() => middleware = activedirectoryuserobject(config))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.name).to.equal('andrew') })
  })

  describe('called with userName option', () => {
    Given(() => req = {logon: 'andrew'})
    Given(() => options = {userName: 'logon'})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.name).to.equal('andrew') })
  })

  describe('called with userObject option', () => {
    Given(() => req = {username: 'andrew'})
    Given(() => options = {userObject: 'userObject'})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.userObject.name).to.equal('andrew') })
  })

  describe('called with userObject option', () => {
    Given(() => req = {username: 'andrew'})
    Given(() => options = {userObjectName: 'username'})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.username).to.equal('andrew') })
  })

  describe('called with 1 properties key and no matching groups', () => {
    Given(() => req = {username: 'andrew'})
    Given(() => options = {properties: {groups: {values: []}}})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups).to.be.null })
  })

  describe('called with 1 properties key and 2 matching groups', () => {
    Given(() => req = {username: 'andrew'})
    Given(() => options = {properties: {groups: {values: ['group 1', 'group 2']}}})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups.length).to.equal(2) })
    Then(function () { expect(req.user.groups[0]).to.equal('group 1') })
  })

  describe('called with 1 properties key and 1 matching group', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {properties: {groups: {values: ['group 1', 'group 2']}}})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups.length).to.equal(1) })
    Then(function () { expect(req.user.groups[0]).to.equal('group 1') })
  })

  describe('expecting group to be a single value', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {properties: {group: {values: ['group 1', 'group 2'], array: false}}})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.group).to.equal('group 1') })
  })

  describe('called with 2 groups', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {properties: {}})
    Given(() => options.properties.groups = {values: ['group 1', 'group 2']})
    Given(() => options.properties.departments = {values: ['dept 1', 'dept 2']})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups[0]).to.equal('group 1') })
    Then(function () { expect(req.user.departments[0]).to.equal('dept 1') })
  })

  describe('called with no value key on properties', () => {
    Given(() => req = {username: 'sam'})
    Given(() => next = () => {})
    Given(() => options = {properties: {groups: {}}})
    Then(function () { expect(activedirectoryuserobject(config, options).bind(this, req, {}, next)).to.throw(Error) })
  })

  describe('called with value key of `all` should return all groups', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {properties: {groups: {values: 'all'}}})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups.length).to.equal(3) })
  })

  describe('called with custom parse function', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {properties: {groups: {values: 'all'}}})
    Given(() => options.customParseFunction = obj => obj.dn)
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    Then(function () { expect(req.user.groups[0]).to.equal('CN=Group 1,CN=Users,DC=mediasuite,DC=local') })
  })

  describe('specifying caching for 1000 ms', () => {
    Given(() => req = {username: 'sam'})
    Given(() => options = {useCache: true, ttl: 1000, properties: {}})
    Given(() => options.properties.groups = {values: ['group 1', 'group 2']})
    When(() => middleware = activedirectoryuserobject(config, options))
    When(done => middleware(req, {}, done))
    When(done => middleware(req, {}, done))
    Then(function () { expect(adStub.calledCount).to.equal(1) })
  })
})
