'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: false
  },
  preferences: {
    type: Array,
    required: false
  },
  privileges: {
    type: Number,
    required: false
  },
  background: {
    type: String
  }
});

UserSchema.methods.serialize = function() {
  return {
    username: this.username || '',
    id: this._id,
    type: this.type || '',
    preferences: this.preferences || '',
    privileges: this.privileges || '',
    background: this.background || '',
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

UserSchema.pre('find', function(next) {
  this.populate('users');
  next();
})

UserSchema.pre('findOne', function(next) {
  this.populate('users');
  next();
})

const User = mongoose.model('User', UserSchema);

module.exports = {User};