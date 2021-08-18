'use strict';

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const estimateSchema = mongoose.Schema({
  estimateId: String,
  data: Object
});

estimateSchema.pre('find', function(next) {
  this.populate('estimates');
  next();
})

estimateSchema.pre('findOne', function(next) {
  this.populate('estimates');
  next();
})


const userSchema = mongoose.Schema({
  user: Object
});

userSchema.pre('find', function(next) {
  this.populate('user');
  next();
})

userSchema.pre('findOne', function(next) {
  this.populate('user');
  next();
})

const scheduleSchema = mongoose.Schema({
  // name: {
  //   type: Object,
  //   default: undefined
  // },
  name: String,
  // data: {
  //   date: String,
  //   times: String
  // },
  details: {
    String: String
  },
  // date: String,
  // times: String
  // data: {type: String},
  // data: Object
  // data: {
  //   type: {date: String},
  //   type: {times: String}
  // }
  
},{strict: false});

scheduleSchema.pre('find', function(next) {
  this.populate('schedule');
  next();
})

scheduleSchema.pre('findOne', function(next) {
  this.populate('schedule');
  next();
})

const Estimate = mongoose.model("estimate", estimateSchema);
const Users = mongoose.model("user", userSchema);
const Schedules = mongoose.model("schedule", scheduleSchema);

module.exports = { Estimate, Users, Schedules };