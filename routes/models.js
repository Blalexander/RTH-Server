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

const templateSchema = mongoose.Schema({
  templateId: String,
  data: Object
});

templateSchema.pre('find', function(next) {
  this.populate('templates');
  next();
})

templateSchema.pre('findOne', function(next) {
  this.populate('templates');
  next();
})


const userSchema = mongoose.Schema({
  user: Object
},{strict: false});

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
  userId: String,
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

const locationsSchema = mongoose.Schema({
  userId: String,
  locations: {
    String: String
  }
},{strict: false});

locationsSchema.pre('find', function(next) {
  this.populate('locations');
  next();
})

locationsSchema.pre('findOne', function(next) {
  this.populate('locations');
  next();
})


const messagesSchema = mongoose.Schema({
  userId: String,
  messages: {
    String: String
  }
},{strict: false});

messagesSchema.pre('find', function(next) {
  this.populate('messages');
  next();
})

messagesSchema.pre('findOne', function(next) {
  this.populate('messages');
  next();
})

const Estimate = mongoose.model("estimate", estimateSchema);
const Template = mongoose.model("template", templateSchema);
const Users = mongoose.model("user", userSchema);
const Schedules = mongoose.model("schedule", scheduleSchema);
const Locations = mongoose.model("locations", locationsSchema);
const Messages = mongoose.model("messages", messagesSchema);


module.exports = { Estimate, Template, Users, Schedules, Locations, Messages };