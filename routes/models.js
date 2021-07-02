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


// const manifestSchema = mongoose.Schema({
//   manifest: Object
// });

// manifestSchema.pre('find', function(next) {
//   this.populate('manifest');
//   next();
// })

// manifestSchema.pre('findOne', function(next) {
//   this.populate('manifest');
//   next();
// })

const Estimate = mongoose.model("estimate", estimateSchema);
// const Mani = mongoose.model("Mani", manifestSchema);

// module.exports = mongoose.model("PGCR", pgcrSchema);
module.exports = { Estimate };